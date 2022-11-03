const multer = require('multer');
const sharp = require('sharp');
const AppError = require('./appError');
const catchAsync = require('./catchAsync');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/jpg') ||
    file.mimetype.startsWith('image/jpeg')
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Not a valid image file! Please upload only jpg images.',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadSingleFile = (name) => upload.single(name);

exports.resizePhoto = (x, y, quality, collection, path) =>
  catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    let fullpath;

    if (collection === 'user') {
      req.file.filename = `${collection}-${req.user.id}-${Date.now()}.jpg`;
      fullpath = `${path}/${req.file.filename}`;
    } else if (collection === 'cinema') {
      req.body.photo = `${collection}-${req.params.id}-${Date.now()}.jpg`;
      fullpath = `${path}/${req.body.photo}`;
    } else if (collection === 'movie') {
      req.body.poster = `${collection}-${req.params.id}-${Date.now()}.jpg`;
      fullpath = `${path}/${req.body.poster}`;
    } else if (collection === 'guest') {
      req.body.photo = `${collection}-${Date.now()}.jpg`;
      fullpath = `${path}/${req.body.photo}`;
    }

    await sharp(req.file.buffer)
      .resize(x, y)
      .toFormat('jpeg')
      .jpeg({ quality: quality })
      .toFile(fullpath);

    next();
  });
