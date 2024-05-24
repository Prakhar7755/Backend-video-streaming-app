/*a middleware for file upload functionality of multer*/

import multer from "multer";

// Configure multer disk storage
const storage = multer.diskStorage({
  // Define the destination where uploaded files will be stored
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  // Define the filename for the uploaded file
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Create a multer instance with the configured storage options
export const upload = multer({ storage: storage });

/* The multer npm package is used in Node.js applications for handling 
multipart/form-data, which is typically used for uploading files. It simplifies 
the process of handling file uploads by parsing the incoming form data and 
storing the files on the server. */
