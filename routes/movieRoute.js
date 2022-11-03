const express = require('express');
const authController = require('../controllers/authController');
const movieController = require('../controllers/movieController');

const router = express.Router();

router
  .route('/favorite-genres')
  .get(authController.protect, movieController.getFavoriteGenres);

router
  .route('/favorite-genres-family')
  .get(authController.protect, movieController.getFavoriteGenresFamily);

router
  .route('/favorite-genres-cult-movies')
  .get(authController.protect, movieController.getFavoriteGenresCult);

router
  .route('/')
  .get(movieController.getAllMovies)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'ticketAdmin'),
    movieController.createMovie
  );

router
  .route('/:id')
  .get(movieController.getMovie)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'ticketAdmin'),
    movieController.uploadMoviePoster,
    movieController.resizeMoviePoster,
    movieController.updateMovie
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'ticketAdmin'),
    movieController.deleteMovie
  );

module.exports = router;
