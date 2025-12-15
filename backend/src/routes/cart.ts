import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().min(1).default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.number().min(1),
});

export async function cartRoutes(app: FastifyInstance) {
  // Get cart
  app.get('/', {
    onRequest: [(app as any).authenticate],
  }, async (request) => {
    const user = (request as any).user;

    const items = await prisma.cartItem.findMany({
      where: { userId: user.userId },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const subtotal = items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    return {
      items,
      subtotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  });

  // Add to cart
  app.post('/', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const body = addToCartSchema.parse(request.body);

      // Check if product exists and is active
      const product = await prisma.product.findFirst({
        where: { id: body.productId, isActive: true },
      });

      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      // Check stock
      if (product.stockCount < body.quantity) {
        return reply.status(400).send({ error: 'Not enough stock' });
      }

      // Upsert cart item
      const cartItem = await prisma.cartItem.upsert({
        where: {
          userId_productId: {
            userId: user.userId,
            productId: body.productId,
          },
        },
        update: {
          quantity: { increment: body.quantity },
        },
        create: {
          userId: user.userId,
          productId: body.productId,
          quantity: body.quantity,
        },
        include: {
          product: true,
        },
      });

      return cartItem;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Update cart item quantity
  app.put('/:productId', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { productId } = request.params as { productId: string };
      const body = updateCartItemSchema.parse(request.body);

      // Check stock
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stockCount: true },
      });

      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      if (product.stockCount < body.quantity) {
        return reply.status(400).send({ error: 'Not enough stock' });
      }

      const cartItem = await prisma.cartItem.update({
        where: {
          userId_productId: {
            userId: user.userId,
            productId,
          },
        },
        data: { quantity: body.quantity },
        include: { product: true },
      });

      return cartItem;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Remove from cart
  app.delete('/:productId', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { productId } = request.params as { productId: string };

      await prisma.cartItem.delete({
        where: {
          userId_productId: {
            userId: user.userId,
            productId,
          },
        },
      });

      return { success: true };
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Clear cart
  app.delete('/', {
    onRequest: [(app as any).authenticate],
  }, async (request) => {
    const user = (request as any).user;

    await prisma.cartItem.deleteMany({
      where: { userId: user.userId },
    });

    return { success: true };
  });
}
