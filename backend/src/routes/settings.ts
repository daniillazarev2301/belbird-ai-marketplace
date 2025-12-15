import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function settingsRoutes(app: FastifyInstance) {
  // Get public settings
  app.get('/public', async () => {
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'site_name',
            'site_logo',
            'contact_phone',
            'contact_email',
            'contact_address',
            'social_vk',
            'social_telegram',
            'social_instagram',
            'working_hours',
          ],
        },
      },
    });

    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return result;
  });

  // Get all settings (admin only)
  app.get('/', {
    onRequest: [(app as any).requireAdmin],
  }, async () => {
    const settings = await prisma.siteSetting.findMany();
    
    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return result;
  });

  // Update settings (admin only)
  app.put('/', {
    onRequest: [(app as any).requireAdmin],
  }, async (request) => {
    const updates = request.body as Record<string, any>;

    for (const [key, value] of Object.entries(updates)) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return { success: true };
  });

  // Get single setting
  app.get('/:key', async (request, reply) => {
    const { key } = request.params as { key: string };

    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return reply.status(404).send({ error: 'Setting not found' });
    }

    return { key: setting.key, value: setting.value };
  });
}
