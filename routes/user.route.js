import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { userDetails } from "../controllers/user.controller.js";

const userRouter = express.Router();

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Get current user details
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details fetched
 */
userRouter.get("/", authenticate, userDetails);

export default userRouter;