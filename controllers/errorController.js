exports.get404 = (req, res) => {
  res.status(404).render("404", { pageTitle: "404 Page Not Found" });
};

exports.get505 = (req, res) => {
  res.status(500).render("500", { pageTitle: "500 An Error Occurred" });
};
