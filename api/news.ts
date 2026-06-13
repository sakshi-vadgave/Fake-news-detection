import { fetchLiveNews } from "../server/newsCache.ts";

export default async function handler(req: any, res: any) {
  try {
    const category = req.query.category || "All";

    const result = await fetchLiveNews(category);

    return res.status(200).json(result);
  } catch (error) {
    console.error("News API Error:", error);

    return res.status(500).json({
      error: "Failed to fetch news"
    });
  }
}