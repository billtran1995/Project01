const mongoose = require("mongoose");
const util = require("../util/util");
const { validationResult } = require("express-validator/check");

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

exports.getContactsWithPagination = (req, res, next) => {
  var currentPage = req.query.page || 1;
  var skip = contactsPerPage * currentPage - contactsPerPage;
  var userContactsID = [...req.user.contacts];
  var findQuery = { _id: { $in: userContactsID } };
  var isSearching = false;

  if (req.originalUrl.split("?")[0] === "/contacts/myfav") {
    findQuery["isFav"] = true;
  }

  if (req.query.search && req.query.searchBy) {
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    isSearching = true;

    if (req.query.searchBy === "firstName") {
      findQuery["firstName"] = { $regex: regex };
    } else {
      findQuery["lastName"] = { $regex: regex };
    }
  }

  Contacts.find(findQuery, "firstName lastName isFav", {
    skip,
    limit: contactsPerPage
  })
    .then(contacts => {
      Contacts.countDocuments({ _id: { $in: userContactsID } })
        .then(count => {
          res.render(
            req.originalUrl.split("?")[0] !== "/contacts/myfav"
              ? "contacts"
              : "myfav",
            {
              contacts,
              currentPage,
              pages: Math.ceil(count / contactsPerPage),
              search: {
                isSearching,
                searchBy: isSearching
                  ? req.query.search === "firstName"
                    ? "first name"
                    : "last name"
                  : null,
                searchValue: isSearching ? req.query.search : null
              }
            }
          );
        })
        .catch(err => {
          return next(util.createError500(err));
        });
    })
    .catch(err => {
      return next(util.createError500(err));
    });
};

exports.getCreateContactPage = (req, res) => {
  res.render("addContact", {
    pageTitle: "Add Contact",
    errorMessage: [],
    oldInput: {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      home: "",
      work: "",
      street: "",
      city: "",
      state: "",
      country: "",
      zip: ""
    }
  });
};

exports.createContact = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("addContact", {
      pageTitle: "Add Contact",
      errorMessage: errors.array(),
      oldInput: {
        firstName: req.body.firstName || "",
        lastName: req.body.lastName || "",
        email: req.body.email || "",
        mobile: req.body.mobile || "",
        home: req.body.home || "",
        work: req.body.work || "",
        street: req.body.street || "",
        city: req.body.city || "",
        state: req.body.state || "",
        country: req.body.country || "",
        zip: req.body.zip || ""
      }
    });
  }

  Contacts.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: {
      mobile: req.body.mobile || null,
      home: req.body.home || null,
      work: req.body.work || null
    },
    email: req.body.email || null,
    address: {
      street: req.body.street || null,
      city: req.body.city || null,
      state: req.body.state || null,
      country: req.body.country || null,
      zip: req.body.zip || null
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
      return next(util.createError500(err));
    });
};

exports.getContactById = (req, res, next) => {
  Contacts.findById({ _id: mongoose.Types.ObjectId(req.params.id) })
    .then(contact => {
      // res.json(contact);
      res.render("show", { contact });
    })
    .catch(err => {
      return next(util.createError500(err));
    });
};

exports.getUpdateForm = (req, res) => {
  Contacts.findById({ _id: mongoose.Types.ObjectId(req.params.id) }).then(
    contact => {
      // res.json(contact);
      res.render("update", {
        pageTitle: "Update Form",
        contact,
        errorMessage: []
      });
    }
  );
};

exports.updateContact = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("update", {
      pageTitle: "Update Form",
      errorMessage: errors.array(),
      contact: {
        _id: req.params.id,
        firstName: req.body.firstName || "",
        lastName: req.body.lastName || "",
        email: req.body.email || "",
        phoneNumber: {
          mobile: req.body.mobile || "",
          home: req.body.home || "",
          work: req.body.work ? req.body.work : ""
        },
        address: {
          street: req.body.street || "",
          city: req.body.city || "",
          state: req.body.state || "",
          country: req.body.country || "",
          zip: req.body.zip || ""
        }
      }
    });
  }

  Contacts.updateOne(
    { _id: mongoose.Types.ObjectId(req.params.id) },
    {
      $set: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: {
          mobile: req.body.mobile || null,
          home: req.body.home || null,
          work: req.body.work || null
        },
        email: req.body.email || null,
        address: {
          street: req.body.street || null,
          city: req.body.city || null,
          state: req.body.state || null,
          country: req.body.country || null,
          zip: req.body.zip || null
        }
      }
    }
  )
    .then(result => {
      res.redirect("/contacts/" + req.params.id);
    })
    .catch(err => {
      return next(util.createError500(err));
    });
};

exports.deleteContact = (req, res, next) => {
  const id = mongoose.Types.ObjectId(req.params.id);
  req.user.contacts.pull(id);
  req.user.save(err => {
    if (err) {
      // return next(util.createError500(err));
      return res.status(500).json({ message: "Failed to delete contact." });
    }

    Contacts.deleteOne({
      _id: id
    })
      .then(deletedContact => {
        // res.json(deletedContact);
        // res.redirect("back");
        res.status(200).json({ message: "Delete contact successfully." });
      })
      .catch(err => {
        return next(util.createError500(err));
      });
  });
};

exports.addToFav = (req, res, next) => {
  const id = mongoose.Types.ObjectId(req.body._id);
  const isFav = Boolean(req.body.isFav);
  Contacts.updateOne({ _id: id }, { $set: { isFav } })
    .then(result => {
      res.status(200).json({ message: "Added to favorite" });
    })
    .catch(err =>
      res.status(500).json({ message: "Failed to add to favorite" })
    );
};
