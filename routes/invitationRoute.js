const express = require('express');
const authController = require('../controllers/authController');
const invitationController = require('../controllers/invitationController');

const router = express.Router();

router
  .route('/your-friends-watched')
  .get(authController.protect, invitationController.getFriendsWatched);

router
  .route('/user-invitation-stats')
  .get(authController.protect, invitationController.getInvitationStats);

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('user', 'ticketAdmin', 'admin'),
    invitationController.getAllInvitationEntriesStrict('ticketAdmin', 'admin')
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('user', 'ticketAdmin', 'admin'),
    invitationController.getInvitationEntryStrict('ticketAdmin', 'admin')
  );

router
  .route('/checkin/:id')
  .patch(
    authController.protect,
    authController.restrictTo('user', 'ticketAdmin', 'admin'),
    invitationController.checkin
  );

module.exports = router;
