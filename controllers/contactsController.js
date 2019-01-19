const mongoose = require("mongoose");
const util = require("../util/util");
const request = require("request");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator/check");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY
    }
  })
);

const contactsPerPage = 5;

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
  var findQuery = (countQuery = { _id: { $in: userContactsID } });
  var isSearching = false;
  var path = req.originalUrl.split("?")[0];

  if (req.originalUrl.split("?")[0] === "/contacts/myfav") {
    findQuery["isFav"] = true;
    countQuery["isFav"] = true;
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
      Contacts.countDocuments(countQuery)
        .then(count => {
          res.render(path !== "/contacts/myfav" ? "contacts" : "myfav", {
            path,
            contacts,
            currentPage,
            pages: Math.ceil(count / contactsPerPage),
            search: {
              isSearching,
              searchBy: isSearching
                ? req.query.search === "firstName"
                  ? "firstName"
                  : "lastName"
                : null,
              searchValue: isSearching ? req.query.search : null
            }
          });
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

exports.getLocation = (req, res, next) => {
  let street = req.query.street;
  let city = req.query.city;
  let state = req.query.state;
  let country = req.query.country;
  let address = `${street}, ${city}, ${state}, ${country}`;

  let encodedText = encodeURIComponent(address);
  request(
    {
      url: `https://maps.googleapis.com/maps/api/geocode/json?key=${
        process.env.MAP_API_KEY
      }&address=${encodedText}`,
      json: true
    },
    (err, response, body) => {
      if (err) {
        return res.json({ status: "ERROR" });
      } else if (response.statusCode === 400) {
        return res.json({ status: "ZERO_RESULTS" });
      } else if (response.statusCode === 200) {
        if (body.status === "OK") {
          return res.json({
            // latitude: body.results[0].geometry.location.lat,
            // longitude: body.results[0].geometry.location.lng,
            address: body.results[0].formatted_address,
            status: "OK"
          });
        } else {
          return res.json({ status: "ZERO_RESULTS" });
        }
      }
    }
  );
};

exports.shareContact = async (req, res, next) => {
  let _id = mongoose.Types.ObjectId(req.body.id);
  let toEmail = req.body.toEmail;
  let contact;

  try {
    contact = await Contacts.findById({ _id });
    user = await Users.findOne({ contacts: _id });

    transporter.sendMail(
      {
        to: toEmail,
        from: "contact-book@node.com",
        subject: `${contact.firstName}'s Contact`,
        html: `
             <p>${contact.fullName}</p>
             <table>
                <tr>
                  <th>Address</th>
                </tr>
                <tr>
                  <td>Street: ${contact.address.street || "None"}</td>
                </tr>
                <tr>
                  <td>City: ${contact.address.city || "None"}</td>
                  <td>State: ${contact.address.state || "None"}</td>
                </tr>
                <tr>
                  <td>Country: ${contact.address.country || "None"}</td>
                  <td>ZIP: ${contact.address.zip || "None"}</td>
                </tr>
                <tr>
                  <th>Email</th>
                </tr>
                <tr>
                  <td>Email: ${contact.email || "None"}</td>
                </tr>
                <tr>
                  <th>Phone Number</th>
                </tr>
                <tr>
                  <td>Mobile: ${contact.phoneNumber.mobile || "None"}</td>
                </tr>
                <tr>
                  <td>Work: ${contact.phoneNumber.home || "None"}</td>
                </tr>
                <tr>
                  <td>Home: ${contact.phoneNumber.email || "None"}</td>
                </tr>
             </table>
             <p>Share by ${user.email}</p>`
      },
      (err, info) => {
        if (err) {
          return res.json({ status: "Error" });
        }

        return res.json({ status: "OK" });
      }
    );
  } catch (err) {
    return res.json({ status: "Error" });
  }
};

exports.getContactPDF = async (req, res, next) => {
  const _id = mongoose.Types.ObjectId(req.params.id);

  try {
    const contact = await Contacts.findById({ _id });
    const PDFcontact = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="Contact.pdf"');
    PDFcontact.pipe(res);

    PDFcontact.fontSize(30).text(contact.fullName);
    PDFcontact.fontSize(20).text("-------");
    PDFcontact.text("ADDRESS");
    PDFcontact.text("-------");
    PDFcontact.text("Street: " + (contact.address.street || "none"));
    PDFcontact.text("City: " + (contact.address.city || "none"));
    PDFcontact.text("State: " + (contact.address.state || "none"));
    PDFcontact.text("Country: " + contact.address.country || "none");
    PDFcontact.text("Zip: " + contact.address.city || "none");
    PDFcontact.text("-----");
    PDFcontact.text("EMAIL");
    PDFcontact.text("-----");
    PDFcontact.text("Email: " + (contact.email || "none"));
    PDFcontact.text("-----");
    PDFcontact.text("Phone");
    PDFcontact.text("-----");
    PDFcontact.text("Mobile: " + (contact.phoneNumber.mobile || "none"));
    PDFcontact.text("Home: " + (contact.phoneNumber.home || "none"));
    PDFcontact.text("Work: " + (contact.phoneNumber.work || "none"));
    PDFcontact.end();
  } catch (err) {
    return next(err);
  }
};
