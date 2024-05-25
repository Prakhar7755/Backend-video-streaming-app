/*      PROMISES CODE    */
export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

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
