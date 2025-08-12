import { jwtVerify } from "jose";
import type { ServerWebSocket } from "bun";
import {
  handleChatMessage,
  handleTypingMessage,
  handleReadReceipt,
  handleUserDisconnect,
  setClientsMap,
} from "./handlers/messageHandlers";
import type { WSData, IncomingMessage } from "./types/message.types";

const clients = new Map<string, ServerWebSocket<WSData>>();
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);

// Initialize handlers with clients map
setClientsMap(clients);

const server = Bun.serve<WSData, {}>({
  port: 5002,

  async fetch(req, server) {
    const upgradeHeader = req.headers.get("upgrade") || "";
    if (upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("WebSocket server only", { status: 400 });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response("Missing token", { status: 401 });
    }

    let userId = "";
    try {
      const { payload } = await jwtVerify(token, jwtSecret);
      if (!payload.sub) {
        return new Response("Invalid token payload", { status: 401 });
      }
      userId = payload.sub;
    } catch (err) {
      console.error("[JWT ERROR]", err);
      return new Response("Invalid token", { status: 401 });
    }

    const success = server.upgrade(req, {
      data: { userId },
    });

    if (!success) {
      return new Response("Upgrade failed", { status: 400 });
    }
  },

  websocket: {
    open(ws) {
      const { userId } = ws.data;
      clients.set(userId, ws);
      console.log(`[OPEN] ${userId} connected`);
    },

    message: async (ws, raw) => {
      const senderId = ws.data.userId;

      let data: IncomingMessage;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        console.warn(`[WARN] Invalid JSON from ${senderId}`);
        return;
      }

      // Handle different message types
      const messageType = data.type || "chat"; // Default to chat for backward compatibility

      try {
        switch (messageType) {
          case "chat":
            await handleChatMessage(ws, data as any);
            break;

          case "typing_start":
          case "typing_stop":
            handleTypingMessage(ws, data as any);
            break;

          case "mark_read":
            await handleReadReceipt(ws, data as any);
            break;

          default:
            // Handle legacy format (backward compatibility)
            if (data.recipientId && (data as any).message) {
              await handleChatMessage(ws, {
                type: "chat",
                recipientId: data.recipientId,
                message: (data as any).message,
              });
            } else {
              console.warn(`[WARN] Unknown message type: ${messageType} from ${senderId}`);
            }
        }
      } catch (error) {
        console.error(`[MESSAGE_HANDLER_ERROR] ${messageType}:`, error);
      }
    },

    close(ws) {
      const { userId } = ws.data;
      clients.delete(userId);
      handleUserDisconnect(userId);
      console.log(`[CLOSE] ${userId} disconnected`);
    },
  },
});

console.log(
  `🧠 WebSocket server with JWT running at ws://localhost:${server.port}`
);
