const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const cinemaSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      required: [true, 'Cinema must have a code.'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Cinema must have a name.'],
    },
    startDate: {
      type: Date,
      required: [true, 'Cinema must be available from a date.'],
    },
    endDate: {
      type: Date,
      required: [true, 'Cinema must be available until a date.'],
    },
    seatsLayout: {
      type: [mongoose.Schema.Types.Mixed],
    },
    seatsAvailable: {
      type: Number,
      required: [true, 'Cinema must have seats.'],
      min: 1,
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },

    location: {
      longitude: { type: Number, default: 0, selected: true },
      latitude: { type: Number, default: 0, selected: true },
    },

    active: { type: Boolean, default: true },
  },

  { timestamps: true }
);

cinemaSchema.pre('save', function (next) {
  if (this.startDate > this.endDate) {
    next(new AppError('Cinema enddate must be greater than startdate.', 500));
  }
  next();
});

cinemaSchema.pre(/^findOneAnd/, function (next) {
  if (this._update.startDate > this._update.endDate) {
    next(new AppError('Cinema enddate must be greater than startdate.', 500));
  }
  next();
});

const Cinema = mongoose.model('Cinema', cinemaSchema);

module.exports = Cinema;
