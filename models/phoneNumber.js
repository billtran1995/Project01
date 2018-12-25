const { Schema } = require("mongoose");

const phoneNumberSchema = new Schema({
  mobile: {
    type: String,
    trim: true
    // minlength: [10, "Phone number needs 10 digits number."],
    // maxlength: [10, "Phone number needs 10 digits number."]
  },
  home: {
    type: String,
    trim: true
    // minlength: [10, "Phone number needs 10 digits number."],
    // maxlength: [10, "Phone number needs 10 digits number."]
  },
  work: {
    type: String,
    trim: true
    // minlength: [10, "Phone number needs 10 digits number."],
    // maxlength: [10, "Phone number needs 10 digits number."]
  }
});

module.exports = phoneNumberSchema;
