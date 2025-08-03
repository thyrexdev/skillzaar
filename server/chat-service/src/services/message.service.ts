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
