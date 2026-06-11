import { getChatbotResponse } from "../server/gemini.js";

export default async function handler(req: any, res: any) {
  // CORS Headers support
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const { history, message, lastAnalysisResult } = req.body || {};
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const responseText = await getChatbotResponse(history || [], message, lastAnalysisResult);
    res.status(200).json({ response: responseText });
  } catch (err: any) {
    console.error("Vercel chat error:", err);
    res.status(500).json({ error: err.message || "An unexpected error occurred in Chatbot proxy." });
  }
}
