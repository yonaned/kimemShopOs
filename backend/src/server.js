import express from "express";
import cors from "cors";
import 'dotenv/config';
import { FRONTEND_URL, PORT } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors({
    origin: FRONTEND_URL,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});