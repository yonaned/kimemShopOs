
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import { isTokenBlocklisted } from "../utils/tokenStore.util.js";

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Access token required" });

    if (isTokenBlocklisted(token)) {
        return res.status(403).json({ error: "Token has been invalidated. Please log in again." });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid or expired token" });
        req.user = decoded;
        req.token = token;
        next();
    });
};