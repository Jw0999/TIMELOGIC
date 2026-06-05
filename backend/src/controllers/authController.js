const AuthService = require('../services/AuthenticationService');
const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');

const login = async (req, res, next) => {
  try {
    const { email, employeeCode, password, deviceFingerprint } = req.body;
    const identifier = employeeCode ?? email;
    const result = await AuthService.login(identifier, password, deviceFingerprint);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await AuthService.logout(req.user.id, refreshToken);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshAccessToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, status: true, shiftType: true,
        profileImageUrl: true, employeeCode: true,
        departmentId: true, orgId: true, lastLoginAt: true, createdAt: true,
        department: { select: { name: true } },
      },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ success: true, message: 'Password changed' });
  } catch (err) { next(err); }
};

// Admin-only: create a new user
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, departmentId, shiftType } = req.body;
    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        orgId: req.user.orgId,
        firstName,
        lastName,
        email,
        passwordHash,
        role: role || 'EMPLOYEE',
        departmentId,
        shiftType: shiftType || 'FLEXIBLE',
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true },
    });

    const LeaveService = require('../services/LeaveService');
    await LeaveService.initBalances(user.id, new Date().getFullYear());

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.code === 'P2002') {
      return next(Object.assign(new Error('Email already exists'), { status: 409 }));
    }
    next(err);
  }
};

module.exports = { login, logout, refresh, me, changePassword, createUser };
