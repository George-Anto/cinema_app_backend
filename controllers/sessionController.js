const Session = require('../models/sessionModel');
const Cinema = require('../models/cinemaModel');
const Movie = require('../models/movieModel');
const Invitation = require('../models/invitationEntryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const Email = require('../utils/email');

function favDaysArray(favoriteDays) {
  const favDays = [];

  if (favoriteDays.sunday) favDays.push(1);
  if (favoriteDays.monday) favDays.push(2);
  if (favoriteDays.tuesday) favDays.push(3);
  if (favoriteDays.wednesday) favDays.push(4);
  if (favoriteDays.thursday) favDays.push(5);
  if (favoriteDays.friday) favDays.push(6);
  if (favoriteDays.saturday) favDays.push(7);

  return favDays;
}

function favGenresArray(favoriteGenres) {
  const favGenres = [];

  if (favoriteGenres.Action) {
    const obj = {};
    obj.Action = true;
    favGenres.push(JSON.stringify(obj));
  }

  if (favoriteGenres.Comedy) {
    const obj = {};
    obj.Comedy = true;
    favGenres.push(JSON.stringify(obj));
  }
  if (favoriteGenres.Drama) {
    const obj = {};
    obj.Drama = true;
    favGenres.push(JSON.stringify(obj));
  }
  if (favoriteGenres.Fantasy) {
    const obj = {};
    obj.Fantasy = true;
    favGenres.push(JSON.stringify(obj));
  }
  if (favoriteGenres.Horror) {
    const obj = {};
    obj.Horror = true;
    favGenres.push(JSON.stringify(obj));
  }
  if (favoriteGenres.Mystery) {
    const obj = {};
    obj.Mystery = true;
    favGenres.push(JSON.stringify(obj));
  }
  if (favoriteGenres.Romance) {
    const obj = {};
    obj.Romance = true;
    favGenres.push(JSON.stringify(obj));
  }
  if (favoriteGenres.Thriller) {
    const obj = {};
    obj.Thriller = true;
    favGenres.push(JSON.stringify(obj));
  }
  if (favoriteGenres.Western) {
    const obj = {};
    obj.Western = true;
    favGenres.push(JSON.stringify(obj));
  }

  return favGenres.map((info) => JSON.parse(info));
}

function parseQueryParams(req) {
  let queryStr = JSON.stringify(req.query);

  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  const jsonObj = JSON.parse(queryStr, (key, value) => {
    const intval = parseInt(value, 10);
    if (intval) {
      return intval;
    }
    return value;
  });

  return jsonObj;
}

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getFavoriteDaysAndGenresCult = catchAsync(async (req, res, next) => {
  // favoriteDays must exist
  const favDays = favDaysArray(req.user.favoriteDays);

  //Genres must exist
  const favGenres = favGenresArray(req.user.genres);

  const data = await Session.aggregate([
    {
      $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movie_doc',
      },
    },
    {
      $lookup: {
        from: 'cinemas',
        localField: 'cinema',
        foreignField: '_id',
        as: 'cinema_doc',
      },
    },
    {
      $addFields: {
        dayOfWeek: { $dayOfWeek: '$startDate' },
        Action: { $first: '$movie_doc.genres.Action' },
        Comedy: { $first: '$movie_doc.genres.Comedy' },
        Drama: { $first: '$movie_doc.genres.Drama' },
        Fantasy: { $first: '$movie_doc.genres.Fantasy' },
        Horror: { $first: '$movie_doc.genres.Horror' },
        Mystery: { $first: '$movie_doc.genres.Mystery' },
        Romance: { $first: '$movie_doc.genres.Romance' },
        Thriller: { $first: '$movie_doc.genres.Thriller' },
        Western: { $first: '$movie_doc.genres.Western' },
        familyMovie: { $first: '$movie_doc.familyMovie' },
        cultStatus: { $first: '$movie_doc.cultStatus' },
        rating: { $first: '$movie_doc.rating' },
        userAge: req.user.age,
      },
    },
    {
      $match: {
        dayOfWeek: {
          $in: favDays,
        },
      },
    },
    { $match: { $or: favGenres } },
    { $match: { cultStatus: true } },
    { $match: parseQueryParams(req) },
    { $sort: { startDate: -1, startTime: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: {
      data,
    },
  });
});

exports.getFavoriteDaysAndGenresFamily = catchAsync(async (req, res, next) => {
  // favoriteDays must exist
  const favDays = favDaysArray(req.user.favoriteDays);

  //Genres must exist
  const favGenres = favGenresArray(req.user.genres);

  const data = await Session.aggregate([
    {
      $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movie_doc',
      },
    },
    {
      $lookup: {
        from: 'cinemas',
        localField: 'cinema',
        foreignField: '_id',
        as: 'cinema_doc',
      },
    },
    {
      $addFields: {
        dayOfWeek: { $dayOfWeek: '$startDate' },
        Action: { $first: '$movie_doc.genres.Action' },
        Comedy: { $first: '$movie_doc.genres.Comedy' },
        Drama: { $first: '$movie_doc.genres.Drama' },
        Fantasy: { $first: '$movie_doc.genres.Fantasy' },
        Horror: { $first: '$movie_doc.genres.Horror' },
        Mystery: { $first: '$movie_doc.genres.Mystery' },
        Romance: { $first: '$movie_doc.genres.Romance' },
        Thriller: { $first: '$movie_doc.genres.Thriller' },
        Western: { $first: '$movie_doc.genres.Western' },
        familyMovie: { $first: '$movie_doc.familyMovie' },
        cultStatus: { $first: '$movie_doc.cultStatus' },
        rating: { $first: '$movie_doc.rating' },
        userAge: req.user.age,
      },
    },
    {
      $match: {
        dayOfWeek: {
          $in: favDays,
        },
      },
    },
    { $match: { $or: favGenres } },
    { $match: { familyMovie: true } },
    { $match: parseQueryParams(req) },
    { $sort: { startDate: -1, startTime: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: {
      data,
    },
  });
});

exports.getFavoriteDaysFamily = catchAsync(async (req, res, next) => {
  // favoriteDays must exist
  const favDays = favDaysArray(req.user.favoriteDays);

  const data = await Session.aggregate([
    {
      $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movie_doc',
      },
    },
    {
      $lookup: {
        from: 'cinemas',
        localField: 'cinema',
        foreignField: '_id',
        as: 'cinema_doc',
      },
    },
    {
      $addFields: {
        dayOfWeek: { $dayOfWeek: '$startDate' },
        Action: { $first: '$movie_doc.genres.Action' },
        Comedy: { $first: '$movie_doc.genres.Comedy' },
        Drama: { $first: '$movie_doc.genres.Drama' },
        Fantasy: { $first: '$movie_doc.genres.Fantasy' },
        Horror: { $first: '$movie_doc.genres.Horror' },
        Mystery: { $first: '$movie_doc.genres.Mystery' },
        Romance: { $first: '$movie_doc.genres.Romance' },
        Thriller: { $first: '$movie_doc.genres.Thriller' },
        Western: { $first: '$movie_doc.genres.Western' },
        familyMovie: { $first: '$movie_doc.familyMovie' },
        cultStatus: { $first: '$movie_doc.cultStatus' },
        rating: { $first: '$movie_doc.rating' },
        userAge: req.user.age,
      },
    },
    {
      $match: {
        dayOfWeek: {
          $in: favDays,
        },
      },
    },
    { $match: { familyMovie: true } },
    { $match: parseQueryParams(req) },
    { $sort: { startDate: -1, startTime: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: {
      data,
    },
  });
});

exports.getFavoriteGenresFamily = catchAsync(async (req, res, next) => {
  //Genres must exist
  const favGenres = favGenresArray(req.user.genres);

  const data = await Session.aggregate([
    {
      $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movie_doc',
      },
    },
    {
      $lookup: {
        from: 'cinemas',
        localField: 'cinema',
        foreignField: '_id',
        as: 'cinema_doc',
      },
    },
    {
      $addFields: {
        dayOfWeek: { $dayOfWeek: '$startDate' },
        Action: { $first: '$movie_doc.genres.Action' },
        Comedy: { $first: '$movie_doc.genres.Comedy' },
        Drama: { $first: '$movie_doc.genres.Drama' },
        Fantasy: { $first: '$movie_doc.genres.Fantasy' },
        Horror: { $first: '$movie_doc.genres.Horror' },
        Mystery: { $first: '$movie_doc.genres.Mystery' },
        Romance: { $first: '$movie_doc.genres.Romance' },
        Thriller: { $first: '$movie_doc.genres.Thriller' },
        Western: { $first: '$movie_doc.genres.Western' },
        familyMovie: { $first: '$movie_doc.familyMovie' },
        cultStatus: { $first: '$movie_doc.cultStatus' },
        rating: { $first: '$movie_doc.rating' },
        userAge: req.user.age,
      },
    },
    { $match: { $or: favGenres } },
    { $match: { familyMovie: true } },
    { $match: parseQueryParams(req) },
    { $sort: { startDate: -1, startTime: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: {
      data,
    },
  });
});

exports.getFavoriteDaysAndGenres = catchAsync(async (req, res, next) => {
  // favoriteDays must exist
  const favDays = favDaysArray(req.user.favoriteDays);

  //Genres must exist
  const favGenres = favGenresArray(req.user.genres);

  const data = await Session.aggregate([
    {
      $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movie_doc',
      },
    },
    {
      $lookup: {
        from: 'cinemas',
        localField: 'cinema',
        foreignField: '_id',
        as: 'cinema_doc',
      },
    },
    {
      $addFields: {
        dayOfWeek: { $dayOfWeek: '$startDate' },
        Action: { $first: '$movie_doc.genres.Action' },
        Comedy: { $first: '$movie_doc.genres.Comedy' },
        Drama: { $first: '$movie_doc.genres.Drama' },
        Fantasy: { $first: '$movie_doc.genres.Fantasy' },
        Horror: { $first: '$movie_doc.genres.Horror' },
        Mystery: { $first: '$movie_doc.genres.Mystery' },
        Romance: { $first: '$movie_doc.genres.Romance' },
        Thriller: { $first: '$movie_doc.genres.Thriller' },
        Western: { $first: '$movie_doc.genres.Western' },
        familyMovie: { $first: '$movie_doc.familyMovie' },
        cultStatus: { $first: '$movie_doc.cultStatus' },
        rating: { $first: '$movie_doc.rating' },
        userAge: req.user.age,
      },
    },
    {
      $match: {
        dayOfWeek: {
          $in: favDays,
        },
      },
    },
    { $match: { $or: favGenres } },
    { $match: parseQueryParams(req) },
    { $sort: { startDate: -1, startTime: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: {
      data,
    },
  });
});

exports.getFavoriteDays = catchAsync(async (req, res, next) => {
  // favoriteDays must exist
  const favDays = favDaysArray(req.user.favoriteDays);

  const data = await Session.aggregate([
    {
      $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movie_doc',
      },
    },
    {
      $lookup: {
        from: 'cinemas',
        localField: 'cinema',
        foreignField: '_id',
        as: 'cinema_doc',
      },
    },
    {
      $addFields: {
        dayOfWeek: { $dayOfWeek: '$startDate' },
        rating: { $first: '$movie_doc.rating' },
        userAge: req.user.age,
      },
    },
    {
      $match: {
        dayOfWeek: {
          $in: favDays,
        },
      },
    },
    { $match: parseQueryParams(req) },
    { $sort: { startDate: -1, startTime: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: {
      data,
    },
  });
});

exports.getFavoriteGenres = catchAsync(async (req, res, next) => {
  //Genres must exist
  const favGenres = favGenresArray(req.user.genres);

  const data = await Session.aggregate([
    {
      $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movie_doc',
      },
    },
    {
      $lookup: {
        from: 'cinemas',
        localField: 'cinema',
        foreignField: '_id',
        as: 'cinema_doc',
      },
    },
    {
      $addFields: {
        dayOfWeek: { $dayOfWeek: '$startDate' },
        Action: { $first: '$movie_doc.genres.Action' },
        Comedy: { $first: '$movie_doc.genres.Comedy' },
        Drama: { $first: '$movie_doc.genres.Drama' },
        Fantasy: { $first: '$movie_doc.genres.Fantasy' },
        Horror: { $first: '$movie_doc.genres.Horror' },
        Mystery: { $first: '$movie_doc.genres.Mystery' },
        Romance: { $first: '$movie_doc.genres.Romance' },
        Thriller: { $first: '$movie_doc.genres.Thriller' },
        Western: { $first: '$movie_doc.genres.Western' },
        familyMovie: { $first: '$movie_doc.familyMovie' },
        cultStatus: { $first: '$movie_doc.cultStatus' },
        userAge: req.user.age,
      },
    },

    { $match: { $or: favGenres } },
    { $match: parseQueryParams(req) },
    { $sort: { startDate: -1, startTime: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: {
      data,
    },
  });
});

exports.getFavoriteGenres = catchAsync(async (req, res, next) => {
  //Genres must exist
  const favGenres = favGenresArray(req.user.genres);

  const data = await Session.aggregate([
    {
      $lookup: {
        from: 'movies',
        localField: 'movie',
        foreignField: '_id',
        as: 'movie_doc',
      },
    },
    {
      $lookup: {
        from: 'cinemas',
        localField: 'cinema',
        foreignField: '_id',
        as: 'cinema_doc',
      },
    },
    {
      $addFields: {
        dayOfWeek: { $dayOfWeek: '$startDate' },
        Action: { $first: '$movie_doc.genres.Action' },
        Comedy: { $first: '$movie_doc.genres.Comedy' },
        Drama: { $first: '$movie_doc.genres.Drama' },
        Fantasy: { $first: '$movie_doc.genres.Fantasy' },
        Horror: { $first: '$movie_doc.genres.Horror' },
        Mystery: { $first: '$movie_doc.genres.Mystery' },
        Romance: { $first: '$movie_doc.genres.Romance' },
        Thriller: { $first: '$movie_doc.genres.Thriller' },
        Western: { $first: '$movie_doc.genres.Western' },
        familyMovie: { $first: '$movie_doc.familyMovie' },
        cultStatus: { $first: '$movie_doc.cultStatus' },
        rating: { $first: '$movie_doc.rating' },
        userAge: req.user.age,
      },
    },

    { $match: { $or: favGenres } },
    { $match: parseQueryParams(req) },
  ]);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: {
      data,
    },
  });
});

exports.createSession = catchAsync(async (req, res, next) => {
  let query = Movie.findById(req.body.movie);
  const movie = await query;

  if (!movie) {
    return next(new AppError('Movie not found.', 404));
  }

  query = Cinema.findById(req.body.cinema);
  const cinema = await query;

  if (!cinema) {
    return next(new AppError('Cinema not found.', 404));
  }

  req.body.seatsLayout = cinema.seatsLayout;
  req.body.seatsAvailable = cinema.seatsAvailable;

  const doc = await Session.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { data: doc },
  });
});

exports.updateSession = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(
    req.body,
    'startDate',
    'startTime',
    'code',
    'name',
    'movie',
    'cinema',
    'active'
  );

  if (filteredBody.cinema) {
    const query = Cinema.findById(req.body.cinema);
    const cinema = await query;

    if (!cinema) {
      return next(new AppError('Invalid cinema selection', 404));
    }

    filteredBody.seatsLayout = cinema.seatsLayout;
    filteredBody.seatsAvailable = cinema.seatsAvailable;
  }

  const updatedSession = await Session.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res
    .status(200)
    .json({ status: 'success', data: { session: updatedSession } });

  const inivitationList = await Invitation.find({
    session: req.params.id,
    $or: [
      { sessionTime: { $ne: updatedSession.startTime } },
      { cinema: { $ne: updatedSession.cinema } },
      { movie: { $ne: updatedSession.movie } },
      { sessionDate: { $ne: updatedSession.startDate } },
    ],
  });

  if (inivitationList) {
    const newSessionData = {
      sessionDate: updatedSession.startDate,
      sessionTime: updatedSession.startTime,
      cinema: updatedSession.cinema.name,
      movie: updatedSession.movie.title,
    };

    inivitationList.forEach((inivitationEntry) => {
      new Email(
        { email: inivitationEntry.email, name: req.user.name },
        ''
      ).sendSessionChanged(inivitationEntry, newSessionData);
    });
  }
});

exports.getAllSessions = factory.getAll(Session);
exports.getSession = factory.getOne(Session);
exports.deleteSession = factory.deleteOne(Session);
