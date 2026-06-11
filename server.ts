import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { analyzeNewsContent, getChatbotResponse } from "./server/gemini.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // ----------------------------------------
  // API PROXIES FOR SECURE GEMINI INTEGRATING
  // ----------------------------------------

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "alive", timestamp: new Date().toISOString() });
  });

  // News Claim AI Verification Proxy (Keeps API key secure)
  app.post("/api/analyze", async (req, res) => {
    try {
      const { content, headline, url } = req.body;
      if (!content || content.trim().length < 10) {
        res.status(400).json({ error: "Please enter a substantive claim or article text to analyze (at least 10 characters)." });
        return;
      }

      console.log(`Analyzing claim of length ${content.length} server-side`);
      const result = await analyzeNewsContent(content, headline, url);
      res.status(200).json(result);
    } catch (e: any) {
      console.error("Analysis Endpoint Error:", e);
      res.status(500).json({ error: e.message || "An unexpected error occurred during AI analysis." });
    }
  });

  // Chatbot Assistant conversation proxy (Keeps API key secure)
  app.post("/api/chat", async (req, res) => {
    try {
      const { history, message, lastAnalysisResult } = req.body;
      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const responseText = await getChatbotResponse(history || [], message, lastAnalysisResult);
      res.json({ response: responseText });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ----------------------------------------
  // STATIC ASSETS & VITE SERVING (on PORT 3000)
  // ----------------------------------------

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TruthLens AI proxy server listening on http://localhost:${PORT}`);
  });
}

startServer();
