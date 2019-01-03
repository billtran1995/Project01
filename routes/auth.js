const express = require("express");
const { body } = require("express-validator/check");
const router = express.Router();

const Users = require("../models/users");
const messages = require("../messages.json");

// Require controller
const authController = require("../controllers/authController");

router.get("/signup", authController.getSignUp);

router.post(
  "/signup",
  [
    // Validate email
    body("email")
      .isEmail()
      .withMessage(messages.invalidEmail)
      .custom((value, { req }) => {
        return Users.findOne({ email: value }).then(user => {
          if (user) {
            return Promise.reject(messages.emailExisted);
          }
        });
      })
      .normalizeEmail(),

    // Validate password
    body("password", messages.passMustMeetSix)
      .isLength({
        min: 6
      })
      .trim(),

    // Validate confirm password
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(messages.passMustMatch);
      }
      return true;
    })
  ],
  authController.postSignUp
);

router.get("/activate/:id", authController.getActivate);

router.get("/resend/:id", authController.getResend);

router.post("/activate/:id", authController.postActivate);

router.get("/login", authController.getLogin);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage(messages.invalidEmail)
      .normalizeEmail(),
    body("password", messages.passMustMeetSix)
      .isLength({ min: 6 })
      .trim()
  ],
  authController.postLogin
);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post(
  "/reset/:token",
  body("password", messages.passMustMeetSix)
    .isLength({ min: 6 })
    .trim(),
  authController.postNewPassword
);

module.exports = router;
