import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { aiService } from '../services/ai.service.js';
import { prisma } from '../lib/prisma.js';

const chatSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
});

const generateDescriptionSchema = z.object({
  productName: z.string().min(1),
  category: z.string().optional(),
});

const generateBlogSchema = z.object({
  topic: z.string().min(1),
  keywords: z.array(z.string()).optional(),
});

const generateReviewsSchema = z.object({
  productName: z.string().min(1),
  count: z.number().min(1).max(20).default(3),
  minRating: z.number().min(1).max(5).default(3),
  maxRating: z.number().min(1).max(5).default(5),
  tone: z.enum(['positive', 'mixed', 'critical']).default('positive'),
});

export async function aiRoutes(app: FastifyInstance) {
  // Chat with AI assistant
  app.post('/chat', async (request, reply) => {
    try {
      const body = chatSchema.parse(request.body);
      const user = (request as any).user;

      // Get chat history
      const history = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { userId: user?.userId },
            { sessionId: body.sessionId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Search for relevant products
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: body.message, mode: 'insensitive' } },
            { description: { contains: body.message, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, price: true, slug: true, images: true },
        take: 5,
      });

      // Generate response
      const response = await aiService.generateChatResponse(body.message, {
        history: history.reverse().map(m => ({ role: m.role, content: m.content })),
        products,
      });

      // Save messages
      await prisma.chatMessage.createMany({
        data: [
          {
            role: 'user',
            content: body.message,
            userId: user?.userId,
            sessionId: body.sessionId,
          },
          {
            role: 'assistant',
            content: response,
            userId: user?.userId,
            sessionId: body.sessionId,
          },
        ],
      });

      return {
        message: response,
        products: products.length > 0 ? products : undefined,
      };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Generate product description (admin only)
  app.post('/generate-description', {
    onRequest: [(app as any).requireManager],
  }, async (request, reply) => {
    try {
      const body = generateDescriptionSchema.parse(request.body);
      const description = await aiService.generateProductDescription(
        body.productName,
        body.category
      );
      return { description };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Generate blog post (admin only)
  app.post('/generate-blog', {
    onRequest: [(app as any).requireManager],
  }, async (request, reply) => {
    try {
      const body = generateBlogSchema.parse(request.body);
      const post = await aiService.generateBlogPost(body.topic, body.keywords);
      return post;
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Generate reviews (admin only)
  app.post('/generate-reviews', {
    onRequest: [(app as any).requireAdmin],
  }, async (request, reply) => {
    try {
      const body = generateReviewsSchema.parse(request.body);
      const reviews = await aiService.generateReviews(body.productName, body.count, {
        minRating: body.minRating,
        maxRating: body.maxRating,
        tone: body.tone,
      });
      return { reviews };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Get AI rate limit status (admin only)
  app.get('/rate-limit-status', {
    onRequest: [(app as any).requireAdmin],
  }, async () => {
    return aiService.getRateLimitStatus();
  });
}
