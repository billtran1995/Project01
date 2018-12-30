// Require package
require("dotenv").load();
const express = require("express");
const mongoose = require("mongoose");
const faker = require("faker");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const MongodbStore = require("connect-mongodb-session")(session);
const { isAuthenticated } = require("./middlewares/middleware");
const flash = require("connect-flash");

// Require model
const Contacts = require("./Models/contacts"); // only for generate fake data
const Users = require("./models/users");

// Require routes
const contactsRoutes = require("./routes/contacts");
const authRoutes = require("./routes/auth");

var connectionString =
  "mongodb://Billchan1995:B02044594@ds119728.mlab.com:19728/db01";
var connectionStringForLocal = "mongodb://localhost:27017/DB01_test";
mongoose.Promise = global.Promise;

// Setup session store
const sessionStore = new MongodbStore({
  uri: connectionStringForLocal,
  collection: "session"
});

// Initialize app
var app = express();
app.set("view engine", "ejs");
app.set("views", "views");
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "This is secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore
  })
);
app.use(flash());
app.use(express.static(__dirname + "/public"));

// Connect DB
mongoose.connect(
  connectionStringForLocal,
  { useNewUrlParser: true }
);

mongoose.connection
  .once("open", () => console.log("DB connection established"))
  .on("error", error => {
    return console.warn("Warning: ", error);
  });

// For dev only * Remove when deploy
// app.get("/generate-fake-data/:number/:email", (req, res) => {
//   for (let i = 0; i < req.params.number; i++) {
//     Contacts.create({
//       firstName: faker.name.firstName(),
//       lastName: faker.name.lastName(),
//       email: faker.internet.email(),
//       phoneNumber: {
//         mobile: faker.phone.phoneNumber(),
//         home: faker.phone.phoneNumber(),
//         work: faker.phone.phoneNumber()
//       },
//       address: {
//         street: faker.address.streetAddress(),
//         city: faker.address.city(),
//         state: faker.address.state(),
//         country: faker.address.country(),
//         zip: faker.address.zipCode()
//       }
//     }).then(contact => {
//       Users.updateOne(
//         { email: req.params.email },
//         { $push: { contacts: contact._id } }
//       )
//         .then(result => console.log(result))
//         .catch(err => console.log(err));
//     });
//   }
//   res.redirect("/contacts");
// });

// Main
app.get("/", (req, res) => {
  res.render("landing");
});

// app.use("/auth", authRoutes);
app.use("/contacts", isAuthenticated);

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use("/contacts", contactsRoutes);
app.use("/auth", authRoutes);
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    res.redirect("/");
  });
});

app.use((req, res) =>
  res.status(404).render("404", { pageTitle: "404 Page Not Found" })
);

app.listen(8080, () => {
  console.log("Server started");
});
