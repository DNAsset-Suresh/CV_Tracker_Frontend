import { Response } from 'express';
import bcrypt from 'bcrypt';
import { User, UserRole, ManagerClassification } from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../middleware/audit.js';

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 15;
    const skip = (page - 1) * limit;

    const { role, classification, status, search } = req.query;
    const filter: any = {};

    if (role) filter.role = role;
    if (classification) filter.managerClassification = classification;
    if (status) filter.accountStatus = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, managerClassification, phone } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
      return;
    }

    if (role === 'Manager' && !managerClassification) {
      res.status(400).json({
        success: false,
        message: 'Manager classification is mandatory when creating a Manager account.',
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      managerClassification: role === 'Manager' ? managerClassification : null,
      phone,
      accountStatus: 'Active',
    });

    await logActivity(req, 'USER_CREATED', 'User', (user._id as any).toString(), {
      name: user.name,
      email: user.email,
      role: user.role,
      managerClassification: user.managerClassification,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: user.toSafeJSON(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, role, managerClassification, phone, accountStatus } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const previousValue = user.toSafeJSON();

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (accountStatus) user.accountStatus = accountStatus;

    if (role) {
      user.role = role as UserRole;
      if (role === 'Manager') {
        if (!managerClassification && !user.managerClassification) {
          res.status(400).json({ success: false, message: 'Manager classification is mandatory for Manager role' });
          return;
        }
        if (managerClassification) {
          user.managerClassification = managerClassification as ManagerClassification;
        }
      } else {
        user.managerClassification = null;
      }
    }

    await user.save();

    await logActivity(
      req,
      'USER_UPDATED',
      'User',
      (user._id as any).toString(),
      { updatedFields: req.body },
      previousValue,
      user.toSafeJSON()
    );

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: user.toSafeJSON(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const prevStatus = user.accountStatus;
    user.accountStatus = prevStatus === 'Active' ? 'Inactive' : 'Active';
    await user.save();

    await logActivity(req, 'USER_STATUS_TOGGLED', 'User', (user._id as any).toString(), {
      previousStatus: prevStatus,
      newStatus: user.accountStatus,
    });

    res.status(200).json({
      success: true,
      message: `User ${user.accountStatus === 'Active' ? 'activated' : 'deactivated'} successfully`,
      user: user.toSafeJSON(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetUserPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    await logActivity(req, 'ADMIN_PASSWORD_RESET', 'User', (user._id as any).toString());

    res.status(200).json({ success: true, message: 'User password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Soft delete: deactivate instead of hard deleting to preserve historical assignment integrity
    user.accountStatus = 'Inactive';
    await user.save();

    await logActivity(req, 'USER_DEACTIVATED', 'User', (user._id as any).toString());

    res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get managers filtered by department classification
 * Matches department ("IT Development", "Advocate", "Field Executive")
 * to managerClassification ("IT Development Manager", "Advocate Manager", "Field Executive Manager")
 */
export const getManagersByClassification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { department } = req.query;
    const filter: any = { role: 'Manager', accountStatus: 'Active' };

    if (department) {
      const classificationMap: Record<string, string> = {
        'IT Development': 'IT Development Manager',
        'Advocate': 'Advocate Manager',
        'Field Executive': 'Field Executive Manager',
      };
      const classification = classificationMap[department as string] || `${department} Manager`;
      filter.managerClassification = classification;
    }

    const managers = await User.find(filter).select('-passwordHash').sort({ name: 1 });
    res.status(200).json({ success: true, managers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

