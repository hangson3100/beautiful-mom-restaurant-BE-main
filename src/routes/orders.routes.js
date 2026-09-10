const { Router } = require("express");

const {
  isLoggedIn,
  isAuthenticated,
  authorize,
} = require("../middlewares/auth.middleware");
const { SCOPES } = require("../config/user.config");
const {
  getOrders,
  getOrdersInit,
  updateKitchenOrderItemStatus,
  cancelKitchenOrder,
  completeKitchenOrder,
  getOrdersPaymentSummary,
  payAndCompleteKitchenOrder,
} = require("../controllers/orders.controller");

const router = Router();

router.get(
  "/",
  isLoggedIn,
  isAuthenticated,
  authorize([
    SCOPES.POS,
    SCOPES.ORDERS,
    SCOPES.ORDER_STATUS,
    SCOPES.ORDER_STATUS_DISPLAY,
  ]),
  getOrders
);
router.get(
  "/init",
  isLoggedIn,
  isAuthenticated,
  authorize([
    SCOPES.POS,
    SCOPES.ORDERS,
    SCOPES.ORDER_STATUS,
    SCOPES.ORDER_STATUS_DISPLAY,
  ]),
  getOrdersInit
);

router.post(
  "/update-status/:id",
  isLoggedIn,
  isAuthenticated,
  authorize([
    SCOPES.POS,
    SCOPES.ORDERS,
    SCOPES.ORDER_STATUS,
    SCOPES.ORDER_STATUS_DISPLAY,
  ]),
  updateKitchenOrderItemStatus
);
router.post(
  "/cancel",
  isLoggedIn,
  isAuthenticated,
  authorize([
    SCOPES.POS,
    SCOPES.ORDERS,
    SCOPES.ORDER_STATUS,
    SCOPES.ORDER_STATUS_DISPLAY,
  ]),
  cancelKitchenOrder
);
router.post(
  "/complete",
  isLoggedIn,
  isAuthenticated,
  authorize([
    SCOPES.POS,
    SCOPES.ORDERS,
    SCOPES.ORDER_STATUS,
    SCOPES.ORDER_STATUS_DISPLAY,
  ]),
  completeKitchenOrder
);

router.post(
  "/complete-order-payment-summary",
  isLoggedIn,
  isAuthenticated,
  authorize([
    SCOPES.POS,
    SCOPES.ORDERS,
    SCOPES.ORDER_STATUS,
    SCOPES.ORDER_STATUS_DISPLAY,
  ]),
  getOrdersPaymentSummary
);
router.post(
  "/complete-and-pay-order",
  isLoggedIn,
  isAuthenticated,
  authorize([
    SCOPES.POS,
    SCOPES.ORDERS,
    SCOPES.ORDER_STATUS,
    SCOPES.ORDER_STATUS_DISPLAY,
  ]),
  payAndCompleteKitchenOrder
);

module.exports = router;
