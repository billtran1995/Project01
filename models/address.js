const { Schema } = require("mongoose");

const addressSchema = new Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zip: String
});

module.exports = addressSchema;
