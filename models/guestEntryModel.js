const mongoose = require('mongoose');
const validator = require('validator');

const guestEntrySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'A guest must have a name!'] },
  surname: { type: String, required: [true, 'A guest must have a surname!'] },
  email: {
    type: String,
    required: [true, 'A guest must have an email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  mobilePhone: {
    type: String,
    required: [true, 'A guest must have a mobile phone number'],
    validate: [
      validator.isMobilePhone,
      'Please provide a valid mobile phone number',
    ],
  },
  photo: {
    type: String,
    required: [true, 'Please provide your photo'],
  },
});

const GuestEntry = mongoose.model('GuestLog', guestEntrySchema);

module.exports = GuestEntry;
