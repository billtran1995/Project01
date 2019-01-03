module.exports = {
  createError505: err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return error;
  }
};
