import { prisma } from "../db"; 
import type { Message } from "../../generated/prisma/";

type SaveMessageInput = {
  senderId: string;
  recipientId: string;
  content: string;
};

export const saveMessage = async ({
  senderId,
  recipientId,
  content,
}: SaveMessageInput): Promise<Message> => {
  return await prisma.message.create({
    data: {
      senderId,
      receiverId: recipientId,
      content,
    },
  });
};

/**
 * Get messages between two users with pagination
 */
export const getMessagesBetweenUsers = async (
  userId1: string,
  userId2: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> => {
  return await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
    skip: offset,
  });
};
