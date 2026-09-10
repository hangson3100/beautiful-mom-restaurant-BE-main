const { Router } = require("express");

const { isLoggedIn, isAuthenticated } = require("../middlewares/auth.middleware");
const { getAllUsers, addUser, deleteUser, updateUser, updateUserPassword, getAllScopes } = require("../controllers/user.controller");

const router = Router();

router.get("/", isLoggedIn, isAuthenticated, getAllUsers);
router.get("/scopes", isLoggedIn, isAuthenticated, getAllScopes);
router.post("/add", isLoggedIn, isAuthenticated, addUser);
router.delete("/delete/:id", isLoggedIn, isAuthenticated, deleteUser);
router.post("/update/:id", isLoggedIn, isAuthenticated, updateUser);
router.post("/update-password/:id", isLoggedIn, isAuthenticated, updateUserPassword);

module.exports = router;