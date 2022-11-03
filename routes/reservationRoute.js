const express = require('express');
const authController = require('../controllers/authController');
const reservationController = require('../controllers/reservationController');

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('user', 'ticketAdmin', 'admin'),
    reservationController.getAllReservationsStrict('ticketAdmin', 'admin')
  )
  .post(
    authController.protect,
    authController.restrictTo('user', 'ticketAdmin', 'admin'),
    reservationController.createReservation
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('user', 'ticketAdmin', 'admin'),
    reservationController.getReservationStrict('ticketAdmin', 'admin')
  );

router
  .route('/cancel/:id')
  .patch(
    authController.protect,
    authController.restrictTo('user', 'ticketAdmin', 'admin'),
    reservationController.cancelReservation('ticketAdmin', 'admin')
  );

module.exports = router;
