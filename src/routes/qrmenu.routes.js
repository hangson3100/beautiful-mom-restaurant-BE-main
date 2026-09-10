const { Router } = require("express");
const {
  getQRMenuInit,
  createQRMenuOrder,
  searchQRMenuCustomers,
} = require("../controllers/qrmenu.controller");
const router = Router();

router.get(
  "/",
  getQRMenuInit
);
router.post("/order", createQRMenuOrder);
router.get("/customers/search", searchQRMenuCustomers);

module.exports = router;
