const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    code: {
      type: Number,
      required: [true, 'Session must have a code.'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Session must have a name.'],
    },
    startDate: {
      type: Date,
      required: [true, 'Session must be available from a date.'],
    },
    dayOfTheWeek: Number,
    startTime: {
      type: String,
      required: [true, 'Session must have a start time.'],
    },
    movie: {
      type: mongoose.Schema.ObjectId,
      ref: 'Movie',
      required: [true, 'Session must correspond to a movie.'],
    },
    cinema: {
      type: mongoose.Schema.ObjectId,
      ref: 'Cinema',
      required: [true, 'Session must be assigned to a cinema.'],
    },
    seatsLayout: {
      type: [mongoose.Schema.Types.Mixed],
    },
    seatsAvailable: {
      type: Number,
      required: [true, 'Cinema must have seats.'],
      min: 1,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Virtual populate
sessionSchema.pre(/^find/, function (next) {
  this.populate('movie', { title: 1, rating: 1 }).populate('cinema', 'name');

  next();
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
