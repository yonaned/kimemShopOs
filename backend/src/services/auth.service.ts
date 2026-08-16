import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';

export const registerUser = async (name: string, email: string, password: string) => {
  const existingUser = await db.select().from(users).where(eq(users.email, email));
  if (existingUser.length > 0) {
    throw new ApiError(409, 'Email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  return { message: 'User registered successfully. Please request an OTP.' };
};

export const sendOtp = async (email: string) => {
  const user = await db.select().from(users).where(eq(users.email, email));
  if (user.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.update(users).set({
    otp,
    otpExpiresAt: expiresAt,
  }).where(eq(users.email, email));

  console.log(`\n========================================\n`);
  console.log(`OTP for ${email}: ${otp}`);
  console.log(`\n========================================\n`);

  return { message: 'OTP generated successfully. Check the backend console.' };
};

export const verifyOtp = async (email: string, otp: string) => {
  const user = await db.select().from(users).where(eq(users.email, email));
  if (user.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  if (!user[0].otp || !user[0].otpExpiresAt) {
    throw new ApiError(400, 'No OTP requested. Please request an OTP first.');
  }

  if (user[0].otpExpiresAt < new Date()) {
    throw new ApiError(400, 'OTP has expired. Please request a new one.');
  }

  if (user[0].otp !== otp) {
    throw new ApiError(400, 'Invalid OTP');
  }

  await db.update(users).set({
    isVerified: true,
    otp: null,
    otpExpiresAt: null,
  }).where(eq(users.email, email));

  return { message: 'Account verified successfully. You can now login.' };
};

export const loginUser = async (email: string, password: string) => {
  const user = await db.select().from(users).where(eq(users.email, email));
  if (user.length === 0) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user[0].password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!user[0].isVerified) {
    throw new ApiError(403, 'Account not verified. Please verify your account first.');
  }

  const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET!, { expiresIn: '1d' });
  return { token };
};

export const getMe = async (userId: number) => {
  const user = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    isVerified: users.isVerified,
    createdAt: users.createdAt
  }).from(users).where(eq(users.id, userId));

  if (user.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  return user[0];
};