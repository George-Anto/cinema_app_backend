const express = require('express');
const authController = require('../controllers/authController');
const sessionController = require('../controllers/sessionController');

const router = express.Router();

router
  .route('/favorite-days-and-genres-and-cult-movies')
  .get(authController.protect, sessionController.getFavoriteDaysAndGenresCult);

router
  .route('/favorite-days-and-genres-family')
  .get(
    authController.protect,
    sessionController.getFavoriteDaysAndGenresFamily
  );

router
  .route('/favorite-days-and-genres')
  .get(authController.protect, sessionController.getFavoriteDaysAndGenres);

router
  .route('/favorite-days')
  .get(authController.protect, sessionController.getFavoriteDays);

router
  .route('/favorite-days-family')
  .get(authController.protect, sessionController.getFavoriteDaysFamily);

router
  .route('/favorite-genres')
  .get(authController.protect, sessionController.getFavoriteGenres);

router
  .route('/favorite-genres-family')
  .get(authController.protect, sessionController.getFavoriteGenresFamily);

router
  .route('/')
  .get(sessionController.getAllSessions)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    sessionController.createSession
  );

router
  .route('/:id')
  .get(sessionController.getSession)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    sessionController.updateSession
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    sessionController.deleteSession
  );

module.exports = router;
