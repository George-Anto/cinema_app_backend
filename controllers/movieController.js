const multer = require('multer');
const sharp = require('sharp');
const Movie = require('../models/movieModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/jpeg')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Not a valid image file! Please upload only jpg images.',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadMoviePoster = upload.single('poster');

exports.resizeMoviePoster = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.body.poster = `movie-${req.params.id}-${Date.now()}.jpg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/movies/${req.body.poster}`);

  next();
});

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

exports.getFavoriteGenres = catchAsync(async (req, res, next) => {
  //Genres must exist
  const favGenres = favGenresArray(req.user.genres);

  const data = await Movie.aggregate([
    {
      $addFields: {
        Action: '$genres.Action',
        Comedy: '$genres.Comedy',
        Drama: '$genres.Drama',
        Fantasy: '$genres.Fantasy',
        Horror: '$genres.Horror',
        Mystery: '$genres.Mystery',
        Romance: '$genres.Romance',
        Thriller: '$genres.Thriller',
        Western: '$genres.Western',
        userAge: req.user.age,
      },
    },
    { $match: { $or: favGenres } },
    {
      $addFields: {
        Action: { $toString: '$genres.Action' },
        Comedy: { $toString: '$genres.Comedy' },
        Drama: { $toString: '$genres.Comedy' },
        Fantasy: { $toString: '$genres.Fantasy' },
        Horror: { $toString: '$genres.Horror' },
        Mystery: { $toString: '$genres.Mystery' },
        Romance: { $toString: '$genres.Romance' },
        Thriller: { $toString: '$genres.Thriller' },
        Western: { $toString: '$genres.Western' },
        newEntry: { $toString: '$newEntry' },
      },
    },
    { $match: parseQueryParams(req) },
    { $sort: { createdAt: -1 } },
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

  const data = await Movie.aggregate([
    {
      $addFields: {
        Action: '$genres.Action',
        Comedy: '$genres.Comedy',
        Drama: '$genres.Drama',
        Fantasy: '$genres.Fantasy',
        Horror: '$genres.Horror',
        Mystery: '$genres.Mystery',
        Romance: '$genres.Romance',
        Thriller: '$genres.Thriller',
        Western: '$genres.Western',
        userAge: req.user.age,
      },
    },
    { $project: { newEntry: 0 } },
    { $addFields: { newEntry: '$_newEntry' } },
    { $project: { _newEntry: 0 } },
    { $match: { $or: favGenres } },
    { $match: { familyMovie: true } },
    {
      $addFields: {
        Action: { $toString: '$genres.Action' },
        Comedy: { $toString: '$genres.Comedy' },
        Drama: { $toString: '$genres.Comedy' },
        Fantasy: { $toString: '$genres.Fantasy' },
        Horror: { $toString: '$genres.Horror' },
        Mystery: { $toString: '$genres.Mystery' },
        Romance: { $toString: '$genres.Romance' },
        Thriller: { $toString: '$genres.Thriller' },
        Western: { $toString: '$genres.Western' },
        newEntry: { $toString: '$newEntry' },
      },
    },
    { $match: parseQueryParams(req) },
    { $sort: { createdAt: -1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: {
      data,
    },
  });
});

exports.getFavoriteGenresCult = catchAsync(async (req, res, next) => {
  //Genres must exist
  const favGenres = favGenresArray(req.user.genres);

  const data = await Movie.aggregate([
    {
      $addFields: {
        Action: '$genres.Action',
        Comedy: '$genres.Comedy',
        Drama: '$genres.Drama',
        Fantasy: '$genres.Fantasy',
        Horror: '$genres.Horror',
        Mystery: '$genres.Mystery',
        Romance: '$genres.Romance',
        Thriller: '$genres.Thriller',
        Western: '$genres.Western',
        userAge: req.user.age,
      },
    },
    { $project: { newEntry: 0 } },
    { $addFields: { newEntry: '$_newEntry' } },
    { $project: { _newEntry: 0 } },
    { $match: { $or: favGenres } },
    { $match: { cultStatus: true } },
    {
      $addFields: {
        Action: { $toString: '$genres.Action' },
        Comedy: { $toString: '$genres.Comedy' },
        Drama: { $toString: '$genres.Comedy' },
        Fantasy: { $toString: '$genres.Fantasy' },
        Horror: { $toString: '$genres.Horror' },
        Mystery: { $toString: '$genres.Mystery' },
        Romance: { $toString: '$genres.Romance' },
        Thriller: { $toString: '$genres.Thriller' },
        Western: { $toString: '$genres.Western' },
        newEntry: { $toString: '$newEntry' },
      },
    },
    { $match: parseQueryParams(req) },
    { $sort: { createdAt: -1 } },
  ]);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data: {
      data,
    },
  });
});

exports.createMovie = factory.createOne(Movie);
exports.getAllMovies = factory.getAll(Movie);
exports.getMovie = factory.getOne(Movie);
exports.updateMovie = factory.updateOne(Movie);
exports.deleteMovie = factory.deleteOne(Movie);
