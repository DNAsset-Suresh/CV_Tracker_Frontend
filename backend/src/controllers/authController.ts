import { Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    if (user.accountStatus !== 'Active') {
      res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact your system administrator.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);

    await logActivity(
      { ...req, user } as any,
      'USER_LOGIN',
      'User',
      (user._id as any).toString(),
      { email: user.email, role: user.role }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeJSON(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user.toSafeJSON(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      return;
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Incorrect current password' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await logActivity(req, 'PASSWORD_CHANGED', 'User', (user._id as any).toString());

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      // Avoid revealing whether account exists
      res.status(200).json({
        success: true,
        message: 'If an account exists with that email, instructions have been sent.',
      });
      return;
    }

    // In production this sends an email with reset token
    res.status(200).json({
      success: true,
      message: 'Password reset link dispatched to user email address.',
      mockToken: 'sample-reset-token-2026',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      res.status(400).json({ success: false, message: 'Email and new password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await logActivity(req, 'PASSWORD_RESET', 'User', (user._id as any).toString());

    res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

