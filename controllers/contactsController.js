const mongoose = require("mongoose");

const contactsPerPage = 10;

// Require model
const Contacts = require("../Models/contacts");
const Users = require("../models/users");

// exports.getContacts = (req, res) => {
//   Contacts.find({ $in: [...req.session.user.contacts] }).then(contacts => {
//     // res.json(contacts);
//     res.render("contacts", { contacts });
//   });
// };

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

exports.getContactsWithPagination = (req, res) => {
  var currentPage = req.query.page || 1;
  var skip = contactsPerPage * currentPage - contactsPerPage;
  var userContactsID = [...req.user.contacts];
  var findQuery = { _id: { $in: userContactsID } };

  if (req.query.search && req.query.searchBy) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    if (req.query.searchBy === "firstName") {
      findQuery["firstName"] = { $regex: regex };
    } else {
      findQuery["lastName"] = { $regex: regex };
    }
    console.log(findQuery);
  }

  Contacts.find(findQuery, "firstName lastName", {
    skip,
    limit: contactsPerPage
  })
    .then(contacts => {
      Contacts.countDocuments({ _id: { $in: userContactsID } })
        .then(count => {
          res.render("contacts", {
            contacts,
            currentPage,
            pages: Math.ceil(count / contactsPerPage)
          });
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
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
      req.user.contacts.push(contact._id);
      req.user.save(() => {
        res.redirect("/contacts");
      });
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
    .then(result => {
      res.redirect("/contacts/" + req.params.id);
    })
    .catch(err => {
      res.status(406).json(err);
    });
};

exports.deleteContact = (req, res) => {
  const id = mongoose.Types.ObjectId(req.params.id);
  req.user.contacts.pull(id);
  req.user.save(err => {
    Contacts.deleteOne({
      _id: id
    }).then(deletedContact => {
      // res.json(deletedContact);
      res.redirect("back");
    });
  });
};
