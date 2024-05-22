/* This code defines a custom error class ApiError which extends the built-in Error class. This custom error class is designed to represent errors that occur within an API. It includes properties such as statusCode, message, errors, data, and success. */
class ApiError extends Error {
  constructor(
    statusCode, // HTTP status code of the error
    message = "Something went wrong", // Error message
    errors = [], // Array of detailed errors or validation errors
    stack = "" // Stack trace of the error
  ) {
    // Call the constructor of the Error class with the provided message
    super(message);

    // Initialize properties specific to the ApiError class
    this.statusCode = statusCode; // HTTP status code
    this.data = null; // Additional data related to the error
    this.message = message; // Error message
    this.success = false; // Indicates if the operation was successful or not
    this.errors = errors; // Detailed errors or validation errors

    // If a stack trace is provided, set it; otherwise, capture the stack trace
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Export the ApiError class
export { ApiError };
