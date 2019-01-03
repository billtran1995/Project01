const Users = require("../models/users");

module.exports = {
  isAuthenticated: (req, res, next) => {
    if (!req.session.user && !req.session.isLoggedIn) {
      return res.redirect("/auth/login");
    }

    Users.findById(req.session.user._id)
      .then(user => {
        if (!user) {
          return next();
        }
        req.user = user;
        next();
      })
      .catch(err => {
        // throw new Error(err); This will not trigger the error handler
        // Inside async code, next should be use to trigger the error handler
        next(new Error(err));
      });
  }
};
