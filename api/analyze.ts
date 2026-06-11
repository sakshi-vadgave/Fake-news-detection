import { analyzeNewsContent } from "../server/gemini.js";

export default async function handler(req: any, res: any) {
  // Access control headers for CORS
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
    const { content, headline, url } = req.body || {};
    if (!content || content.trim().length < 10) {
      res.status(400).json({ error: "Please enter a substantive claim or article text to analyze (at least 10 characters)." });
      return;
    }

    console.log(`Vercel Serverless: Analyzing claim of length ${content.length}`);
    const result = await analyzeNewsContent(content, headline, url);
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Vercel analyze error:", err);
    res.status(500).json({ error: err.message || "An unexpected error occurred during AI analysis." });
  }
}
