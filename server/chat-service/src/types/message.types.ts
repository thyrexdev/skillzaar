// Message type definitions for enhanced chat features

export type MessageType = "chat" | "typing_start" | "typing_stop" | "mark_read";

// Base message structure
export type BaseMessage = {
  type: MessageType;
  recipientId: string;
};

// Chat message
export type ChatMessage = BaseMessage & {
  type: "chat";
  message: string;
};

// Typing status messages
export type TypingMessage = BaseMessage & {
  type: "typing_start" | "typing_stop";
};

// Read receipt message
export type ReadReceiptMessage = BaseMessage & {
  type: "mark_read";
  messageIds: string[];
};

// Union type for all incoming messages
export type IncomingMessage = ChatMessage | TypingMessage | ReadReceiptMessage;

// Outgoing message types (server to client)
export type TypingStatusBroadcast = {
  type: "user_typing";
  from: string;
  isTyping: boolean;
};

export type ReadReceiptBroadcast = {
  type: "messages_read";
  messageIds: string[];
  readBy: string;
  readAt: string;
};

export type ChatMessageBroadcast = {
  from: string;
  message: string;
  messageId?: string;
  timestamp?: string;
};

export type OutgoingMessage = TypingStatusBroadcast | ReadReceiptBroadcast | ChatMessageBroadcast;

// Server state types
export type WSData = { userId: string };

// Typing state management
export type TypingState = Map<string, Set<string>>; // recipientId -> Set of typing userIds
export type TypingTimeouts = Map<string, NodeJS.Timeout>; // userId-recipientId -> timeout
