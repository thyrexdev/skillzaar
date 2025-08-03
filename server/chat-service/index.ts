import { jwtVerify } from "jose";
import type { ServerWebSocket } from "bun";
import { saveMessage } from "./src/services/message.service";

type WSData = { userId: string };

const clients = new Map<string, ServerWebSocket<WSData>>();
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);

const server = Bun.serve<WSData, {}>({
  port: 3000,

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

      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        console.warn(`[WARN] Invalid JSON from ${senderId}`);
        return;
      }

      const { recipientId, message } = data;

      if (!recipientId || !message) {
        console.warn(`[WARN] Missing recipientId or message from ${senderId}`);
        return;
      }

      console.log(`[MESSAGE] ${senderId} → ${recipientId}: ${message}`);

      // 👇 إضافة مهمة هنا
      try {
        await saveMessage({ senderId, recipientId, content: message });
        console.log("✅ Message saved to DB");
      } catch (err) {
        console.error("[DB ERROR]", err);
      }

      const recipient = clients.get(recipientId);
      if (recipient && recipient.readyState === WebSocket.OPEN) {
        recipient.send(
          JSON.stringify({
            from: senderId,
            message,
          })
        );
      }
    },

    close(ws) {
      const { userId } = ws.data;
      clients.delete(userId);
      console.log(`[CLOSE] ${userId} disconnected`);
    },
  },
});

console.log(
  `🧠 WebSocket server with JWT running at ws://localhost:${server.port}`
);
