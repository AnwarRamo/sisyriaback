const successResponse = (res, { statusCode = 200, message = '', payload = null }) => {
    res.status(statusCode).json({
      message,
      payload
    });
  };
  
  module.exports = { successResponse };
  