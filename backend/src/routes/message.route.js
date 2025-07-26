import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";
import { getMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/chat/:id", protectRoute, getMessage);
router.post("/send/:id", protectRoute, sendMessage);


export default router;