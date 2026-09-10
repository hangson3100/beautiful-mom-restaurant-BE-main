const express = require('express');
const router = express.Router();
const timeSlotController = require('../controllers/deliveryTimeSlot.controller');
const { isLoggedIn, isAuthenticated, authorize } = require('../middlewares/auth.middleware');
const { SCOPES } = require('../config/user.config');

const protectTimeSlotRoute = [
	isLoggedIn,
	isAuthenticated,
	authorize([SCOPES.DELIVERY_TIME_SLOTS]),
];

router.get('/', ...protectTimeSlotRoute, timeSlotController.getAllTimeSlots);
router.post('/', ...protectTimeSlotRoute, timeSlotController.createTimeSlot);
router.put('/:id', ...protectTimeSlotRoute, timeSlotController.updateTimeSlot);
router.delete('/:id', ...protectTimeSlotRoute, timeSlotController.deleteTimeSlot);

module.exports = router;