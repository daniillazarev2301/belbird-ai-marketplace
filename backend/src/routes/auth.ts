import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post('/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);
      const { user, tokens } = await authService.register(
        body.email,
        body.password,
        body.fullName
      );

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        accessToken: tokens.accessToken,
      };
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Login
  app.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      const { user, tokens } = await authService.login(body.email, body.password);

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          loyaltyPoints: user.loyaltyPoints,
        },
        accessToken: tokens.accessToken,
      };
    } catch (error: any) {
      reply.status(401).send({ error: error.message });
    }
  });

  // Refresh token
  app.post('/refresh', async (request, reply) => {
    try {
      const refreshToken = 
        (request.body as any)?.refreshToken || 
        request.cookies.refreshToken;

      if (!refreshToken) {
        return reply.status(401).send({ error: 'Refresh token required' });
      }

      const tokens = await authService.refresh(refreshToken);

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60,
      });

      return { accessToken: tokens.accessToken };
    } catch (error: any) {
      reply.status(401).send({ error: error.message });
    }
  });

  // Logout
  app.post('/logout', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    reply.clearCookie('refreshToken', { path: '/api/auth' });
    return { success: true };
  });

  // Get current user
  app.get('/me', {
    onRequest: [(app as any).authenticate],
  }, async (request) => {
    const user = (request as any).user;
    const { prisma } = await import('../lib/prisma.js');
    
    const fullUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    return fullUser;
  });

  // Change password
  app.post('/change-password', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const body = changePasswordSchema.parse(request.body);
      
      await authService.changePassword(
        user.userId,
        body.currentPassword,
        body.newPassword
      );

      reply.clearCookie('refreshToken', { path: '/api/auth' });
      return { success: true, message: 'Password changed. Please login again.' };
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });
}
