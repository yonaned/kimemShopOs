import jwt from "jsonwebtoken";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../index.ts";
import { usersTable, otpsTable, shopsTable } from "../db/schema.ts";
import { JWT_SECRET } from "../config/env.js";
import { normalizePhoneNumber } from "../utils/phone.util.js";
import { addTokenToBlocklist } from "../utils/tokenStore.util.js";

// 1. Send OTP
export const sendOtp = async (req, res) => {
    try {
        const rawPhoneNumber = req.body.phoneNumber;
        const phoneNumber = normalizePhoneNumber(rawPhoneNumber);

        await db
            .update(otpsTable)
            .set({ expiresAt: new Date(0) })
            .where(
                and(
                    eq(otpsTable.phoneNumber, phoneNumber),
                    eq(otpsTable.isVerified, false)
                )
            );

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.insert(otpsTable).values({
            phoneNumber,
            code: otpCode,
            expiresAt,
        });

        console.log(`[OTP DEBUG] Sent OTP ${otpCode} to ${phoneNumber}`);

        res.json({ message: "OTP sent successfully" });
    } catch (error) {
        return res.status(400).json({ error: error.message || "Invalid phone number" });
    }
};

// 2. Verify OTP & Authenticate
export const verifyOtp = async (req, res) => {
    try {
        const rawPhoneNumber = req.body.phoneNumber;
        const phoneNumber = normalizePhoneNumber(rawPhoneNumber);
        const { code } = req.body;

        const [validOtp] = await db
            .select()
            .from(otpsTable)
            .where(
                and(
                    eq(otpsTable.phoneNumber, phoneNumber),
                    eq(otpsTable.code, code),
                    gt(otpsTable.expiresAt, new Date()),
                    eq(otpsTable.isVerified, false)
                )
            )
            .limit(1);

        if (!validOtp) {
            return res.status(400).json({ error: "Invalid or expired OTP code" });
        }

        await db
            .update(otpsTable)
            .set({ isVerified: true })
            .where(eq(otpsTable.id, validOtp.id));

        let [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.phoneNumber, phoneNumber))
            .limit(1);

        let isNewUser = false;

        if (!user) {
            [user] = await db
                .insert(usersTable)
                .values({ phoneNumber })
                .returning();
            isNewUser = true;
        }

        let hasShop = false;

        if (!isNewUser) {
            const [existingShop] = await db
                .select({ id: shopsTable.id })
                .from(shopsTable)
                .where(eq(shopsTable.ownerId, user.id))
                .limit(1);

            hasShop = !!existingShop;
        }

        const token = jwt.sign(
            { id: user.id, phoneNumber: user.phoneNumber },
            JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                name: user.name,
                username: user.username,
                isProfileComplete: user.isProfileComplete,
                hasShop,
            },
            isNewUser,
        });
    } catch (error) {
        return res.status(400).json({ error: error.message || "Invalid phone number" });
    }
};

// 3. Username Availability Check
export const checkUsername = async (req, res) => {
    const { username } = req.query;

    const [existing] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.username, username))
        .limit(1);

    res.json({ available: !existing });
};

// 4. Complete User Profile & Setup Shop Profile
export const completeProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name, username, email, profilePhoto,
            shopName, shopLogo, latitude, longitude, address,
            estimatedMonthlyRevenue, businessCategory, currency,
        } = req.body;

        const [existingUsername] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.username, username))
            .limit(1);

        if (existingUsername && existingUsername.id !== userId) {
            return res.status(409).json({ error: "Username is already taken" });
        }

        const [updatedUser] = await db
            .update(usersTable)
            .set({
                name, username,
                email: email || null,
                profilePhoto: profilePhoto || null,
                isProfileComplete: true,
                updatedAt: new Date(),
            })
            .where(eq(usersTable.id, userId))
            .returning();

        const [existingShop] = await db
            .select()
            .from(shopsTable)
            .where(eq(shopsTable.ownerId, userId))
            .limit(1);

        let shop;
        const revenueValue = estimatedMonthlyRevenue ?? null;

        if (existingShop) {
            [shop] = await db
                .update(shopsTable)
                .set({
                    name: shopName,
                    logo: shopLogo || null,
                    latitude, longitude,
                    address: address || null,
                    estimatedMonthlyRevenue: revenueValue,
                    businessCategory: businessCategory || null,
                    currency,
                    updatedAt: new Date(),
                })
                .where(eq(shopsTable.id, existingShop.id))
                .returning();
        } else {
            [shop] = await db
                .insert(shopsTable)
                .values({
                    ownerId: userId,
                    name: shopName,
                    logo: shopLogo || null,
                    latitude, longitude,
                    address: address || null,
                    estimatedMonthlyRevenue: revenueValue,
                    businessCategory: businessCategory || null,
                    currency,
                })
                .returning();
        }

        res.json({
            message: "Profile and shop registration complete",
            user: updatedUser,
            shop,
        });
    } catch (error) {
        console.error("Error completing profile:", error);
        return res.status(500).json({ error: "Failed to complete profile. Please try again." });
    }
};

