import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { ApiError } from '../utils/ApiError';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email, and password are required');
    }
    const result = await authService.registerUser(name, email, password);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required');
    const result = await authService.sendOtp(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ApiError(400, 'Email and OTP are required');
    const result = await authService.verifyOtp(email, otp);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, 'Email and password are required');
    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const userId = req.userId;
    const result = await authService.getMe(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};