import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//                            MIDDLEWARES
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
/*limiting the size of json | we also didn't used body parser*/
app.use(express.json({ limit: "16kb" }));
/*for different types of urls*/
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
/* to store static files in server */
app.use(express.static("public"));
app.use(cookieParser());

export { app };
