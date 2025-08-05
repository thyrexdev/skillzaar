import { prisma } from "../db"; 
import type { Message } from "../../generated/prisma/";
import { findOrCreateConversation, updateConversationActivity } from "./conversation.service";

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
  try {
    // Find or create conversation between users
    const conversation = await findOrCreateConversation(senderId, recipientId);
    
    // Create message within the conversation
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId: recipientId,
        content,
      },
    });
    
    // Update conversation's last activity and last message
    await updateConversationActivity(conversation.id, message.id);
    
    console.log(`📝 Message saved to conversation ${conversation.id}: ${message.id}`);
    return message;
  } catch (error) {
    console.error("[SAVE_MESSAGE_ERROR]", error);
    throw new Error("Failed to save message");
  }
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
