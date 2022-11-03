const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} = require('@azure/storage-blob');
const polly = require('polly-js');

// Διαπιστευτήρια σύνδεσης με το Azurite.
const credentials = new StorageSharedKeyCredential(
  process.env.AZURITE_ACCOUNT,
  process.env.AZURITE_ACCOUNT_KEY
);

// Δημιουργία στιγμιοτυπου πελάτη Blob storage υπηρεσιών.
const blobServiceClient = new BlobServiceClient(
  process.env.AZURITE_SERVERNAME,
  credentials
);

// Έλεγχος αν υπάρχει το αρχείο blob εντός του blob container.
// Εκδοχή χωρίς χρήση polly (για το retry pattern)
exports.blockBlobExists = async (containerName, blobName) => {
  const blockBlob = blobServiceClient
    .getContainerClient(containerName)
    .getBlockBlobClient(blobName);

  return await blockBlob.exists();
};

// Έλεγχος αν υπάρχει το αρχείο blob εντός του blob container.
// Εκδοχή με χρήση polly (για το retry pattern)
exports.pollyBlockBlobExists = async (containerName, blobName) => {
  const blockBlob = blobServiceClient
    .getContainerClient(containerName)
    .getBlockBlobClient(blobName);
  let cnt = 0;
  // Υλοποιηση Retry pattern μέσω polly-js.
  return polly()
    .handle((err) => err.code === 'ECONNREFUSED') // Πιάνουμε μόνο τα λάθη με κωδικό ECONNREFUSED
    .logger((err) => {
      cnt += 1;
      console.error(`Failed connecting. Will try again (#${cnt})...`, err.code); // Μετά απο αποτυχία, μήνυμα ενημέρωσης λάθους στη κονσόλα.
    })
    .waitAndRetry([100, 200, 400]) // 3 απόπειρες Retry με διαφορετικό χρονικό διάστημα αναμονής ανα απόπειρα.
    .executeForPromise(async () => {
      console.log('Trying to connect to blob storage...');
      return await blockBlob.exists(); // Αν δεν συμβεί κάποιο σφάλμα το αποτέλεσμα θα περάσει στο επόμενο βήμα της αλυσίδας then
    })
    .then(
      (result) => {
        console.log('Connected to blob storage.');
        return result; // Επιστροφή αποτελέσματος σε μορφή Promise<Boolean>
      },
      (err) => {
        console.error('Failed trying three times', err); // Μήνυμα ενημέρωσης λάθους στη κονσόλα, μετά απο όλες τις απόπειρες.
      }
    );
};

// Δημιουργία νέου Container στο blob storage εφόσον δεν υπάρχει.
exports.createContainer = async (containerName) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();
};

// Δημιουργία νέου blob αρχείου στο blob storage.
exports.createEmptyBlob = async (containerName, blobName) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const content = '';
  await blockBlobClient.upload(content, content.length);
};

exports.getBlobSize = async (containerName, blobName) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  if (await blockBlobClient.exists()) {
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    return downloadBlockBlobResponse.contentLength;
  }
  return 0;
};

// Δημιουργία Valet key για συγκεκριμένο αρχείο blob και χρονικό διάστημα.
// Το SAS token ενθυλακώνει τη λογική του Valet key για το οικοσύστημα του Microsoft Azure.
// Το επιστρεφόμενο κλειδί εκχωρεί προσωρινα το δικαιώματα ανάγνωσης.
exports.getValetKeyForReading = (containerName, blobName, minutes) => {
  const blockBlobClient = blobServiceClient
    .getContainerClient(containerName)
    .getBlockBlobClient(blobName);

  const permissions = new BlobSASPermissions();
  permissions.read = true; //Set read permission only.

  //Expire the SAS token in user defined minutes.
  const currentDateTime = new Date();

  const expiryDateTime = new Date(
    currentDateTime.setMinutes(
      currentDateTime.getMinutes() + parseInt(minutes, 10)
    )
  );

  const blobSasModel = {
    containerName: containerName,
    blobName: blobName,
    permissions: permissions,
    expiresOn: expiryDateTime,
  };

  const sasToken = generateBlobSASQueryParameters(blobSasModel, credentials);
  const sasUrl = `${blockBlobClient.url}?${sasToken}`; //return this SAS URL to the client.

  return sasUrl;
};

// Δημιουργία Valet key για συγκεκριμένο αρχείο blob και χρονικό διάστημα.
// Το SAS token ενθυλακώνει τη λογική του Valet key για το οικοσύστημα του Microsoft Azure.
// Το επιστρεφόμενο κλειδί εκχωρεί προσωρινα τα δικαιώματα εγγραφής και ανάγνωσης.
exports.getValetKeyForReadWrite = (containerName, blobName, minutes) => {
  const blockBlobClient = blobServiceClient
    .getContainerClient(containerName)
    .getBlockBlobClient(blobName);

  const permissions = new BlobSASPermissions();
  permissions.read = true; //Set read permission only.
  permissions.write = true; //Set write permission only.

  //Expire the SAS token in user defined minutes.
  const currentDateTime = new Date();
  const expiryDateTime = new Date(
    currentDateTime.setMinutes(
      currentDateTime.getMinutes() + parseInt(minutes, 10)
    )
  );

  const blobSasModel = {
    containerName: containerName,
    blobName: blobName,
    permissions: permissions,
    expiresOn: expiryDateTime,
  };

  const sasToken = generateBlobSASQueryParameters(blobSasModel, credentials);
  const sasUrl = `${blockBlobClient.url}?${sasToken}`; //return this SAS URL to the client.

  return sasUrl;
};
