class ApiError extends Error {
  constructor(message, statusCode, isUserError) {
    super(message);
    this.statusCode = statusCode;
    this.isUserError = isUserError ?? false;
  }
}

module.exports = ApiError;
