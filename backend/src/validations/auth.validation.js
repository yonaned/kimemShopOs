import Joi from "joi";

export const sendOtpSchema = Joi.object({
    phoneNumber: Joi.string().trim().required().messages({
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
    }),
});

export const verifyOtpSchema = Joi.object({
    phoneNumber: Joi.string().trim().required(),
    code: Joi.string().trim().length(6).required().messages({
        "string.length": "OTP code must be exactly 6 characters",
        "any.required": "OTP code is required",
    }),
});

export const checkUsernameSchema = Joi.object({
    username: Joi.string().trim().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required().messages({
        "string.empty": "Username query parameter required",
        "string.pattern.base": "Username can only contain letters, numbers, and underscores",
    }),
});

export const completeProfileSchema = Joi.object({
    name: Joi.string().trim().required(),
    username: Joi.string().trim().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).required(),
    email: Joi.string().email().allow(null, "").optional(),
    profilePhoto: Joi.string().uri().allow(null, "").optional(),
    shopName: Joi.string().trim().required(),
    shopLogo: Joi.string().uri().allow(null, "").optional(),
    latitude: Joi.number().min(-90).max(90).required().messages({
        "number.min": "Latitude must be between -90 and 90",
        "number.max": "Latitude must be between -90 and 90",
    }),
    longitude: Joi.number().min(-180).max(180).required().messages({
        "number.min": "Longitude must be between -180 and 180",
        "number.max": "Longitude must be between -180 and 180",
    }),
    address: Joi.string().allow(null, "").optional(),
    estimatedMonthlyRevenue: Joi.number().min(0).allow(null).optional(),
    businessCategory: Joi.string().allow(null, "").optional(),
    currency: Joi.string().length(3).uppercase().default("USD").optional(),
});

export const updateProfileSchema = Joi.object({
    name: Joi.string().trim().optional(),
    username: Joi.string().trim().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).optional(),
    email: Joi.string().email().allow(null, "").optional(),
    profilePhoto: Joi.string().uri().allow(null, "").optional(),
    shopName: Joi.string().trim().optional(),
    shopLogo: Joi.string().uri().allow(null, "").optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    address: Joi.string().allow(null, "").optional(),
    estimatedMonthlyRevenue: Joi.number().min(0).allow(null).optional(),
    businessCategory: Joi.string().allow(null, "").optional(),
    currency: Joi.string().length(3).uppercase().optional(),
}).min(1);