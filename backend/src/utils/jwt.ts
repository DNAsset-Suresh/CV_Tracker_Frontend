import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { IUser } from '../models/User.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  managerClassification?: string | null;
}

export const generateToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
    managerClassification: user.managerClassification,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

