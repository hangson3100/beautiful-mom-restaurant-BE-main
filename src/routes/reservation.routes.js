const { Router } = require("express");

const {
  isLoggedIn,
  isAuthenticated,
  authorize,
} = require("../middlewares/auth.middleware");
const { SCOPES } = require("../config/user.config");
const {
  addReservation,
  updateReservation,
  cancelReservation,
  deleteReservation,
  searchReservation,
  getReservations,
  initReservation,
} = require("../controllers/reservation.controller");

const router = Router();

router.post(
  "/add",
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.RESERVATIONS, SCOPES.MANAGE_RESERVATIONS]),
  addReservation
);
router.post(
  "/update/:id",
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.RESERVATIONS, SCOPES.MANAGE_RESERVATIONS]),
  updateReservation
);
router.post(
  "/cancel/:id",
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.RESERVATIONS, SCOPES.MANAGE_RESERVATIONS]),
  cancelReservation
);
router.delete(
  "/delete/:id",
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.RESERVATIONS, SCOPES.MANAGE_RESERVATIONS]),
  deleteReservation
);

router.get(
  "/search",
  isLoggedIn,
  isAuthenticated,
  authorize([
    SCOPES.RESERVATIONS,
    SCOPES.MANAGE_RESERVATIONS,
    SCOPES.VIEW_RESERVATIONS,
  ]),
  searchReservation
);
router.get(
  "/",
  isLoggedIn,
  isAuthenticated,
  authorize([
    SCOPES.RESERVATIONS,
    SCOPES.MANAGE_RESERVATIONS,
    SCOPES.VIEW_RESERVATIONS,
  ]),
  getReservations
);

router.get(
  "/init",
  isLoggedIn,
  isAuthenticated,
  authorize([
    SCOPES.RESERVATIONS,
    SCOPES.MANAGE_RESERVATIONS,
    SCOPES.VIEW_RESERVATIONS,
  ]),
  initReservation
);


module.exports = router;
