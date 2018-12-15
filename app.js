// Require package
var express = require("express");
var bodyParser = require("body-parser");

// Initialize app
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));

app.listen(8080, () => {
  console.log("Server started");
});
