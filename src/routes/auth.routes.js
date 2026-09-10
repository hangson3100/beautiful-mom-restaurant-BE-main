const { Router } = require("express");
const { signIn, signOut, getNewAccessToken, removeDeviceAccessToken, getDevices } = require("../controllers/auth.controller");
const { isLoggedIn, isAuthenticated, hasRefreshToken } = require("../middlewares/auth.middleware");

const router = Router();

router.post("/signin", signIn);
router.post("/signout", isLoggedIn, isAuthenticated, signOut);
router.post("/refresh-token", hasRefreshToken, getNewAccessToken);
router.post("/remove-device", isLoggedIn, isAuthenticated, removeDeviceAccessToken);
router.get("/devices", isLoggedIn, isAuthenticated, getDevices);

module.exports = router;