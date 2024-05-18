/*      PROMISES CODE    */
const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

/*              TRY - CATCH CODE 
//below is a higher order function 
const asyncHandler = (fn) => {
  async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (e) {
      res.status(err.code || 500).json({
        success: flag,
        message: err.message,
      });
    }
  };
};
 */
