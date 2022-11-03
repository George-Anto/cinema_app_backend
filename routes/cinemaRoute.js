const express = require('express');
const authController = require('../controllers/authController');
const cinemaController = require('../controllers/cinemaController');

const router = express.Router();

router
  .route('/')
  .get(cinemaController.getAllCinemas)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'ticketAdmin'),
    cinemaController.createCinema
  );

router
  .route('/:id')
  .get(cinemaController.getCinema)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'ticketAdmin'),
    cinemaController.uploadCinemaPhoto,
    cinemaController.resizeCinemaPhoto,
    cinemaController.updateCinema
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'ticketAdmin'),
    cinemaController.deleteCinema
  );

module.exports = router;
