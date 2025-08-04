import { prisma } from "../db";

export type ReadReceiptInput = {
  messageIds: string[];
  readerId: string;
};

export type ReadReceiptResult = {
  updatedMessageIds: string[];
  senderGroups: Record<string, string[]>; // senderId -> messageIds
};

/**
 * Mark messages as read and return grouped results for notification
 */
export const markMessagesAsRead = async ({
  messageIds,
  readerId,
}: ReadReceiptInput): Promise<ReadReceiptResult> => {
  try {
    const readAt = new Date();

    // Update messages as read in database
    const updateResult = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        receiverId: readerId,
        readAt: null, // Only update unread messages
      },
      data: {
        readAt,
      },
    });

    if (updateResult.count === 0) {
      return {
        updatedMessageIds: [],
        senderGroups: {},
      };
    }

    // Get the updated messages to find senders
    const updatedMessages = await prisma.message.findMany({
      where: {
        id: { in: messageIds },
        receiverId: readerId,
        readAt: readAt, // Messages that were just marked as read
      },
      select: {
        id: true,
        senderId: true,
      },
    });

    // Group messages by sender for efficient notification
    const senderGroups = updatedMessages.reduce((acc, msg) => {
      if (!acc[msg.senderId]) {
        acc[msg.senderId] = [];
      }
      acc[msg.senderId].push(msg.id);
      return acc;
    }, {} as Record<string, string[]>);

    return {
      updatedMessageIds: updatedMessages.map((msg) => msg.id),
      senderGroups,
    };
  } catch (error) {
    console.error("[READ_RECEIPT_ERROR]", error);
    throw new Error("Failed to mark messages as read");
  }
};

/**
 * Get unread message count for a user
 */
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    return await prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null,
      },
    });
  } catch (error) {
    console.error("[UNREAD_COUNT_ERROR]", error);
    return 0;
  }
};

/**
 * Get unread messages between two users
 */
export const getUnreadMessagesBetweenUsers = async (
  userId: string,
  otherUserId: string
): Promise<string[]> => {
  try {
    const unreadMessages = await prisma.message.findMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        readAt: null,
      },
      select: {
        id: true,
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    return unreadMessages.map((msg) => msg.id);
  } catch (error) {
    console.error("[UNREAD_MESSAGES_ERROR]", error);
    return [];
  }
};