// 5. Logout
export const logout = (req, res) => {
    try {
        const token = req.token;
        addTokenToBlocklist(token);
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to logout" });
    }
};

// 6. Get Current User Profile & Shop
export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const [shop] = await db
            .select()
            .from(shopsTable)
            .where(eq(shopsTable.ownerId, userId))
            .limit(1);

        res.json({
            user: {
                id: user.id,
                phoneNumber: user.phoneNumber,
                name: user.name,
                username: user.username,
                email: user.email,
                profilePhoto: user.profilePhoto,
                isProfileComplete: user.isProfileComplete,
            },
            shop: shop || null,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 7. Update Profile & Shop
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        if (updates.username) {
            const [existingUsername] = await db
                .select({ id: usersTable.id })
                .from(usersTable)
                .where(eq(usersTable.username, updates.username))
                .limit(1);

            if (existingUsername && existingUsername.id !== userId) {
                return res.status(409).json({ error: "Username is already taken" });
            }
        }

        const userUpdates = {};
        if (updates.name) userUpdates.name = updates.name;
        if (updates.username) userUpdates.username = updates.username;
        if (updates.email !== undefined) userUpdates.email = updates.email || null;
        if (updates.profilePhoto !== undefined) userUpdates.profilePhoto = updates.profilePhoto || null;
        userUpdates.updatedAt = new Date();

        const [updatedUser] = await db
            .update(usersTable)
            .set(userUpdates)
            .where(eq(usersTable.id, userId))
            .returning();

        const shopUpdates = {};
        if (updates.shopName) shopUpdates.name = updates.shopName;
        if (updates.shopLogo !== undefined) shopUpdates.logo = updates.shopLogo || null;
        if (updates.latitude !== undefined) shopUpdates.latitude = updates.latitude;
        if (updates.longitude !== undefined) shopUpdates.longitude = updates.longitude;
        if (updates.address !== undefined) shopUpdates.address = updates.address || null;
        if (updates.estimatedMonthlyRevenue !== undefined) shopUpdates.estimatedMonthlyRevenue = updates.estimatedMonthlyRevenue;
        if (updates.businessCategory !== undefined) shopUpdates.businessCategory = updates.businessCategory || null;
        if (updates.currency) shopUpdates.currency = updates.currency;

        let updatedShop = null;

        const [existingShop] = await db
            .select()
            .from(shopsTable)
            .where(eq(shopsTable.ownerId, userId))
            .limit(1);

        if (Object.keys(shopUpdates).length > 0) {
            shopUpdates.updatedAt = new Date();

            if (existingShop) {
                [updatedShop] = await db
                    .update(shopsTable)
                    .set(shopUpdates)
                    .where(eq(shopsTable.id, existingShop.id))
                    .returning();
            } else {
                if (!updates.shopName) {
                    return res.status(400).json({ error: "Shop name is required to create a new shop" });
                }
                [updatedShop] = await db
                    .insert(shopsTable)
                    .values({
                        ownerId: userId,
                        name: updates.shopName,
                        logo: updates.shopLogo || null,
                        latitude: updates.latitude,
                        longitude: updates.longitude,
                        address: updates.address || null,
                        estimatedMonthlyRevenue: updates.estimatedMonthlyRevenue ?? null,
                        businessCategory: updates.businessCategory || null,
                        currency: updates.currency || "USD",
                    })
                    .returning();
            }
        }

        res.json({
            message: "Profile updated successfully",
            user: updatedUser,
            shop: updatedShop || existingShop,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
};

// 8. Delete Account
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const token = req.token;

        await db.delete(shopsTable).where(eq(shopsTable.ownerId, userId));
        await db.delete(usersTable).where(eq(usersTable.id, userId));
        addTokenToBlocklist(token);

        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ error: "Failed to delete account" });
    }
};