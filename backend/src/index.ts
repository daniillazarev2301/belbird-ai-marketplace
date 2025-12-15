import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { productRoutes } from './routes/products.js';
import { categoryRoutes } from './routes/categories.js';
import { orderRoutes } from './routes/orders.js';
import { cartRoutes } from './routes/cart.js';
import { adminRoutes } from './routes/admin.js';
import { aiRoutes } from './routes/ai.js';
import { uploadRoutes } from './routes/uploads.js';
import { settingsRoutes } from './routes/settings.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({
  logger: {
    level: config.logLevel,
    transport: config.isDev
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// ===========================================
// Plugins
// ===========================================

// CORS
await app.register(cors, {
  origin: config.frontendUrl,
  credentials: true,
});

// Security headers
await app.register(helmet, {
  contentSecurityPolicy: false,
});

// Rate limiting
await app.register(rateLimit, {
  max: config.rateLimitMax,
  timeWindow: config.rateLimitWindowMs,
});

// JWT
await app.register(jwt, {
  secret: config.jwtAccessSecret,
  sign: { expiresIn: config.jwtAccessExpiresIn },
});

// Cookies
await app.register(cookie);

// File uploads
await app.register(multipart, {
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024,
  },
});

// Static files (uploads)
await app.register(fastifyStatic, {
  root: path.join(__dirname, '..', config.storagePath),
  prefix: '/uploads/',
});

// ===========================================
// Auth decorator
// ===========================================

app.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

app.decorate('authenticateOptional', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Continue without auth
  }
});

app.decorate('requireAdmin', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
    if (request.user.role !== 'admin') {
      reply.status(403).send({ error: 'Admin access required' });
    }
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

app.decorate('requireManager', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
    if (!['admin', 'manager'].includes(request.user.role)) {
      reply.status(403).send({ error: 'Manager access required' });
    }
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// ===========================================
// Routes
// ===========================================

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API routes
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(userRoutes, { prefix: '/api/users' });
await app.register(productRoutes, { prefix: '/api/products' });
await app.register(categoryRoutes, { prefix: '/api/categories' });
await app.register(orderRoutes, { prefix: '/api/orders' });
await app.register(cartRoutes, { prefix: '/api/cart' });
await app.register(adminRoutes, { prefix: '/api/admin' });
await app.register(aiRoutes, { prefix: '/api/ai' });
await app.register(uploadRoutes, { prefix: '/api/uploads' });
await app.register(settingsRoutes, { prefix: '/api/settings' });

// ===========================================
// Error handler
// ===========================================

app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  
  const statusCode = error.statusCode || 500;
  const message = config.isDev ? error.message : 'Internal Server Error';
  
  reply.status(statusCode).send({
    error: message,
    ...(config.isDev && { stack: error.stack }),
  });
});

// ===========================================
// Graceful shutdown
// ===========================================

const shutdown = async () => {
  app.log.info('Shutting down...');
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ===========================================
// Start server
// ===========================================

try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`🚀 Server running at http://${config.host}:${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
