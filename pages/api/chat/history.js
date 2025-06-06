import { getServerSession } from 'next-auth/next';
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = session.user.id;

    const chatSessions = await prisma.chatSession.findMany({
      where: {
        userId: userId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return res.status(200).json(chatSessions);
  } catch (error) {
    console.error('Chat history error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 