const express = require("express");
const router = express.Router();
const { body } = require("express-validator/check");
const messages = require("../messages.json");

// Require controller
const contactsController = require("../controllers/contactsController");

// Contacts
// router.get("/", contactsController.getContacts);
router.get("/", contactsController.getContactsWithPagination);

router.get("/create", contactsController.getCreateContactPage);

router.post(
  "/create",
  [
    body("firstName")
      .exists({ checkFalsy: true })
      .withMessage("First name is required"),
    body("lastName")
      .exists({ checkFalsy: true })
      .withMessage("Last name is required"),
    body("email")
      .isEmail()
      .withMessage(messages.invalidEmail)
      .optional({ checkFalsy: true }),
    body("mobile", "Mobile number needs to be in digits")
      .isNumeric()
      .optional({ checkFalsy: true }),
    body("home", "Home number needs to be in digits")
      .isNumeric()
      .optional({ checkFalsy: true }),
    body("work", "Work number needs to be in digits")
      .isNumeric()
      .optional({ checkFalsy: true }),
    body("street").optional({ checkFalsy: true }),
    body("city").optional({ checkFalsy: true }),
    body("state").optional({ checkFalsy: true }),
    body("country").optional({ checkFalsy: true }),
    body("zip").optional({ checkFalsy: true })
  ],
  contactsController.createContact
);

router.get("/:id", contactsController.getContactById);

router.get("/:id/update", contactsController.getUpdateForm);

router.patch(
  "/:id/update",
  [
    body("firstName")
      .exists({ checkFalsy: true })
      .withMessage("First name is required"),
    body("lastName")
      .exists({ checkFalsy: true })
      .withMessage("Last name is required"),
    body("email")
      .isEmail()
      .withMessage(messages.invalidEmail)
      .optional({ checkFalsy: true }),
    body("mobile", "Mobile number needs to be in digits")
      .isNumeric()
      .optional({ checkFalsy: true }),
    body("home", "Home number needs to be in digits")
      .isNumeric()
      .optional({ checkFalsy: true }),
    body("work", "Work number needs to be in digits")
      .isNumeric()
      .optional({ checkFalsy: true }),
    body("street").optional({ checkFalsy: true }),
    body("city").optional({ checkFalsy: true }),
    body("state").optional({ checkFalsy: true }),
    body("country").optional({ checkFalsy: true }),
    body("zip").optional({ checkFalsy: true })
  ],
  contactsController.updateContact
);

router.delete("/:id", contactsController.deleteContact);

module.exports = router;
