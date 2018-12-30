const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const messages = require("../messages.json");

const Users = require("../models/users");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY
    }
  })
);

exports.getSignUp = (req, res) => {
  let message = req.flash("error");
  res.render("signup", {
    pageTitle: "Sign Up",
    isAuthenticated: false,
    errorMessage: message.length > 0 ? message : null
  });
};

exports.postSignUp = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  Users.findOne({ email }).then(user => {
    if (user) {
      req.flash("error", messages.emailExisted);
      return res.redirect("/auth/signup");
    }

    return bcrypt
      .hash(password, 12)
      .then(hashedPassword => {
        return Users.create({
          email,
          password: hashedPassword,
          contacts: []
        });
      })
      .then(createdUser => {
        req.session.isLoggedIn = true;
        req.session.user = createdUser;
        req.session.save(err => {
          res.redirect("/contacts");
          transporter
            .sendMail({
              to: email,
              from: "contact-book@node.com",
              subject: "Signup succeeded!",
              html: "<h1>You successfully signed up!</h1>"
            })
            .catch(err => {
              console.log(err);
            });
        });
        // res.redirect("/auth/login");
      })
      .catch(err => {
        console.log(err);
      });
  });
};

exports.getLogin = (req, res) => {
  let error_message = req.flash("error");
  let success_message = req.flash("success");

  res.render("login", {
    pageTitle: "Login",
    isAuthenticated: false,
    errorMessage: error_message.length > 0 ? error_message : null,
    successMessage: success_message.length > 0 ? success_message : null
  });
};

exports.postLogin = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  Users.findOne({ email })
    .then(user => {
      if (!user) {
        req.flash("error", messages.invalidEmailOrPass);
        return res.redirect("/auth/login");
      }

      bcrypt
        .compare(password, user.password)
        .then(isMatch => {
          if (isMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save(err => {
              res.redirect("/contacts");
            });
          } else {
            req.flash("error", messages.invalidEmailOrPass);
            res.redirect("/auth/login");
          }
        })
        .catch(err => {
          res.redirect("/auth/login");
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getReset = (req, res) => {
  let error_message = req.flash("error");
  let success_message = req.flash("success");
  res.render("reset", {
    pageTitle: "Reset Password",
    isAuthenticated: false,
    errorMessage: error_message.length > 0 ? error_message : null,
    successMessage: success_message.length > 0 ? success_message : null
  });
};

exports.postReset = (req, res) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/auth/reset");
    }
    const token = buffer.toString("hex");
    Users.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash("error", messages.noAccountFound);
          return res.redirect("/auth/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        transporter.sendMail({
          to: req.body.email,
          from: "contact-book@node.com",
          subject: "Password reset",
          html: `
          <p>You requested a password reset.</p>
          <p>Click this <a href="http://${
            req.headers.host
          }/auth/reset/${token}">link</a> to set a new password.</p>
        `
        });
        req.flash("success", messages.emailToResetPass);
        res.redirect("/auth/reset");
      })
      .catch(err => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res) => {
  let message = req.flash("error");
  const token = req.params.token;
  Users.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }
  })
    .then(user => {
      if (!user) {
        req.flash("error", messages.linkExpired);
        return res.redirect("/auth/reset");
      }

      res.render("new-password", {
        pageTitle: "New Password",
        isAuthenticated: false,
        token,
        errorMessage: message.length > 0 ? message : null,
        email: user.email
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res) => {
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const passwordToken = req.params.token;
  const email = req.body.email;

  Users.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    email
  })
    .then(user => {
      if (!user) {
        req.flash("error", messages.invalidToken);
        return res.redirect("/auth/login");
      }
      if (newPassword === confirmPassword) {
        return bcrypt
          .hash(newPassword, 12)
          .then(hashedPassword => {
            user.password = hashedPassword;
            user.resetToken = undefined;
            user.resetTokenExpiration = undefined;
            return user.save();
          })
          .then(saveResfult => {
            transporter.sendMail({
              to: email,
              from: "contact-book@node.com",
              subject: "Password is successfully reset",
              html: `<p>Password for ${email} is successfully reset.</p>`
            });
            req.flash("success", messages.passResetSuccess);
            res.redirect("/auth/login");
          });
      } else {
        req.flash("error", messages.passMustMatch);
        return res.redirect("back");
      }
    })
    .catch(err => {
      console.log(err);
      req.flash("error", err.message);
      res.redirect("/auth/login");
    });
};
