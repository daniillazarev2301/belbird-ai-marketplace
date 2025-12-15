import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1),
  })),
  shippingAddress: z.object({
    name: z.string(),
    phone: z.string(),
    city: z.string(),
    street: z.string().optional(),
    house: z.string().optional(),
    apartment: z.string().optional(),
    postalCode: z.string().optional(),
    pickupPointId: z.string().optional(),
    pickupPointName: z.string().optional(),
    pickupPointAddress: z.string().optional(),
    provider: z.string().optional(),
  }),
  paymentMethod: z.enum(['card', 'cash', 'online']).optional(),
  promoCode: z.string().optional(),
  loyaltyPointsToUse: z.number().min(0).optional(),
  notes: z.string().optional(),
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BB-${timestamp}-${random}`;
}

export async function orderRoutes(app: FastifyInstance) {
  // Create order
  app.post('/', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const body = createOrderSchema.parse(request.body);

      // Get products
      const products = await prisma.product.findMany({
        where: {
          id: { in: body.items.map(i => i.productId) },
          isActive: true,
        },
      });

      if (products.length !== body.items.length) {
        return reply.status(400).send({ error: 'Some products not found or unavailable' });
      }

      // Calculate subtotal
      let subtotal = 0;
      const orderItems = body.items.map(item => {
        const product = products.find(p => p.id === item.productId)!;
        const price = Number(product.price);
        subtotal += price * item.quantity;
        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price,
        };
      });

      // Apply promo code
      let discount = 0;
      let promoCodeId: string | undefined;

      if (body.promoCode) {
        const promo = await prisma.promoCode.findFirst({
          where: {
            code: body.promoCode.toUpperCase(),
            isActive: true,
            OR: [
              { validUntil: null },
              { validUntil: { gte: new Date() } },
            ],
          },
        });

        if (promo) {
          if (promo.minOrderAmount && subtotal < Number(promo.minOrderAmount)) {
            return reply.status(400).send({
              error: `Минимальная сумма заказа для промокода: ${promo.minOrderAmount} ₽`,
            });
          }

          if (promo.maxUses && promo.usedCount >= promo.maxUses) {
            return reply.status(400).send({ error: 'Промокод больше недействителен' });
          }

          if (promo.discountPercent) {
            discount = subtotal * (promo.discountPercent / 100);
          } else if (promo.discountAmount) {
            discount = Number(promo.discountAmount);
          }

          promoCodeId = promo.id;
        }
      }

      // Apply loyalty points (max 50% of subtotal after discount)
      let loyaltyPointsUsed = 0;
      if (body.loyaltyPointsToUse && body.loyaltyPointsToUse > 0) {
        const userData = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { loyaltyPoints: true },
        });

        const maxPointsToUse = Math.min(
          body.loyaltyPointsToUse,
          userData?.loyaltyPoints || 0,
          Math.floor((subtotal - discount) * 0.5) // Max 50%
        );

        loyaltyPointsUsed = maxPointsToUse;
      }

      // Calculate total
      const deliveryCost = 0; // Can be calculated based on address
      const totalAmount = Math.max(0, subtotal - discount - loyaltyPointsUsed + deliveryCost);

      // Calculate loyalty points earned (3% of total)
      const loyaltyPointsEarned = Math.floor(totalAmount * 0.03);

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: user.userId,
          subtotal,
          discount,
          deliveryCost,
          totalAmount,
          loyaltyPointsUsed,
          loyaltyPointsEarned,
          promoCodeId,
          shippingAddress: body.shippingAddress,
          paymentMethod: body.paymentMethod,
          notes: body.notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });

      // Update promo code usage
      if (promoCodeId) {
        await prisma.promoCode.update({
          where: { id: promoCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Update user loyalty points
      if (loyaltyPointsUsed > 0 || loyaltyPointsEarned > 0) {
        await prisma.user.update({
          where: { id: user.userId },
          data: {
            loyaltyPoints: {
              increment: loyaltyPointsEarned - loyaltyPointsUsed,
            },
          },
        });
      }

      // Update product stock
      for (const item of body.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockCount: { decrement: item.quantity } },
        });
      }

      // Clear user's cart
      await prisma.cartItem.deleteMany({
        where: { userId: user.userId },
      });

      return order;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Get user's orders
  app.get('/', {
    onRequest: [(app as any).authenticate],
  }, async (request) => {
    const user = (request as any).user;
    const { page = '1', limit = '10' } = request.query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.userId },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, images: true, slug: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.order.count({ where: { userId: user.userId } }),
    ]);

    return {
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  });

  // Get single order
  app.get('/:id', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
        userId: user.userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, images: true, slug: true },
            },
          },
        },
      },
    });

    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }

    return order;
  });

  // Validate promo code
  app.post('/validate-promo', async (request, reply) => {
    const { code, subtotal } = request.body as { code: string; subtotal: number };

    const promo = await prisma.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
    });

    if (!promo) {
      return reply.status(404).send({ error: 'Промокод не найден' });
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      return reply.status(400).send({ error: 'Промокод больше недействителен' });
    }

    if (promo.minOrderAmount && subtotal < Number(promo.minOrderAmount)) {
      return reply.status(400).send({
        error: `Минимальная сумма заказа: ${promo.minOrderAmount} ₽`,
      });
    }

    let discount = 0;
    if (promo.discountPercent) {
      discount = subtotal * (promo.discountPercent / 100);
    } else if (promo.discountAmount) {
      discount = Number(promo.discountAmount);
    }

    return {
      valid: true,
      code: promo.code,
      discount,
      discountPercent: promo.discountPercent,
      discountAmount: promo.discountAmount,
    };
  });
}
