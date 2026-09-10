const { Router } = require("express");

const {
  isLoggedIn,
  isAuthenticated,
  authorize,
} = require("../middlewares/auth.middleware");
const { SCOPES } = require("../config/user.config");
const {
  getPOSInitData,
  createOrder,
  createOrderAndInvoice,
} = require("../controllers/pos.controller");

const router = Router();

router.get(
  "/init",
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.POS]),
  getPOSInitData
);
router.post(
  "/create-order",
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.POS]),
  createOrder
);
router.post(
  "/create-order-and-invoice",
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.POS]),
  createOrderAndInvoice
);

module.exports = router;
