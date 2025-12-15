import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import type { User, UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.bcryptRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, config.jwtAccessSecret, {
      expiresIn: config.jwtAccessExpiresIn,
    });
  }

  generateRefreshToken(): string {
    return uuidv4();
  }

  async createRefreshToken(userId: string): Promise<string> {
    const token = this.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async validateRefreshToken(token: string): Promise<User | null> {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken) {
      return null;
    }

    if (new Date() > refreshToken.expiresAt) {
      await prisma.refreshToken.delete({ where: { id: refreshToken.id } });
      return null;
    }

    return refreshToken.user;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async register(
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await this.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
      },
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const user = await this.validateRefreshToken(refreshToken);
    if (!user) {
      throw new Error('Invalid or expired refresh token');
    }

    // Revoke old token
    await this.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const newHash = await this.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens
    await this.revokeAllUserTokens(userId);
  }
}

export const authService = new AuthService();
