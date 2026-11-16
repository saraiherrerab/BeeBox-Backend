import prisma from '../config/db.js';
import { emitSocketEvent } from '../socket.js';

export class CMSService {
  async getCMSContent(includeInactive = false) {
    const totalCount = await prisma.cMSContent.count();

    if (totalCount === 0) {
      const defaultBanners = [
        {
          type: 'promo',
          title: '¡Súper Descuento de Envíos en Temporada Alta!',
          description: 'Aprovecha un 15% OFF en tus consolidaciones desde Oklahoma usando tu casillero virtual.',
          imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
          linkUrl: '/dashboard/prealertas',
          active: true,
        },
      ];

      for (const b of defaultBanners) {
        await prisma.cMSContent.create({ data: b });
      }
    }

    return prisma.cMSContent.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCMSContent(data: {
    type: string;
    title: string;
    description: string;
    imageUrl?: string;
    linkUrl?: string;
    active?: boolean;
  }) {
    const item = await prisma.cMSContent.create({
      data: {
        type: data.type || 'banner',
        title: data.title.trim(),
        description: data.description.trim(),
        imageUrl: data.imageUrl ? data.imageUrl.trim() : null,
        linkUrl: data.linkUrl ? data.linkUrl.trim() : null,
        active: data.active !== undefined ? Boolean(data.active) : true,
      },
    });

    emitSocketEvent('cms:updated', item);
    return item;
  }

  async updateCMSContent(
    id: string,
    data: {
      type?: string;
      title?: string;
      description?: string;
      imageUrl?: string | null;
      linkUrl?: string | null;
      active?: boolean;
    }
  ) {
    const updateData: any = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ? data.imageUrl.trim() : null;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl ? data.linkUrl.trim() : null;
    if (data.active !== undefined) updateData.active = Boolean(data.active);

    const updated = await prisma.cMSContent.update({
      where: { id },
      data: updateData,
    });

    emitSocketEvent('cms:updated', updated);
    return updated;
  }

  async deleteCMSContent(id: string) {
    const deleted = await prisma.cMSContent.delete({
      where: { id },
    });
    emitSocketEvent('cms:updated', { id, deleted: true });
    return deleted;
  }
}
