// Require package
var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");

// Initialize app
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
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

app.listen(8080, () => {
  console.log("Server started");
});
