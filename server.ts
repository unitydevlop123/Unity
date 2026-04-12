import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  console.log("🚀 Starting UnityDev Express Server...");
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);

  // Socket.io setup
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
    console.log("📱 Mobile user connected:", socket.id);
    socket.on("join-conversation", (id) => socket.join(id));
    socket.on("disconnect", () => console.log("📱 Mobile user disconnected"));
  });

  // API Routes
  app.get("/api/health", (req, res) => res.json({ status: "ok", database: "Firebase Ready" }));
  
  app.post("/api/admin/verify", express.json(), (req, res) => {
    const { passcode } = req.body;
    if (passcode === (process.env.ADMIN_PASSCODE || "1234")) {
      return res.json({ success: true });
    }
    return res.status(401).json({ error: "Invalid passcode" });
  });

  const isDev = true; // Force dev mode for AI Studio preview
  
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      configFile: path.resolve(process.cwd(), 'vite.config.ts'),
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    
    // SPA fallback
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      try {
        let template = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Express Server running on http://localhost:${PORT}`);
  });
}

startServer();

