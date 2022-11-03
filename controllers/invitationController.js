const InvitationEntry = require('../models/invitationEntryModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getFriendsWatched = catchAsync(async (req, res, next) => {
  const userList = req.user.friends;

  const data = await InvitationEntry.aggregate([
    {
      $match: {
        user: {
          $in: userList,
        },
      },
    },
    {
      $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movie_doc',
      },
    },
    {
      $unset: [
        'checkin',
        'email',
        '_id',
        'sessionDate',
        'sessionTime',
        'status',
        'reservation',
        'cinema',
        'movie',
        'session',
        'user',
        'row',
        'seat',
      ],
    },
    {
      $addFields: {
        movie: { $first: '$movie_doc' },
      },
    },
    {
      $project: { movie_doc: 0 },
    },
    {
      //$group: { _id: null, uniqueValues: { $addToSet: '$movie.title' } },
      $group: {
        _id: '$movie._id',
        title: { $first: '$movie.title' },
      },
    },
  ]);

  res.status(201).json({
    status: 'success',
    results: data.length,
    data: { data },
  });
});

exports.getInvitationStats = catchAsync(async (req, res, next) => {
  const data = await InvitationEntry.aggregate([
    {
      $match: {
        user: req.user._id,
      },
    },
    {
      $group: {
        _id: { status: '$status', checkin: '$checkin' },
        count: { $sum: 1 },
      },
    },
    {
      $addFields: {
        status: '$_id.status',
        checkin: '$_id.checkin',
      },
    },
    {
      $unset: ['_id'],
    },
  ]);

  res.status(201).json({
    status: 'success',
    results: data.length,
    data: { data },
  });
});

exports.checkin = catchAsync(async (req, res, next) => {
  let query = InvitationEntry.findOne({
    _id: req.params.id,
    checkin: true,
    status: 'valid',
  });
  let invitation = await query;

  if (invitation) {
    return next(new AppError('Check-in already happened', 404));
  }

  query = InvitationEntry.findOne({
    _id: req.params.id,
    checkin: false,
    status: 'valid',
  });
  invitation = await query;

  if (!invitation) {
    return next(new AppError('No valid invitation found with that ID', 404));
  }

  invitation.checkin = true;
  invitation.checkinDate = Date.now();
  await invitation.save();

  res.status(201).json({
    status: 'success',
    data: { data: invitation },
  });
});

exports.getAllInvitationEntriesStrict = (...roles) =>
  factory.getAllStrict(InvitationEntry, ...roles);

exports.getInvitationEntryStrict = (...roles) =>
  factory.getOneStrict(InvitationEntry, false, ...roles);
