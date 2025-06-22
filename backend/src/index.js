import express from "express";
import authRoutes from "./routes/auth.route.js";
import { connectDb } from "./lib/db.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import messageRoutes from "./routes/message.route.js"
import cors from "cors";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);


const PORT = 5001;

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
    connectDb();
});

