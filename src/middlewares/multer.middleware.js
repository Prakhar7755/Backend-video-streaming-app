import multer from "multer";

// multer disk storage configured

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// MIDDLEWARE PROVIDES A REQ.FILES

// export const upload = multer({ storage: storage });
export const upload = multer({ storage });
