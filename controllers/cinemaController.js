const multer = require('../utils/multer');
const Cinema = require('../models/cinemaModel');
const factory = require('./handlerFactory');

exports.uploadCinemaPhoto = multer.uploadSingleFile('photo');

exports.resizeCinemaPhoto = multer.resizePhoto(
  500,
  500,
  90,
  'cinema',
  'public/img/cinemas'
);

exports.createCinema = factory.createOne(Cinema);
exports.getAllCinemas = factory.getAll(Cinema);
exports.getCinema = factory.getOne(Cinema);
exports.updateCinema = factory.updateOne(Cinema);
exports.deleteCinema = factory.deleteOne(Cinema);
