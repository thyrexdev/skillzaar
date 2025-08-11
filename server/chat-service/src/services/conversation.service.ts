import { prisma } from "@frevix/shared";
import type { Conversation, Message } from "@frevix/shared/src/generated/prisma/";
import { logger } from "@frevix/config";

export type ConversationWithLastMessage = Conversation & {
  lastMessage: Message | null;
  user1: { id: string; name: string; email: string };
  user2: { id: string; name: string; email: string };
};

export type ConversationListItem = {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
  };
  lastMessage: {
    id: string;
    content: string;
    timestamp: Date;
    senderId: string;
    readAt: Date | null;
  } | null;
  lastActivity: Date;
  unreadCount: number;
};

/**
 * Find or create a conversation between two users
 */
export const findOrCreateConversation = async (
  user1Id: string,
  user2Id: string
): Promise<Conversation> => {
  // Ensure consistent ordering (user1Id should be smaller than user2Id)
  const [smallerId, largerId] = [user1Id, user2Id].sort();

  try {
    // Try to find existing conversation
    let conversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: smallerId,
          user2Id: largerId,
        },
      },
    });

    // Create if doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: smallerId,
          user2Id: largerId,
          lastActivity: new Date(),
        },
      });
      logger.info(`✅ Created new conversation: ${conversation.id} between ${user1Id} and ${user2Id}`);
    }

    return conversation;
  } catch (error) {
    logger.error("[CONVERSATION_CREATE_ERROR]", error);
    throw new Error("Failed to create or find conversation");
  }
};

/**
 * Update conversation's last activity and last message
 */
export const updateConversationActivity = async (
  conversationId: string,
  lastMessageId: string
): Promise<void> => {
  try {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId,
        lastActivity: new Date(),
      },
    });
  } catch (error) {
    logger.error("[CONVERSATION_UPDATE_ERROR]", error);
    throw new Error("Failed to update conversation activity");
  }
};

/**
 * Get conversation list for a user with last message and unread count
 */
export const getUserConversations = async (
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ConversationListItem[]> => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: { id: true, name: true, email: true },
        },
        user2: {
          select: { id: true, name: true, email: true },
        },
        lastMessage: {
          select: {
            id: true,
            content: true,
            timestamp: true,
            senderId: true,
            readAt: true,
          },
        },
      },
      orderBy: {
        lastActivity: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Transform conversations to include otherUser and unreadCount
    const conversationList = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;
        
        // Get unread message count for this conversation
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            receiverId: userId,
            readAt: null,
          },
        });

        return {
          id: conv.id,
          otherUser,
          lastMessage: conv.lastMessage,
          lastActivity: conv.lastActivity,
          unreadCount,
        };
      })
    );

    return conversationList;
  } catch (error) {
    logger.error("[CONVERSATION_LIST_ERROR]", error);
    throw new Error("Failed to get user conversations");
  }
};

/**
 * Get conversation history (messages) with pagination
 */
export const getConversationMessages = async (
  conversationId: string,
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> => {
  try {
    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found or user not authorized");
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
      skip: offset,
    });

    return messages.reverse(); // Return in chronological order
  } catch (error) {
    logger.error("[CONVERSATION_MESSAGES_ERROR]", error);
    throw new Error("Failed to get conversation messages");
  }
};

/**
 * Get conversation by ID if user is authorized
 */
export const getConversationById = async (
  conversationId: string,
  userId: string
): Promise<ConversationWithLastMessage | null> => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          select: { id: true, name: true, email: true },
        },
        user2: {
          select: { id: true, name: true, email: true },
        },
        lastMessage: true,
      },
    });

    return conversation;
  } catch (error) {
    logger.error("[CONVERSATION_GET_ERROR]", error);
    return null;
  }
};

/**
 * Delete conversation (for admin purposes or user cleanup)
 */
export const deleteConversation = async (
  conversationId: string,
  userId: string
): Promise<boolean> => {
  try {
    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
    });

    if (!conversation) {
      return false;
    }

    // Delete conversation (messages will be deleted due to CASCADE)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    logger.info(`🗑️ Deleted conversation: ${conversationId}`);
    return true;
  } catch (error) {
    logger.error("[CONVERSATION_DELETE_ERROR]", error);
    return false;
  }
};
