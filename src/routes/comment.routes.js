import { Router } from "express";

import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller";

import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // verify each route with the middleware

router.route("/:videoId").get(getVideoComments).post(addComment);

router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
