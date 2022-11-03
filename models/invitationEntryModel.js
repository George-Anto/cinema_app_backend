const mongoose = require('mongoose');

const invitationEntrySchema = new mongoose.Schema(
  {
    email: String,
    status: String,
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Αn invitation must involve a registered user!'],
    },
    sessionTime: String,
    sessionDate: Date,
    reservation: {
      type: mongoose.Schema.ObjectId,
      ref: 'Reservation',
      required: [true, 'Αn invitation must involve a reservation!'],
    },
    cinema: {
      type: mongoose.Schema.ObjectId,
      ref: 'Cinema',
      required: [true, 'Αn invitation must involve a cinema!'],
    },
    session: {
      type: mongoose.Schema.ObjectId,
      ref: 'Session',
      required: [true, 'Αn invitation must involve a session!'],
    },
    movie: {
      type: mongoose.Schema.ObjectId,
      ref: 'Movie',
      required: [true, 'Αn invitation must involve a movie!'],
    },
    row: Number,
    seat: Number,
    checkin: {
      type: Boolean,
      default: false,
    },
    checkinDate: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  { timestamps: true }
);

//Virtual populate
invitationEntrySchema.pre(/^find/, function (next) {
  this.populate('movie', 'title')
    .populate('cinema', 'name')
    .populate('reservation', 'createdAt')
    .populate('session', {
      startDate: 1,
      startTime: 1,
      name: 1,
      movie: 0,
      cinema: 0,
    })
    .populate('user', { name: 1, surname: 1, mobilePhone: 1 });
  next();
});

invitationEntrySchema.post('save', function () {
  this.populate('movie', 'title')
    .populate('cinema', 'name')
    .populate('session', {
      startDate: 1,
      startTime: 1,
      name: 1,
      movie: 0,
      cinema: 0,
    })
    .populate('reservation', 'createdAt')
    .populate('user', { name: 1, surname: 1, mobilePhone: 1 });
});

const invitationEntry = mongoose.model('InvitationLog', invitationEntrySchema);
module.exports = invitationEntry;
