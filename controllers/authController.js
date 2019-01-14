const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator/check");

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
    errorMessage: message.length > 0 ? message : null,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: ""
    },
    validationErrors: []
  });
};

exports.postSignUp = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  var user;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // status 422: validation error
    return res.status(422).render("signup", {
      pageTitle: "Sign Up",
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email,
        password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      return Users.create({
        email,
        password: hashedPassword,
        contacts: []
      });
    })
    .then(createdUser => {
      crypto.randomBytes(4, (err, buffer) => {
        if (err) {
          console.log(err);
        }
        user = createdUser;
        const passcode = buffer.toString("hex");

        user.activate.passcode = passcode;
        user.activate.passcodeExpiration = Date.now() + 3600000;
        user.save().then(result => {
          transporter.sendMail({
            to: email,
            from: "contact-book@node.com",
            subject: "Account activation",
            html: `<p>Your passcode is: ${passcode}</p>
                   <p>Passcode will expire within an hour.</p>`
          });
          req.flash(
            "success",
            "A email is sent with your activation passcode."
          );
          res.redirect("/auth/activate/" + user._id);
        });
      });
    })
    // req.session.isLoggedIn = true;
    // req.session.user = createdUser;
    // req.session.save(err => {
    //   res.redirect("/contacts");
    //   transporter
    //     .sendMail({
    //       to: email,
    //       from: "contact-book@node.com",
    //       subject: "Signup succeeded!",
    //       html: "<h1>You successfully signed up!</h1>"
    //     })
    //     .catch(err => {
    //       console.log(err);
    //     });
    // });
    // res.redirect("/auth/login");
    // })
    .catch(err => {
      return next(util.createError500(err));
    });
};

exports.getActivate = (req, res) => {
  const error_message = req.flash("error");
  const success_message = req.flash("success");

  res.render("activate", {
    pageTitle: "Activate",
    isAuthenticated: false,
    userid: req.params.id,
    errorMessage: error_message.length > 0 ? error_message : null,
    successMessage: success_message.length > 0 ? success_message : null
  });
};

exports.getResend = (req, res) => {
  const userid = req.params.id;

  Users.findById(userid)
    .then(user => {
      crypto.randomBytes(4, (err, buffer) => {
        if (err) {
          console.log(err);
        }
        const passcode = buffer.toString("hex");

        user.activate.passcode = passcode;
        user.activate.date = Date.now() + 3600000;
        user.save().then(result => {
          transporter.sendMail({
            to: user.email,
            from: "contact-book@node.com",
            subject: "Account activation",
            html: `<p>Your passcode is: ${passcode}</p>
                 <p>Passcode will expire within an hour.</p>`
          });
          res.redirect("/auth/activate" + userid);
        });
      });
    })
    .catch(err => {
      console.log(err);
      req.flash("error", "Fail to resend passcode, please try again.");
      res.redirect("/auth/activate" + userid);
    });
};

exports.postActivate = (req, res) => {
  const passcode = req.body.passcode;
  const userid = req.params.id;

  Users.findOne({
    _id: userid,
    "activate.passcode": passcode,
    "activate.passcodeExpiration": { $gt: Date.now() }
  })
    .then(user => {
      if (!user) {
        req.flash("error", "Invalid or expired passcode.");
        return res.redirect("/auth/activate" + userid);
      }

      user.activate.passcode = undefined;
      user.activate.passcodeExpiration = undefined;
      user.activate.isActivated = true;
      user.save().then(result => {
        req.session.isLoggedIn = true;
        req.session.user = user;
        req.session.save(err => {
          req.flash("success", "Your account is successfully activated.");
          res.redirect("/auth/login");
          transporter
            .sendMail({
              to: user.email,
              from: "contact-book@node.com",
              subject: "Signup succeeded!",
              html: "<h1>You successfully signed up!</h1>"
            })
            .catch(err => {
              console.log(err);
            });
        });
      });
    })
    .catch(err => {
      console.log(err);
      res.redirect("back");
    });
};

exports.getLogin = (req, res) => {
  let error_message = req.flash("error");
  let success_message = req.flash("success");

  res.render("login", {
    pageTitle: "Login",
    isAuthenticated: false,
    errorMessage: error_message.length > 0 ? error_message : null,
    oldInput: {
      email: "",
      password: ""
    },
    validationErrors: [],
    successMessage: success_message.length > 0 ? success_message : null
  });
};

exports.postLogin = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("login", {
      pageTitle: "Login",
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email,
        password
      },
      validationErrors: errors.array(),
      successMessage: null
    });
  }

  Users.findOne({ email })
    .then(user => {
      if (!user) {
        // req.flash("error", messages.invalidEmailOrPass);
        // res.redirect("/auth/login");
        return res.status(422).render("login", {
          pageTitle: "Login",
          isAuthenticated: false,
          errorMessage: messages.invalidEmailOrPass,
          oldInput: {
            email,
            password
          },
          validationErrors: [],
          successMessage: null
        });
      }

      if (user.activate.isActivated) {
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
              // req.flash("error", messages.invalidEmailOrPass);
              // res.redirect("/auth/login");
              return res.status(422).render("login", {
                pageTitle: "Login",
                isAuthenticated: false,
                errorMessage: messages.invalidEmailOrPass,
                oldInput: {
                  email,
                  password
                },
                validationErrors: [],
                successMessage: null
              });
            }
          })
          .catch(err => {
            res.redirect("/auth/login");
            console.log(err);
          });
      } else {
        req.flash("success", "An email is sent with your activation passcode.");
        res.redirect("/auth/resend/" + user._id);
      }
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
        return next(util.createError500(err));
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
        email: user.email,
        oldInput: {
          password: "",
          confirmPassword: ""
        },
        validationErrors: []
      });
    })
    .catch(err => {
      return next(util.createError500(err));
    });
};

exports.postNewPassword = (req, res) => {
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const passwordToken = req.params.token;
  const email = req.body.email;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("new-password", {
      pageTitle: "New Password",
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        password: req.body.password,
        passwordConfirm: req.body.confirmPassword
      },
      email,
      token: passwordToken,
      validationErrors: errors.array(),
      successMessage: null
    });
  }

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
