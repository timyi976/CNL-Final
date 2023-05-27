import { Router } from "express";
import ChatRouter from "./chat.js";

const router = Router();
router.use("/", ChatRouter);

export default router;
