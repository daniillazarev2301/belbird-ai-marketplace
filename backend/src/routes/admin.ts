import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  oldPrice: z.number().positive().optional(),
  stockCount: z.number().min(0).default(0),
  images: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  specifications: z.record(z.any()).default({}),
  richContent: z.array(z.any()).default([]),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  isBestseller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isAiRecommended: z.boolean().default(false),
});

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().default(0),
});

const brandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logoUrl: z.string().optional(),
});

const orderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

export async function adminRoutes(app: FastifyInstance) {
  // All admin routes require admin role
  app.addHook('onRequest', (app as any).requireAdmin);

  // ===========================================
  // Dashboard
  // ===========================================

  app.get('/dashboard', async () => {
    const [
      ordersCount,
      productsCount,
      usersCount,
      todayOrders,
      todayRevenue,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          paymentStatus: 'paid',
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        include: {
          user: { select: { email: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Get product details for top products
    const topProductIds = topProducts.map(p => p.productId).filter(Boolean) as string[];
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, images: true, price: true },
    });

    return {
      stats: {
        ordersCount,
        productsCount,
        usersCount,
        todayOrders,
        todayRevenue: todayRevenue._sum.totalAmount || 0,
      },
      recentOrders,
      topProducts: topProducts.map(p => ({
        ...topProductDetails.find(pd => pd.id === p.productId),
        soldCount: p._sum.quantity,
      })),
    };
  });

  // ===========================================
  // Products Management
  // ===========================================

  app.get('/products', async (request) => {
    const { page = '1', limit = '20', search } = request.query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, pagination: { page: pageNum, limit: limitNum, total } };
  });

  app.post('/products', async (request, reply) => {
    try {
      const body = productSchema.parse(request.body);
      const product = await prisma.product.create({ data: body });
      return product;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  app.put('/products/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = productSchema.partial().parse(request.body);
      const product = await prisma.product.update({
        where: { id },
        data: body,
      });
      return product;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  app.delete('/products/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await prisma.product.delete({ where: { id } });
      return { success: true };
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // ===========================================
  // Categories Management
  // ===========================================

  app.get('/categories', async () => {
    const categories = await prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return { categories };
  });

  app.post('/categories', async (request, reply) => {
    try {
      const body = categorySchema.parse(request.body);
      const category = await prisma.category.create({ data: body });
      return category;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  app.put('/categories/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = categorySchema.partial().parse(request.body);
      const category = await prisma.category.update({
        where: { id },
        data: body,
      });
      return category;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  app.delete('/categories/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await prisma.category.delete({ where: { id } });
      return { success: true };
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // ===========================================
  // Brands Management
  // ===========================================

  app.get('/brands', async () => {
    const brands = await prisma.brand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return { brands };
  });

  app.post('/brands', async (request, reply) => {
    try {
      const body = brandSchema.parse(request.body);
      const brand = await prisma.brand.create({ data: body });
      return brand;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  app.put('/brands/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = brandSchema.partial().parse(request.body);
      const brand = await prisma.brand.update({
        where: { id },
        data: body,
      });
      return brand;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  app.delete('/brands/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await prisma.brand.delete({ where: { id } });
      return { success: true };
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // ===========================================
  // Orders Management
  // ===========================================

  app.get('/orders', async (request) => {
    const { page = '1', limit = '20', status } = request.query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, fullName: true, phone: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, pagination: { page: pageNum, limit: limitNum, total } };
  });

  app.get('/orders/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, images: true, slug: true } },
          },
        },
      },
    });

    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }

    return order;
  });

  app.put('/orders/:id/status', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { status } = orderStatusSchema.parse(request.body);

      const order = await prisma.order.update({
        where: { id },
        data: { status },
      });

      return order;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // ===========================================
  // Users Management
  // ===========================================

  app.get('/users', async (request) => {
    const { page = '1', limit = '20', search, role } = request.query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          loyaltyPoints: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, pagination: { page: pageNum, limit: limitNum, total } };
  });

  app.put('/users/:id/role', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { role } = request.body as { role: 'admin' | 'manager' | 'user' };

      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, role: true },
      });

      return user;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // ===========================================
  // Activity Logs
  // ===========================================

  app.get('/activity-logs', async (request) => {
    const { page = '1', limit = '50' } = request.query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.activityLog.count(),
    ]);

    return { logs, pagination: { page: pageNum, limit: limitNum, total } };
  });
}
