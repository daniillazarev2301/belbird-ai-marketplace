import { FastifyInstance } from 'fastify';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { config } from '../config/index.js';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
];

const UPLOAD_FOLDERS = ['products', 'avatars', 'blog', 'site-assets'];

export async function uploadRoutes(app: FastifyInstance) {
  // Ensure upload directories exist
  for (const folder of UPLOAD_FOLDERS) {
    const dir = path.join(config.storagePath, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Upload file
  app.post('/:folder', {
    onRequest: [(app as any).requireManager],
  }, async (request, reply) => {
    const { folder } = request.params as { folder: string };

    if (!UPLOAD_FOLDERS.includes(folder)) {
      return reply.status(400).send({ error: 'Invalid upload folder' });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const mimeType = data.mimetype;
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return reply.status(400).send({ error: 'File type not allowed' });
    }

    const ext = mime.extension(mimeType) || 'bin';
    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(config.storagePath, folder, filename);

    try {
      await pipeline(data.file, fs.createWriteStream(filepath));

      const url = `/uploads/${folder}/${filename}`;
      return { url, filename };
    } catch (error: any) {
      reply.status(500).send({ error: 'Failed to save file' });
    }
  });

  // Delete file
  app.delete('/:folder/:filename', {
    onRequest: [(app as any).requireManager],
  }, async (request, reply) => {
    const { folder, filename } = request.params as { folder: string; filename: string };

    if (!UPLOAD_FOLDERS.includes(folder)) {
      return reply.status(400).send({ error: 'Invalid folder' });
    }

    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return reply.status(400).send({ error: 'Invalid filename' });
    }

    const filepath = path.join(config.storagePath, folder, filename);

    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      return { success: true };
    } catch (error: any) {
      reply.status(500).send({ error: 'Failed to delete file' });
    }
  });

  // List files in folder
  app.get('/:folder', {
    onRequest: [(app as any).requireManager],
  }, async (request, reply) => {
    const { folder } = request.params as { folder: string };

    if (!UPLOAD_FOLDERS.includes(folder)) {
      return reply.status(400).send({ error: 'Invalid folder' });
    }

    const dir = path.join(config.storagePath, folder);

    try {
      const files = fs.readdirSync(dir).map(filename => {
        const filepath = path.join(dir, filename);
        const stat = fs.statSync(filepath);
        return {
          filename,
          url: `/uploads/${folder}/${filename}`,
          size: stat.size,
          createdAt: stat.birthtime,
        };
      });

      return { files };
    } catch (error: any) {
      reply.status(500).send({ error: 'Failed to list files' });
    }
  });
}
