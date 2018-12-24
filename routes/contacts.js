const express = require("express");
const router = express.Router();

// Require controller
const contactsController = require("../controllers/contactsController");

// Contacts
router.get("/", contactsController.getContacts);

router.get("/create", contactsController.getCreateContactPage);

router.post("/create", contactsController.createContact);

router.get("/:id", contactsController.getContactById);

router.get("/:id/update", contactsController.getUpdateForm);

router.patch("/:id/update", contactsController.updateContact);

router.delete("/:id", contactsController.deleteContact);

module.exports = router;
