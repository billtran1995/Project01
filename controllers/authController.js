const User = require("../models/user");

exports.postSignUp = (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User.findOne({ $or: [{ username }, { email }] })
    .then(user => {
      if (user) {
        return res.redirect("/signup");
      }
      const user = new User({
        username,
        email,
        password,
        contacts: []
      });
      return user.save();
    })
    .then(result => {
      res.redirect("/login");
      // Todo: directly login after signup;
    })
    .catch(err => {
      console.log(err);
    });
};
