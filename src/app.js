import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Enabling CORS with specified origin and allowing credentials
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

// Middleware for parsing incoming JSON data and limiting its size to 16kb
app.use(express.json({ limit: "16kb" }));

// Middleware for parsing URL-encoded data and extending the URL limit to 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Middleware for serving static files from the 'public' directory
app.use(express.static("public"));

// Middleware for parsing cookies
app.use(cookieParser());

export { app };
