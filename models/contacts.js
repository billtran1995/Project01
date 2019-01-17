const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const validator = require("validator");
const phoneNumberSchema = require("./phoneNumber");
const addressSchema = require("./address");

const contactSchema = new Schema({
  firstName: {
    type: String,
    trim: true
    // required: [true, "First name is required"]
    // validate: {
    //   validator: validator.isAlpha,
    //   message: "Numbers and special characters are not allowed."
    // }
  },
  lastName: {
    type: String,
    trim: true
    // required: [true, "Last name is required"]
    // validate: {
    //   validator: validator.isAlpha,
    //   message: "Numbers and special characters are not allowed."
    // }
  },
  phoneNumber: phoneNumberSchema,
  email: {
    type: String,
    trim: true
    // validate: {
    //   validator: validator.isEmail,
    //   message: "{value} is invalid."
    // }
  },
  address: addressSchema,
  isFav: {
    type: Boolean,
    default: false
  }
});

contactSchema.virtual("fullName").get(function() {
  return this.firstName + " " + this.lastName;
});

module.exports = mongoose.model("contact", contactSchema);
