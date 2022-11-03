const express = require('express');
const authController = require('../controllers/authController');
const guestController = require('../controllers/guestController');

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'ticketAdmin'),
    guestController.getAllGuestEntries
  )
  .post(
    guestController.uploadGuestPhoto,
    guestController.resizeGuestPhoto,
    guestController.createGuestEntry
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'ticketAdmin'),
    guestController.getGuestEntry
  );

module.exports = router;
