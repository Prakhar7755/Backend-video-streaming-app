const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

//  OR

// A WRAPPER FUNCTION
// const asyncHandler = (func) => {
//   return async (req, res, next) => {
//     try {
//       return await func(req, res, next);
//     } catch (err) {
//       res.status(err.code || 500).json({
//         success: false,
//         message: err.message,
//       });
//     }
//   };
// };
// export { asyncHandler };
