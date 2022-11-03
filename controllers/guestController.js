const multer = require('../utils/multer');
const GuestEntry = require('../models/guestEntryModel');
const factory = require('./handlerFactory');

exports.uploadGuestPhoto = multer.uploadSingleFile('photo');

exports.resizeGuestPhoto = multer.resizePhoto(
  500,
  500,
  90,
  'guest',
  'public/img/guests'
);

exports.createGuestEntry = factory.createOne(GuestEntry);
exports.getAllGuestEntries = factory.getAll(GuestEntry);
exports.getGuestEntry = factory.getOne(GuestEntry);
