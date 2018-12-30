const express = require("express");
const router = express.Router();

// Require controller
const authController = require("../controllers/authController");

router.get("/signup", authController.getSignUp);

router.post("/signup", authController.postSignUp);

router.get("/login", authController.getLogin);

router.post("/login", authController.postLogin);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/reset/:token", authController.postNewPassword);

module.exports = router;
