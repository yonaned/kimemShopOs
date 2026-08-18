import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    sendOtpSchema,
    verifyOtpSchema,
    checkUsernameSchema,
    completeProfileSchema,
    updateProfileSchema
} from "../validations/auth.validation.js";
import {
    sendOtp,
    verifyOtp,
    checkUsername,
    completeProfile,
    logout,
    getMe,
    updateProfile,
    deleteAccount
} from "../controllers/auth.controller.js";

const router = Router();

const sendOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Too many OTP requests, please try again later." },
});

const verifyOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many verification attempts, please try again later." },
});

// Auth Routes
router.post("/send-otp", sendOtpLimiter, validate(sendOtpSchema, "body"), sendOtp);
router.post("/verify-otp", verifyOtpLimiter, validate(verifyOtpSchema, "body"), verifyOtp);
router.get("/check-username", validate(checkUsernameSchema, "query"), checkUsername);
router.post("/complete-profile", authenticateToken, validate(completeProfileSchema, "body"), completeProfile);
router.post("/logout", authenticateToken, logout);
router.get("/me", authenticateToken, getMe);
router.delete("/delete-account", authenticateToken, deleteAccount);

// User Profile Route
router.patch("/update-profile", authenticateToken, validate(updateProfileSchema, "body"), updateProfile);

export default router;