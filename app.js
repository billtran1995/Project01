// Require package
const express = require("express");
const mongoose = require("mongoose");
const faker = require("faker");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

// Require model
const Contacts = require("./Models/contacts"); // only for generate fake data

// Require routes
const contactsRoutes = require("./routes/contacts");

// Initialize app
var app = express();
app.set("view engine", "ejs");
app.set("views", "views");
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

//DB setup
var connectionString =
  "mongodb://Billchan1995:B02044594@ds119728.mlab.com:19728/db01";
var connectionStringForLocal = "mongodb://localhost:27017/DB01_test";
mongoose.Promise = global.Promise;

mongoose.connect(
  connectionStringForLocal,
  { useNewUrlParser: true }
);

mongoose.connection
  .once("open", () => console.log("DB connection established"))
  .on("error", error => {
    return console.warn("Warning: ", error);
  });

// Main
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/contacts", contactsRoutes);

app.get("/generate-fake-data/:number", (req, res) => {
  for (let i = 0; i < req.params.number; i++) {
    var contact = new Contacts();

    contact.firstName = faker.name.firstName();
    contact.lastName = faker.name.lastName();
    contact.email = faker.internet.email();
    contact.phoneNumber = {
      mobile: faker.phone.phoneNumber(),
      home: faker.phone.phoneNumber(),
      work: faker.phone.phoneNumber()
    };
    contact.address = {
      street: faker.address.streetAddress(),
      city: faker.address.city(),
      state: faker.address.state(),
      country: faker.address.country(),
      zip: faker.address.zipCode()
    };

    contact.save(err => {
      if (err) throw err;
    });
  }
  res.redirect("/contacts");
});

app.use((req, res) =>
  res.status(404).render("404", { pageTitle: "404 Page Not Found" })
);

app.listen(8080, () => {
  console.log("Server started");
});
