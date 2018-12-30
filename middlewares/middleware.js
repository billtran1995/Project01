const Users = require("../models/users");

module.exports = {
  isAuthenticated: (req, res, next) => {
    if (!req.session.user && !req.session.isLoggedIn) {
      return res.redirect("/auth/login");
    }

    Users.findById(req.session.user._id)
      .then(user => {
        req.user = user;
        next();
      })
      .catch(err => console.log(err));
  }
};
