import prisma from '../config/db.js';

export class CMSService {
  async getCMSContent() {
    const items = await prisma.cMSContent.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (items.length === 0) {
      const defaultBanners = [
        {
          type: 'banner',
          title: '¡Súper Descuento de Envíos en Temporada Alta!',
          description: 'Aprovecha un 15% OFF en tus consolidaciones de Miami usando tu casillero virtual.',
          imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
          linkUrl: '/dashboard/prealertas',
        },
      ];

      for (const b of defaultBanners) {
        await prisma.cMSContent.create({ data: b });
      }

      return prisma.cMSContent.findMany({ where: { active: true } });
    }

    return items;
  }

  async createCMSContent(data: { type: string; title: string; description: string; imageUrl?: string; linkUrl?: string }) {
    const item = await prisma.cMSContent.create({
      data: {
        type: data.type || 'banner',
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl || null,
        linkUrl: data.linkUrl || null,
        active: true,
      },
    });

    return item;
  }

  async deleteCMSContent(id: string) {
    return prisma.cMSContent.update({
      where: { id },
      data: { active: false },
    });
  }
}
