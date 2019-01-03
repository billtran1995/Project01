const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const validator = require("validator");

const userSchema = new Schema({
  // username: {
  //   type: String,
  //   trim: true,
  //   unique: true,
  //   minlength: [6, "Username must have at least 6 characters"],
  //   required: [true, "Username is required"]
  // },
  email: {
    type: String,
    trim: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: "{value} is not a valid email"
    }
  },
  password: {
    type: String,
    require: true,
    minlength: [6, "Password must have at least 6 characters"]
  },
  resetToken: String,
  resetTokenExpiration: Date,
  activate: {
    isActivated: { type: Boolean, default: false },
    passcode: String,
    passcodeExpiration: Date
  },
  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "contacts"
    }
  ]
});

module.exports = mongoose.model("user", userSchema);

// Todo:
// Need validator to check if username has:
// - at least 1 number and special character
// Need validator to check if password has:
// - at least 1 number and special character
