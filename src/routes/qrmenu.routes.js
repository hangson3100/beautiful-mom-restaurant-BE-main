const { Router } = require("express");
const {
  getQRMenuInit,
  createQRMenuOrder,
  searchQRMenuCustomers,
  getQRMenuOrdersStatuses,
} = require("../controllers/qrmenu.controller");
const router = Router();

router.get(
  "/",
  getQRMenuInit
);
router.post("/order", createQRMenuOrder);
router.post("/orders-status", getQRMenuOrdersStatuses);
router.get("/customers/search", searchQRMenuCustomers);

module.exports = router;
