const mongoose = require("mongoose");

// Require model
const Contacts = require("../Models/contacts");

exports.getContacts = (req, res) => {
  Contacts.find().then(contacts => {
    // res.json(contacts);
    res.render(
      "contacts",
      contacts.length > 0 ? { contacts } : { contacts: null }
    );
  });
};

exports.getCreateContactPage = (req, res) => {
  res.render("addContact");
};

exports.createContact = (req, res) => {
  Contacts.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: {
      mobile: req.body.mobile ? req.body.mobile : null,
      home: req.body.home ? req.body.home : null,
      work: req.body.work ? req.body.work : null
    },
    email: req.body.email,
    address: {
      street: req.body.street ? req.body.street : null,
      city: req.body.city ? req.body.city : null,
      state: req.body.state ? req.body.state : null,
      country: req.body.country ? req.body.country : null,
      zip: req.body.zip ? req.body.zip : null
    }
  })
    .then(contact => {
      // res.json(contact);
      res.redirect("/contacts");
    })
    .catch(err => {
      res.status(406).json(err);
    });
};

exports.getContactById = (req, res) => {
  Contacts.findById({ _id: mongoose.Types.ObjectId(req.params.id) }).then(
    contact => {
      // res.json(contact);
      res.render("show", { contact });
    }
  );
};

exports.getUpdateForm = (req, res) => {
  Contacts.findById({ _id: mongoose.Types.ObjectId(req.params.id) }).then(
    contact => {
      // res.json(contact);
      res.render("update", {
        contact
      });
    }
  );
};

exports.updateContact = (req, res) => {
  Contacts.updateOne(
    { _id: mongoose.Types.ObjectId(req.params.id) },
    {
      $set: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: {
          mobile: req.body.mobile ? req.body.mobile : null,
          home: req.body.home ? req.body.home : null,
          work: req.body.work ? req.body.work : null
        },
        email: req.body.email,
        address: {
          street: req.body.street ? req.body.street : null,
          city: req.body.city ? req.body.city : null,
          state: req.body.state ? req.body.state : null,
          country: req.body.country ? req.body.country : null,
          zip: req.body.zip ? req.body.zip : null
        }
      }
    }
  )
    .then(updatedContact => {
      // res.json(updatedContact);
      res.redirect("/contacts/" + req.params.id);
    })
    .catch(err => {
      res.status(406).json(err);
    });
};

exports.deleteContact = (req, res) => {
  Contacts.deleteOne({
    _id: mongoose.Types.ObjectId(req.params.id)
  }).then(deletedContact => {
    // res.json(deletedContact);
    res.redirect("back");
  });
};
