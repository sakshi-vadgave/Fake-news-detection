import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { analyzeNewsContent, getChatbotResponse, extractTextFromImage, generateNewsFeedAudit } from "./server/gemini.js";
import { fetchLiveNews } from "./server/newsCache.js";

dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware with expanded limits to support base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ----------------------------------------
  // API PROXIES FOR SECURE GEMINI INTEGRATING
  // ----------------------------------------

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "alive", timestamp: new Date().toISOString() });
  });

  // Dynamically serve Firebase config to client to keep keys out of static JS files
  app.get("/firebase-config.js", (req, res) => {
    let fileConfig: any = {};
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      }
    } catch (err) {
      console.warn("Failed to read firebase-applet-config.json:", err);
    }

    const finalConfig = {
      apiKey: fileConfig.apiKey || process.env.VITE_FIREBASE_API_KEY || "",
      authDomain: fileConfig.authDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
      projectId: fileConfig.projectId || process.env.VITE_FIREBASE_PROJECT_ID || "",
      storageBucket: fileConfig.storageBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: fileConfig.messagingSenderId || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: fileConfig.appId || process.env.VITE_FIREBASE_APP_ID || "",
      firestoreDatabaseId: fileConfig.firestoreDatabaseId || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "",
    };

    res.setHeader("Content-Type", "application/javascript");
    res.send(`window.FIREBASE_CONFIG = ${JSON.stringify(finalConfig)};`);
  });

  // Serve Firebase config as JSON directly for synchronous fallback fetching
  app.get("/api/firebase-config", (req, res) => {
    let fileConfig: any = {};
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      }
    } catch (err) {
      console.warn("Failed to read firebase-applet-config.json:", err);
    }

    const finalConfig = {
      apiKey: fileConfig.apiKey || process.env.VITE_FIREBASE_API_KEY || "",
      authDomain: fileConfig.authDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
      projectId: fileConfig.projectId || process.env.VITE_FIREBASE_PROJECT_ID || "",
      storageBucket: fileConfig.storageBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: fileConfig.messagingSenderId || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: fileConfig.appId || process.env.VITE_FIREBASE_APP_ID || "",
      firestoreDatabaseId: fileConfig.firestoreDatabaseId || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "",
    };

    res.json(finalConfig);
  });

  // Secure news proxy endpoint (returns filtered, sorted, non-AI real news)
  app.get("/api/news", async (req, res) => {
    try {
      const category = (req.query.category as string) || "All";
      console.log(`[API PROXY] Requesting news for category: ${category}`);
      const newsData = await fetchLiveNews(category);
      res.status(200).json(newsData);
    } catch (e: any) {
      console.error("API News proxy endpoint error:", e);
      res.status(500).json({ error: "Failed to fetch real-time news feed" });
    }
  });

  // News Feed TruthLens AI audit verification (Keeps API key secure)
  app.post("/api/news/verify", async (req, res) => {
    try {
      const { headline, description, url, source } = req.body;
      if (!headline) {
        res.status(400).json({ error: "Headline is required for news audit" });
        return;
      }
      const audit = await generateNewsFeedAudit(headline, description || "", url || "", source || "Unknown Source");
      res.status(200).json(audit);
    } catch (e: any) {
      console.error("API news verify endpoint error:", e);
      res.status(500).json({ error: "Failed to generate AI news audit at this time" });
    }
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

  // OCR Image Text Extraction (Keeps API key secure)
  app.post("/api/ocr-extract", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        res.status(400).json({ error: "Image data is required for OCR processing." });
        return;
      }

      console.log(`Extracting text from image via Gemini OCR`);
      const extractedText = await extractTextFromImage(image, mimeType);
      res.status(200).json({ text: extractedText });
    } catch (e: any) {
      console.error("OCR Extraction Endpoint Error:", e);
      res.status(500).json({ error: e.message || "An unexpected error occurred during OCR text extraction." });
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
