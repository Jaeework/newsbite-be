const errorHandler = (error, request, response, _next) => {
  if (error.isUserError) {
    return response.status(error.statusCode).json({
      success: false,
      isUserError: true,
      message: error.message,
    });
  }

  console.error("예상치 못한 에러:", error);
  return response.status(error.statusCode ?? 500).json({
    success: false,
    isUserError: false,
    message: null,
  });
};

module.exports = errorHandler;
