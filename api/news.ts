import { fetchLiveNews } from "../server/newsCache.js";

export default async function handler(req: any, res: any) {
  try {
    const category = (req.query.category as string) || "Sports";

    const result = await fetchLiveNews(category);

    res.status(200).json(result);
  } catch (err: any) {
    console.error("NEWS ERROR:", err);

    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
}