const mongoose = require('mongoose');
const validator = require('validator');
const AppError = require('../utils/appError');

const reservationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: [true, 'Session must have a status.'],
      default: 'valid',
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Reservation can oly be made by a registered user.'],
    },
    session: {
      type: mongoose.Schema.ObjectId,
      ref: 'Session',
      required: [true, 'Reservation must correspond to a session.'],
    },
    reservedSeats: {
      type: Number,
      required: [true, 'Reservation must have seats.'],
      min: 1,
    },
    reservedSeatsLayout: {
      type: [mongoose.Schema.Types.Mixed],
      validate: [
        function (value) {
          return this.reservedSeats === value.length;
        },
        'Different number of reserved seats and reserved seats layout.',
      ],
    },
    notificationList: {
      type: [String],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  { timestamps: true }
);

reservationSchema.pre('save', function (next) {
  if (this.notificationList.length !== this.reservedSeats) {
    next(
      new AppError(
        'Notification list email count and reserved seats number must match exactly.',
        500
      )
    );
  } else if (!this.notificationList.every((item) => validator.isEmail(item))) {
    next(new AppError('Notification list contains invalid emails', 500));
  }
  next();
});

reservationSchema.virtual('invitations', {
  ref: 'InvitationLog',
  foreignField: 'reservation',
  localField: '_id',
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
