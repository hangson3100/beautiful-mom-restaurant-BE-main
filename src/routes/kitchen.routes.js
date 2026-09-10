const { Router } = require("express");

const { isLoggedIn, isAuthenticated,
    authorize,
  } = require("../middlewares/auth.middleware");
  const { SCOPES } = require("../config/user.config");
const { getKitchenOrders, updateKitchenOrderItemStatus } = require("../controllers/kitchen.controller");

const router = Router();

router.get("/", isLoggedIn, isAuthenticated, authorize([SCOPES.KITCHEN, SCOPES.KITCHEN_DISPLAY]), getKitchenOrders);
router.post("/:id", isLoggedIn, isAuthenticated, authorize([SCOPES.KITCHEN, SCOPES.KITCHEN_DISPLAY]), updateKitchenOrderItemStatus);

module.exports = router;