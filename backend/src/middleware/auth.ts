import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { User, IUser } from '../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      // Support query token for secure resume downloads
      token = req.query.token as string;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid',
      });
      return;
    }

    const decoded = verifyToken(token);
    req.tokenPayload = decoded;

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
      return;
    }

    if (user.accountStatus !== 'Active') {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an Administrator.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid, expired, or malformed authentication token',
    });
  }
};

