const validator = require('validator');
const Reservation = require('../models/reservationModel');
const Session = require('../models/sessionModel');
const InvitationEntry = require('../models/invitationEntryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const Email = require('../utils/email');

exports.createReservation = catchAsync(async (req, res, next) => {
  req.body.user = req.user.id;

  const query = Session.findById(req.body.session);
  const session = await query;

  if (!(session instanceof Session)) {
    return next(new AppError('Session not found.', 404));
  }

  if (!req.body.reservedSeats || req.body.reservedSeats < 1) {
    return next(new AppError('Reserved seats number problem.', 500));
  }

  // Seats not defined check
  if (!req.body.reservedSeatsLayout) {
    return next(new AppError('Reserved seats layout problem.', 500));
  }

  // Duplicate seats in request check
  for (let i = 0; i < req.body.reservedSeatsLayout.length; i += 1) {
    const lhs = JSON.stringify(req.body.reservedSeatsLayout[i]);
    for (let j = i + 1; j < req.body.reservedSeatsLayout.length; j += 1) {
      const rhs = JSON.stringify(req.body.reservedSeatsLayout[j]);
      if (lhs === rhs) {
        return next(
          new AppError(
            'Reservation request cannot contain duplicate seats',
            500
          )
        );
      }
    }
  }

  // Notification list not defined check
  if (!req.body.notificationList) {
    return next(new AppError('Notification list problem.', 500));
  }

  // Seat count vs email count matching check
  if (req.body.reservedSeats !== req.body.reservedSeatsLayout.length) {
    return next(
      new AppError(
        'Different number of reserved seats and reserved seats layout.',
        500
      )
    );
  }

  // Seat count vs email count matching check
  if (req.body.reservedSeats !== req.body.notificationList.length) {
    return next(
      new AppError(
        'Notification list email count and reserved seats number must match exactly.',
        500
      )
    );
  }

  // Notification list contains valid emails check
  if (!req.body.notificationList.every((item) => validator.isEmail(item))) {
    next(new AppError('Notification list contains invalid emails', 500));
  }

  const sessionId = session.id;
  const seats = req.body.reservedSeatsLayout;

  const seatsQuery = [];
  const setSeatsSelection = {};

  // Building the where and set clauses
  for (let i = 0; i < seats.length; i += 1) {
    const seatSelector = {};
    const seatSelection = `seatsLayout.${seats[i][0]}.${seats[i][1]}`;
    // Part of $and query to check if seat is free
    seatSelector[seatSelection] = 0;
    seatsQuery.push(seatSelector);
    // Part of $set operation to set seat as occupied
    setSeatsSelection[seatSelection] = 1;
  }

  const result = await Session.updateOne(
    { _id: sessionId, $and: seatsQuery },
    {
      $set: setSeatsSelection,
      $inc: { seatsAvailable: -seats.length },
    }
  );

  // Seats were already reserved for the session check
  if (result.nModified === 0) {
    return next(
      new AppError('Reservation cancelled: Seats already reserved.', 500)
    );
  }

  const reservation = await Reservation.create(req.body);

  // Creating the invitation entries for the reservation
  if (reservation instanceof Reservation) {
    await Promise.all(
      reservation.notificationList.map(async (item, i) => {
        const invitationEntry = new InvitationEntry();
        invitationEntry.email = item;
        invitationEntry.sessionDate = session.startDate;
        invitationEntry.sessionTime = session.startTime;
        invitationEntry.status = reservation.status;
        invitationEntry.reservation = reservation.id;
        invitationEntry.cinema = session.cinema;
        invitationEntry.movie = session.movie;
        invitationEntry.session = reservation.session;
        invitationEntry.user = reservation.user;
        invitationEntry.row = reservation.reservedSeatsLayout[i][0];
        invitationEntry.seat = reservation.reservedSeatsLayout[i][1];
        await invitationEntry.save();

        // populate virtual entry docs
        const popInvitationEntry = await InvitationEntry.findById(
          invitationEntry.id
        );

        new Email(
          { email: item, name: popInvitationEntry.user.name },
          ''
        ).sendInvitation(popInvitationEntry);
      })
    );
  }

  res.status(201).json({
    status: 'success',
    data: { data: reservation },
  });
});

exports.cancelReservation = (...roles) =>
  catchAsync(async (req, res, next) => {
    let query = Reservation.findOne({
      _id: req.params.id,
      status: 'cancelled',
    });
    let reservation = await query;

    if (reservation) {
      return next(new AppError('Reservation already cancelled', 404));
    }

    query = Reservation.findOne({ _id: req.params.id, status: 'valid' });
    reservation = await query;

    if (!reservation) {
      return next(new AppError('No valid reservation found with that ID', 404));
    }

    // Same user check, admin can cancel every user
    if (!roles.includes(req.user.role)) {
      if (JSON.stringify(req.user.id) !== JSON.stringify(reservation.user)) {
        return next(
          new AppError(
            'Cannot cancel reservation, it was created by a different user',
            404
          )
        );
      }
    }

    const sessionId = reservation.session;
    const seats = reservation.reservedSeatsLayout;

    const seatsQuery = [];
    const setSeatsSelection = {};

    // Building the where and set clauses
    for (let i = 0; i < seats.length; i += 1) {
      const seatSelector = {};
      const seatSelection = `seatsLayout.${seats[i][0]}.${seats[i][1]}`;
      // Part of $and query to check if seat is free
      seatSelector[seatSelection] = 1;
      seatsQuery.push(seatSelector);
      // Part of $set operation to set seat as occupied
      setSeatsSelection[seatSelection] = 0;
    }

    let result = await Session.updateOne(
      { _id: sessionId, $and: seatsQuery },
      {
        $set: setSeatsSelection,
        $inc: { seatsAvailable: seats.length },
      }
    );

    // Seats were already available, so we are at failed state.
    if (result.nModified === 0) {
      return next(new AppError('Reservation cancellation failed.', 500));
    }

    reservation.status = 'cancelled';

    result = await InvitationEntry.updateMany(
      { reservation: reservation.id },
      {
        $set: { status: 'cancelled' },
      }
    );

    // Invitation log update failed.
    if (result.nModified === 0) {
      return next(new AppError('Invitation log cancellation failed.', 500));
    }

    await reservation.save();

    res.status(201).json({
      status: 'success',
      data: { data: reservation },
    });
  });

exports.getAllReservationsStrict = (...roles) =>
  factory.getAllStrict(Reservation, ...roles);

exports.getReservationStrict = (...roles) =>
  factory.getOneStrict(Reservation, false, ...roles);
