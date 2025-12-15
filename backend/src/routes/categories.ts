import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function categoryRoutes(app: FastifyInstance) {
  // List all categories
  app.get('/', async () => {
    const categories = await prisma.category.findMany({
      include: {
        children: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
    });

    return { categories };
  });

  // Get category tree (hierarchical)
  app.get('/tree', async () => {
    const categories = await prisma.category.findMany({
      include: {
        children: {
          include: {
            children: true,
            _count: { select: { products: { where: { isActive: true } } } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: { where: { isActive: true } } } },
      },
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
    });

    return { categories };
  });

  // Get single category by slug
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const category = await prisma.category.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        parent: true,
        children: {
          include: {
            _count: { select: { products: { where: { isActive: true } } } },
          },
        },
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });

    if (!category) {
      return reply.status(404).send({ error: 'Category not found' });
    }

    return category;
  });

  // Get products in category
  app.get('/:slug/products', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { page = '1', limit = '20' } = request.query as Record<string, string>;

    const category = await prisma.category.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: { children: { select: { id: true } } },
    });

    if (!category) {
      return reply.status(404).send({ error: 'Category not found' });
    }

    // Include products from subcategories
    const categoryIds = [category.id, ...category.children.map(c => c.id)];

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          categoryId: { in: categoryIds },
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.product.count({
        where: {
          isActive: true,
          categoryId: { in: categoryIds },
        },
      }),
    ]);

    return {
      category,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  });
}
