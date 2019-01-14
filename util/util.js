module.exports = {
  createError500: err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return error;
  }
};
