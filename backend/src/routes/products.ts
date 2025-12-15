import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const productQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sortBy: z.enum(['price', 'rating', 'createdAt', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isNew: z.coerce.boolean().optional(),
  isBestseller: z.coerce.boolean().optional(),
});

export async function productRoutes(app: FastifyInstance) {
  // List products
  app.get('/', async (request) => {
    const query = productQuerySchema.parse(request.query);
    const { page, limit, sortBy, sortOrder } = query;

    const where: any = {
      isActive: true,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.brandId) {
      where.brandId = query.brandId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) {
        where.price.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.price.lte = query.maxPrice;
      }
    }

    if (query.isNew !== undefined) {
      where.isNew = query.isNew;
    }

    if (query.isBestseller !== undefined) {
      where.isBestseller = query.isBestseller;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  // Get single product by slug
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }, // Allow fetching by ID too
        ],
        isActive: true,
      },
      include: {
        category: true,
        brand: true,
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }

    return product;
  });

  // Get featured products
  app.get('/featured/list', async () => {
    const [bestsellers, newArrivals, recommended] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, isBestseller: true },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true, isNew: true },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true, isAiRecommended: true },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        take: 8,
      }),
    ]);

    return { bestsellers, newArrivals, recommended };
  });

  // Get related products
  app.get('/:id/related', async (request) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id },
      select: { categoryId: true, brandId: true },
    });

    if (!product) {
      return { products: [] };
    }

    const related = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: id },
        OR: [
          { categoryId: product.categoryId },
          { brandId: product.brandId },
        ],
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      take: 8,
    });

    return { products: related };
  });

  // Search products
  app.get('/search/:query', async (request) => {
    const { query } = request.params as { query: string };

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      take: 20,
    });

    return { products };
  });
}
