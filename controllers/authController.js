const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const cloudPatterns = require('../utils/cloudPatterns');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      //Date.now() + process.send.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV.substring(0, 10) === 'production')
    cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  user.passwordChangedAt = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Η συνάρτηση θα επιστρέψει ενα read only link για τον blob αρχείο
// εφόσον έχει επιτευχθεί σύνδεση με το blob service και προφανώς
// το αρχείο υπάρχει.
const returnReadOnlyLinkIfExists = (user, statusCode, req, res) => {
  let link = 'No file found for user ';
  let blobStorageConnectionStatus = 'Connected';
  // Αν το blockExists έχει τύπο undefined σημαίνει οτι στο προηγούμενο
  // βήμα δεν υπήρχε σύνδεση με το blob service.
  if (typeof req.blockExists === 'undefined') {
    blobStorageConnectionStatus = 'Unable to connect';
    link = 'Unknown';
    // Αν το req.blockExists είναι αληθές, σημαίνει οτι το blob αρχείο υπάρχει
    // ήδη εντός του container. Τότε και μόνο τότε δημιουργούμε read-only link
    // προς αυτό (μαζί με το valet key) .
  } else if (req.blockExists) {
    link = cloudPatterns.getValetKeyForReading(
      process.env.USER_CONTAINER_NAME,
      req.blobName,
      process.env.READ_VALET_KEY_EXPIRES_IN
    );
  }

  res.status(statusCode).json({
    status: 'success',
    BlobStorageConnectionStatus: blobStorageConnectionStatus,
    data: {
      user,
      readOnlyAzurelink: link,
      BlobSize: req.blobSize,
    },
  });
};

// Η συνάρτηση θα δημιουργήσει ενα νέο αρχείο blob και κατόπιν θα επιστρέψει
// ενα read-write link προς αυτό.
// Προϋπόθεση για τα παραπάνω, ότι έχει επιτευχθεί σύνδεση με το blob service.
const returnReadWriteLink = (user, statusCode, req, res) => {
  let blobStorageConnectionStatus = 'Connected';
  let link = 'Unknown';

  // Αν το blockExists έχει τύπο undefined σημαίνει οτι στο προηγούμενο
  // βήμα δεν υπήρχε σύνδεση με το blob service.
  if (typeof req.blockExists === 'undefined') {
    blobStorageConnectionStatus = 'Unable to connect';
  } else {
    // Αν το req.blockExists είναι ψευδές, σημαίνει οτι το blob αρχείο δεν υπάρχει
    // εντός του container. Δημιουργουμε συνεπώς πρώτα τον container ενώ κατόπιν
    // ενα κενό blob αρχείο.
    if (!req.blockExists) {
      cloudPatterns.createContainer(process.env.USER_CONTAINER_NAME);
      cloudPatterns.createEmptyBlob(
        process.env.USER_CONTAINER_NAME,
        req.blobName
      );
    }
    // Στο σημείο είτε έχουμε δημιουργήσει ένα νέο blob αρχείο, είτε το αρχείο
    // υπάρχει απο πριν. Μπορουμε συνεπώς με ασφάλεια να δημιουργήσουμε το
    // read-write link προς αυτό (μαζί με το valet key) .
    link = cloudPatterns.getValetKeyForReadWrite(
      process.env.USER_CONTAINER_NAME,
      req.blobName,
      process.env.WRITE_VALET_KEY_EXPIRES_IN
    );
  }

  res.status(statusCode).json({
    status: 'success',
    BlobStorageConnectionStatus: blobStorageConnectionStatus,
    data: {
      user,
      ReadWriteAzurelink: link,
      BlobSize: req.blobSize,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  createSendToken(newUser, 201, res);

  //const url = `${req.protocol}://${req.get('host')}/me`;
  const url = '';
  new Email(newUser, url).sendWelcome();
});

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  // 1) Check is username and password exists
  if (!username || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ username }).select('+password');
  // problem if user is unknown
  //const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect username or password!', 401));
  }

  // 3) If everything is ok send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Getting the token and check if its there.
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Token Verification, throws error if token is invalid
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError('The user belonging to the token no longer exists.', 401)
    );

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.,401')
    );
  }

  //GRANT ACCESS TO THE NEXT MIDDLEWARE (PROTECTED ROUTE)
  req.user = currentUser;

  next();
});

exports.fetchMyReadOnlyLink = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError('User no lonfer exists.', 401));
  req.blobName = `${user._id}.${process.env.USER_BLOB_FILE_EXTENSION}`;

  // Η κλήση αν και ασύγχρονη θα αναμένει να ολοκληρωθούν ο έλεγχος αλλά και οι
  // απόπειρες του polly προτου συνεχίσει.
  req.blockExists = await cloudPatterns.pollyBlockBlobExists(
    process.env.USER_CONTAINER_NAME,
    req.blobName
  );

  // Για διευκόλυνση του front-end το τελικό response θα περιέχει το μέγεθος του
  // blob.
  if (typeof req.blockExists !== 'undefined') {
    req.blobSize = await cloudPatterns.getBlobSize(
      process.env.USER_CONTAINER_NAME,
      req.blobName
    );
  } else {
    req.blobSize = 0;
  }

  // Η συνάρτηση θα επιστρέψει ενα read only link για τον blob αρχείο
  // εφόσον έχει επιτευχθεί σύνδεση με το blob service και προφανώς
  // το αρχείο υπάρχει.
  returnReadOnlyLinkIfExists(user, 200, req, res);
});

exports.fetchMyReadWriteLink = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError('User no lonfer exists.', 401));
  req.blobName = `${user._id}.${process.env.USER_BLOB_FILE_EXTENSION}`;

  // Η κλήση αν και ασύγχρονη θα αναμένει να ολοκληρωθούν ο έλεγχος αλλά και οι
  // απόπειρες του polly προτου συνεχίσει.
  req.blockExists = await cloudPatterns.pollyBlockBlobExists(
    process.env.USER_CONTAINER_NAME,
    req.blobName
  );

  // Για διευκόλυνση του front-end το τελικό response θα περιέχει το μέγεθος του
  // blob.
  if (typeof req.blockExists !== 'undefined') {
    req.blobSize = await cloudPatterns.getBlobSize(
      process.env.USER_CONTAINER_NAME,
      req.blobName
    );
  } else {
    req.blobSize = 0;
  }

  // Η συνάρτηση θα δημιουργήσει ενα νέο αρχείο blob και κατόπιν θα επιστρέψει
  // ενα read-write link προς αυτό.
  // Προϋπόθεση για τα παραπάνω, ότι έχει επιτευχθεί σύνδεση με το blob service.
  returnReadWriteLink(user, 200, req, res);
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  // 2) Generate the random reset Token
  const resetToken = user.createPasswordResetToken();
  // disable model validations during save
  await user.save({ validateBeforeSave: false });

  // 3) send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    new Email(user, resetURL).sendPasswordReset();

    res
      .status(200)
      .json({ status: 'success', message: 'Token send to email!' });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the mail. Try again later!', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // validations not must run
  await user.save();

  // 3) Update changedPasswordAt property for the  user
  // 4) Log the user is, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if posted password is correctPassword
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  if (req.body.password !== req.body.passwordConfirm) {
    return next(new AppError('New passwords dont match.', 401));
  }

  // 3) If so, update password with the
  user.password = req.body.password;
  user.passwordConfirm = req.body.password;
  await user.save();

  // 4) Log user is, send JWT
  createSendToken(user, 200, res);
});
