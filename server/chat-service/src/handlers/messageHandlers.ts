import type { ServerWebSocket } from "bun";
import { saveMessage } from "../services/message.service";
import { markMessagesAsRead } from "../services/readReceipt.service";
import type {
  WSData,
  ChatMessage,
  TypingMessage,
  ReadReceiptMessage,
  TypingStatusBroadcast,
  ReadReceiptBroadcast,
  ChatMessageBroadcast,
  TypingState,
  TypingTimeouts,
} from "../types/message.types";

// Global state for typing status
const typingUsers: TypingState = new Map();
const typingTimeouts: TypingTimeouts = new Map();

// Connection management (imported from main server)
let clients: Map<string, ServerWebSocket<WSData>>;

export const setClientsMap = (clientsMap: Map<string, ServerWebSocket<WSData>>) => {
  clients = clientsMap;
};

/**
 * Send message to a specific user if they're online
 */
const sendToUser = (userId: string, message: any) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
    return true;
  }
  return false;
};

/**
 * Handle chat message sending
 */
export const handleChatMessage = async (
  ws: ServerWebSocket<WSData>,
  data: ChatMessage
): Promise<void> => {
  const senderId = ws.data.userId;
  const { recipientId, message } = data;

  if (!recipientId || !message) {
    console.warn(`[WARN] Missing recipientId or message from ${senderId}`);
    return;
  }

  console.log(`[MESSAGE] ${senderId} → ${recipientId}: ${message}`);

  try {
    // Save message to database
    const savedMessage = await saveMessage({
      senderId,
      recipientId,
      content: message,
    });

    console.log("✅ Message saved to DB");

    // Clear typing status if sender was typing
    handleTypingStop(senderId, recipientId);

    // Prepare message for recipient
    const messageToSend: ChatMessageBroadcast = {
      from: senderId,
      message,
      messageId: savedMessage.id,
      timestamp: savedMessage.timestamp.toISOString(),
    };

    // Send to recipient if online
    const delivered = sendToUser(recipientId, messageToSend);
    
    if (delivered) {
      console.log(`✅ Message delivered to ${recipientId}`);
    } else {
      console.log(`📱 Recipient ${recipientId} is offline - message saved for later`);
    }

  } catch (error) {
    console.error("[MESSAGE_ERROR]", error);
  }
};

/**
 * Handle typing status start
 */
export const handleTypingStart = (
  senderId: string,
  recipientId: string
): void => {
  // Add to typing users
  if (!typingUsers.has(recipientId)) {
    typingUsers.set(recipientId, new Set());
  }
  typingUsers.get(recipientId)!.add(senderId);

  // Clear existing timeout for this user-recipient pair
  const timeoutKey = `${senderId}-${recipientId}`;
  if (typingTimeouts.has(timeoutKey)) {
    clearTimeout(typingTimeouts.get(timeoutKey)!);
  }

  // Set auto-timeout (5 seconds)
  const timeout = setTimeout(() => {
    handleTypingStop(senderId, recipientId);
  }, 5000);

  typingTimeouts.set(timeoutKey, timeout);

  // Notify recipient
  const typingMessage: TypingStatusBroadcast = {
    type: "user_typing",
    from: senderId,
    isTyping: true,
  };

  const sent = sendToUser(recipientId, typingMessage);
  if (sent) {
    console.log(`⌨️  Typing status sent: ${senderId} → ${recipientId}`);
  }
};

/**
 * Handle typing status stop
 */
export const handleTypingStop = (
  senderId: string,
  recipientId: string
): void => {
  // Remove from typing users
  if (typingUsers.has(recipientId)) {
    typingUsers.get(recipientId)!.delete(senderId);
    if (typingUsers.get(recipientId)!.size === 0) {
      typingUsers.delete(recipientId);
    }
  }

  // Clear timeout
  const timeoutKey = `${senderId}-${recipientId}`;
  if (typingTimeouts.has(timeoutKey)) {
    clearTimeout(typingTimeouts.get(timeoutKey)!);
    typingTimeouts.delete(timeoutKey);
  }

  // Notify recipient
  const typingMessage: TypingStatusBroadcast = {
    type: "user_typing",
    from: senderId,
    isTyping: false,
  };

  const sent = sendToUser(recipientId, typingMessage);
  if (sent) {
    console.log(`🛑 Typing stopped: ${senderId} → ${recipientId}`);
  }
};

/**
 * Handle typing message from WebSocket
 */
export const handleTypingMessage = (
  ws: ServerWebSocket<WSData>,
  data: TypingMessage
): void => {
  const senderId = ws.data.userId;
  const { type, recipientId } = data;

  if (!recipientId) {
    console.warn(`[WARN] Missing recipientId in typing message from ${senderId}`);
    return;
  }

  if (type === "typing_start") {
    handleTypingStart(senderId, recipientId);
  } else if (type === "typing_stop") {
    handleTypingStop(senderId, recipientId);
  }
};

/**
 * Handle read receipt marking
 */
export const handleReadReceipt = async (
  ws: ServerWebSocket<WSData>,
  data: ReadReceiptMessage
): Promise<void> => {
  const readerId = ws.data.userId;
  const { messageIds } = data;

  if (!messageIds || messageIds.length === 0) {
    console.warn(`[WARN] Missing messageIds in read receipt from ${readerId}`);
    return;
  }

  try {
    // Mark messages as read in database
    const result = await markMessagesAsRead({
      messageIds,
      readerId,
    });

    if (result.updatedMessageIds.length === 0) {
      console.log(`📖 No new messages marked as read for ${readerId}`);
      return;
    }

    console.log(
      `✅ Marked ${result.updatedMessageIds.length} messages as read for ${readerId}`
    );

    // Send read receipts to senders
    Object.entries(result.senderGroups).forEach(([senderId, msgIds]) => {
      const readReceiptMessage: ReadReceiptBroadcast = {
        type: "messages_read",
        messageIds: msgIds,
        readBy: readerId,
        readAt: new Date().toISOString(),
      };

      const sent = sendToUser(senderId, readReceiptMessage);
      if (sent) {
        console.log(
          `📖 Read receipt sent to ${senderId} for ${msgIds.length} messages`
        );
      }
    });

  } catch (error) {
    console.error("[READ_RECEIPT_ERROR]", error);
  }
};

/**
 * Clean up typing status when user disconnects
 */
export const handleUserDisconnect = (userId: string): void => {
  // Clear all typing timeouts for this user
  const timeoutsToDelete: string[] = [];
  typingTimeouts.forEach((timeout, key) => {
    if (key.startsWith(`${userId}-`)) {
      clearTimeout(timeout);
      timeoutsToDelete.push(key);
      
      // Extract recipientId and send typing stop
      const recipientId = key.split("-")[1];
      if (recipientId) {
        handleTypingStop(userId, recipientId);
      }
    }
  });

  // Clean up timeout entries
  timeoutsToDelete.forEach(key => {
    typingTimeouts.delete(key);
  });

  // Remove user from all typing states
  typingUsers.forEach((userSet, recipientId) => {
    if (userSet.has(userId)) {
      userSet.delete(userId);
      if (userSet.size === 0) {
        typingUsers.delete(recipientId);
      }
    }
  });

  console.log(`🧹 Cleaned up typing state for disconnected user: ${userId}`);
};
