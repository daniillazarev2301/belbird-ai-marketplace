import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
});

const addressSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  street: z.string().optional(),
  house: z.string().optional(),
  apartment: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  pickupPointId: z.string().optional(),
  pickupPointName: z.string().optional(),
  pickupPointAddress: z.string().optional(),
  provider: z.string().optional(),
  isDefault: z.boolean().default(false),
});

const petSchema = z.object({
  name: z.string().min(1),
  species: z.string().min(1),
  breed: z.string().optional(),
  ageYears: z.number().min(0).optional(),
  weightKg: z.number().min(0).optional(),
  allergies: z.array(z.string()).default([]),
  specialNeeds: z.string().optional(),
});

export async function userRoutes(app: FastifyInstance) {
  // Update profile
  app.put('/profile', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const body = updateProfileSchema.parse(request.body);

      const updated = await prisma.user.update({
        where: { id: user.userId },
        data: body,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          loyaltyPoints: true,
        },
      });

      return updated;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // ===========================================
  // Addresses
  // ===========================================

  app.get('/addresses', {
    onRequest: [(app as any).authenticate],
  }, async (request) => {
    const user = (request as any).user;

    const addresses = await prisma.address.findMany({
      where: { userId: user.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return { addresses };
  });

  app.post('/addresses', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const body = addressSchema.parse(request.body);

      // If setting as default, unset others
      if (body.isDefault) {
        await prisma.address.updateMany({
          where: { userId: user.userId },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.create({
        data: {
          ...body,
          userId: user.userId,
        },
      });

      return address;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  app.put('/addresses/:id', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const body = addressSchema.partial().parse(request.body);

      // Verify ownership
      const existing = await prisma.address.findFirst({
        where: { id, userId: user.userId },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Address not found' });
      }

      // If setting as default, unset others
      if (body.isDefault) {
        await prisma.address.updateMany({
          where: { userId: user.userId, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const address = await prisma.address.update({
        where: { id },
        data: body,
      });

      return address;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  app.delete('/addresses/:id', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      await prisma.address.deleteMany({
        where: { id, userId: user.userId },
      });

      return { success: true };
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // ===========================================
  // Pets
  // ===========================================

  app.get('/pets', {
    onRequest: [(app as any).authenticate],
  }, async (request) => {
    const user = (request as any).user;

    const pets = await prisma.pet.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });

    return { pets };
  });

  app.post('/pets', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const body = petSchema.parse(request.body);

      const pet = await prisma.pet.create({
        data: {
          ...body,
          userId: user.userId,
        },
      });

      return pet;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  app.put('/pets/:id', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };
      const body = petSchema.partial().parse(request.body);

      const existing = await prisma.pet.findFirst({
        where: { id, userId: user.userId },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Pet not found' });
      }

      const pet = await prisma.pet.update({
        where: { id },
        data: body,
      });

      return pet;
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  app.delete('/pets/:id', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      await prisma.pet.deleteMany({
        where: { id, userId: user.userId },
      });

      return { success: true };
    } catch (error: any) {
      reply.status(400).send({ error: error.message });
    }
  });

  // ===========================================
  // Favorites
  // ===========================================

  app.get('/favorites', {
    onRequest: [(app as any).authenticate],
  }, async (request) => {
    const user = (request as any).user;

    const favorites = await prisma.favorite.findMany({
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

    return { favorites: favorites.map(f => f.product) };
  });

  app.post('/favorites/:productId', {
    onRequest: [(app as any).authenticate],
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { productId } = request.params as { productId: string };

      await prisma.favorite.create({
        data: {
          userId: user.userId,
          productId,
        },
      });

      return { success: true };
    } catch (error: any) {
      // Ignore duplicate errors
      return { success: true };
    }
  });

  app.delete('/favorites/:productId', {
    onRequest: [(app as any).authenticate],
  }, async (request) => {
    const user = (request as any).user;
    const { productId } = request.params as { productId: string };

    await prisma.favorite.deleteMany({
      where: { userId: user.userId, productId },
    });

    return { success: true };
  });

  // Check if product is in favorites
  app.get('/favorites/:productId/check', {
    onRequest: [(app as any).authenticate],
  }, async (request) => {
    const user = (request as any).user;
    const { productId } = request.params as { productId: string };

    const favorite = await prisma.favorite.findFirst({
      where: { userId: user.userId, productId },
    });

    return { isFavorite: !!favorite };
  });

  // ===========================================
  // Loyalty
  // ===========================================

  app.get('/loyalty', {
    onRequest: [(app as any).authenticate],
  }, async (request) => {
    const user = (request as any).user;

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { loyaltyPoints: true },
    });

    // Get orders to calculate earned/spent
    const orders = await prisma.order.findMany({
      where: { userId: user.userId },
      select: { loyaltyPointsEarned: true, loyaltyPointsUsed: true },
    });

    const totalEarned = orders.reduce((sum, o) => sum + o.loyaltyPointsEarned, 0);
    const totalUsed = orders.reduce((sum, o) => sum + o.loyaltyPointsUsed, 0);

    return {
      currentPoints: userData?.loyaltyPoints || 0,
      totalEarned,
      totalUsed,
    };
  });
}
