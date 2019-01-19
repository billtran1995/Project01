// Require package
require("dotenv").load();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const MongodbStore = require("connect-mongodb-session")(session);
const { isAuthenticated } = require("./middlewares/middleware");
const flash = require("connect-flash");
const csrf = require("csurf");
const helmet = require("helmet");

const errorController = require("./controllers/errorController");

const csrfProtection = csrf();

// Require routes
const contactsRoutes = require("./routes/contacts");
const authRoutes = require("./routes/auth");

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
app.use(helmet());
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

// Main
app.get("/", (req, res) => {
  res.render("landing");
});

// app.use("/auth", authRoutes);
app.use(csrfProtection);
app.use("/contacts", isAuthenticated);

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/contacts", contactsRoutes);
app.use("/auth", authRoutes);
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    res.redirect("/");
  });
});

app.get("/500", errorController.get505);

app.use(errorController.get404);

// Error handling middleware
// This will catch every error thrown
app.use((error, req, res, next) => {
  // res.redirect("/500");
  // The above should be careful, cause it may trigger infinite loop
  // especially when middleware run on all route
  // middleware throw error => this handle and redirect => middleware throw error => ...repeatedly
  res.status(500).render("500", { pageTitle: "500 An Error Occurred" });
});

app.listen(8080, () => {
  console.log("Server started");
});
