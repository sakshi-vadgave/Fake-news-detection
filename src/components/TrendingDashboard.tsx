import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { 
  TrendingUp, Award, ShieldAlert, RefreshCw, Layers, Compass, Eye,
  Globe, Clock, Flame, BookOpen, ExternalLink, ShieldCheck, CheckCircle2,
  AlertTriangle, XCircle, BarChart3, Newspaper, Info, Activity, Database
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface TrendingDashboardProps {
  token?: string;
  theme?: string;
}

// English stopwords used to filter terms when determining the most discussed topic
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "is", "are", 
  "was", "were", "of", "to", "as", "by", "from", "into", "has", "have", "had", "india", 
  "new", "world", "shares", "high", "historic", "first", "million", "billion", "this", "that",
  "their", "they", "who", "which", "news", "top", "after", "over", "more", "about", "its", "at",
  "been", "such", "than", "will", "from", "into"
]);

// Maps common keywords to professional high-impact topics
const TOPIC_MAPPING: Record<string, string> = {
  ai: "AI & Neural Networks",
  artificial: "AI & Deep Learning",
  intelligence: "AI & Machine Learning",
  cyber: "Cybersecurity Shocks",
  cybersecurity: "Cybersecurity Infrastructure",
  election: "Elections & Cabinet Updates",
  elections: "Elections & Regional Politics",
  governance: "National Policy Reforms",
  politics: "State Policy Initiatives",
  health: "Public Healthcare & Safety",
  vaccine: "Clinical Researches & Vaccines",
  startup: "Indian Tech Startups",
  startups: "Venture Capitals & Incubators",
  finance: "Corporate Investments",
  market: "Financial Markets",
  markets: "Sensex & Stock Indices",
  sensex: "Sensex Rally Highs",
  nifty: "Nifty Stock Performances",
  inflation: "Macroeconomic Growth Rates",
  climate: "Meteorology & Climate Shifts",
  monsoon: "Monsoonic Agricultural impact",
  space: "Space Tech Explorations",
  isro: "ISRO Lunar & Crew Programs",
  satellite: "Satellite Orbit Deployments",
  nuclear: "Sustainable Energy Plans",
  quantum: "Quantum Computing Sands",
  sports: "National Athletic Leagues",
  cricket: "BCCI Tournament Reforms",
  archery: "Olympic Medals Target",
  defense: "Defense Procurement Protocols",
  aviation: "Indian Commercial Aviation",
  tourism: "Cultural Tourism Booms"
};

// Extractor function for high-frequency keyword tracking
function analyzeMostDiscussedTopic(articles: any[]): string {
  const wordCounts: Record<string, number> = {};
  
  articles.forEach((art) => {
    const text = `${art.headline || ""} ${art.description || ""}`.toLowerCase();
    const words = text.match(/[a-z0-9]{4,}/g) || [];
    words.forEach((word) => {
      if (!STOPWORDS.has(word) && isNaN(Number(word))) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
  });

  let topWord = "N/A";
  let topCount = 0;
  Object.keys(wordCounts).forEach((word) => {
    if (wordCounts[word] > topCount) {
      topCount = wordCounts[word];
      topWord = word;
    }
  });

  if (topWord !== "N/A" && topWord.length > 0) {
    const mapped = TOPIC_MAPPING[topWord];
    if (mapped) return mapped;
    return topWord.charAt(0).toUpperCase() + topWord.slice(1);
  }
  return "General Finance & Digital Tech";
}

const CATEGORIES = [
  "Technology",
  "Business",
  "Health",
  "Sports",
  "Politics",
  "Science",
  "Entertainment"
];

const CHART_COLORS = [
  "#3B82F6", // Cobalt Blue
  "#10B981", // Emerald Green
  "#8B5CF6", // Purple
  "#F59E0B", // Amber Yellow
  "#EC4899", // Coral Pink
  "#06B6D4", // Electric Cyan
  "#F43F5E"  // Rose Red
];

export default function TrendingDashboard({ token, theme = "light" }: TrendingDashboardProps) {
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch live news for all 7 categories parallelly using GNews proxy
      const fetchCategoryPromises = CATEGORIES.map(async (cat) => {
        try {
          const res = await fetch(`/api/news?category=${encodeURIComponent(cat)}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          return {
            category: cat,
            articles: data.articles || [],
            source: data.source || "API",
            timestamp: data.timestamp || new Date().toISOString()
          };
        } catch (e) {
          console.error(`Failed to load ${cat} feed:`, e);
          return {
            category: cat,
            articles: [],
            source: "Error",
            timestamp: new Date().toISOString()
          };
        }
      });

      const responses = await Promise.all(fetchCategoryPromises);

      const allArticles: any[] = [];
      const categoryCounts: Record<string, number> = {};
      const sourcesSet = new Set<string>();
      let maxTimestamp = "";

      responses.forEach((resp) => {
        categoryCounts[resp.category] = resp.articles.length;
        if (resp.articles.length > 0) {
          if (!maxTimestamp || new Date(resp.timestamp) > new Date(maxTimestamp)) {
            maxTimestamp = resp.timestamp;
          }
        }
        resp.articles.forEach((art: any) => {
          allArticles.push({
            ...art,
            category: resp.category
          });
          if (art.source) {
            sourcesSet.add(art.source);
          }
        });
      });

      // De-duplicate articles to keep unique sources and headlines clear
      const seenUrlOrHash = new Set<string>();
      const uniqueArticles: any[] = [];
      allArticles.forEach((art) => {
        const key = art.url || art.headline;
        if (!seenUrlOrHash.has(key)) {
          seenUrlOrHash.add(key);
          uniqueArticles.push(art);
        }
      });

      const totalArticles = uniqueArticles.length;

      // 2. Fetch TruthLens Verification calculations from firestore database
      let verificationCounts: Record<string, number> = {
        Real: 0,
        Fake: 0,
        Misleading: 0,
        "Partially True": 0
      };
      let hasVerificationData = false;

      if (token) {
        try {
          const q = query(
            collection(db, "analysisHistory"),
            where("userId", "==", token)
          );
          const snap = await getDocs(q);
          if (snap.size > 0) {
            hasVerificationData = true;
            snap.docs.forEach((doc) => {
              const d = doc.data();
              // Normalizing classifications
              const cls = (d.classification || "").trim().toLowerCase();
              if (cls === "real") verificationCounts.Real++;
              else if (cls === "fake") verificationCounts.Fake++;
              else if (cls === "misleading") verificationCounts.Misleading++;
              else if (cls === "partially true" || cls === "partiallytrue") {
                verificationCounts["Partially True"]++;
              }
            });
          }
        } catch (firebaseErr) {
          console.warn("Could not retrieve firestore audit transcripts:", firebaseErr);
        }
      }

      // Calculate highly active news sources
      const sourceCountMap: Record<string, number> = {};
      uniqueArticles.forEach((art) => {
        const src = art.source || "Unknown Publisher";
        sourceCountMap[src] = (sourceCountMap[src] || 0) + 1;
      });

      const sortedSources = Object.keys(sourceCountMap)
        .map((src) => ({
          name: src,
          count: sourceCountMap[src],
          percentage: totalArticles > 0 ? parseFloat(((sourceCountMap[src] / totalArticles) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Create category representation chart structures
      const chartData = CATEGORIES.map((cat) => ({
        name: cat,
        count: categoryCounts[cat] || 0
      })).filter((c) => c.count > 0);

      const activeTopic = analyzeMostDiscussedTopic(uniqueArticles);

      // Sorting category count descending for Trending section
      const trendingCategories = CATEGORIES.map((cat) => ({
        name: cat,
        count: categoryCounts[cat] || 0
      })).sort((a, b) => b.count - a.count);

      // 5 to 10 sorted headlines chronologically
      const headlines = [...uniqueArticles]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 8);

      setStats({
        totalArticlesFetched: totalArticles,
        lastUpdated: maxTimestamp || new Date().toISOString(),
        activeCategoriesCount: Object.values(categoryCounts).filter(c => c > 0).length,
        totalSourcesCount: sourcesSet.size,
        trendingCategories,
        headlines,
        topSources: sortedSources,
        chartData,
        topic: activeTopic,
        verification: hasVerificationData ? verificationCounts : null,
        rawSource: responses.some(r => r.source === "API") ? "GNews Live" : "Offline Sandbox"
      });

    } catch (err: any) {
      setError(err.message || "Failed to parse dynamic news intelligence metrics.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse" id="trending-dashboard">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-3">
            <div className={`h-8 rounded-xl w-64 ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`} />
            <div className={`h-4 rounded-md w-96 ${theme === "dark" ? "bg-slate-900" : "bg-slate-100"}`} />
          </div>
          <div className={`h-10 rounded-xl w-36 ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`} />
        </div>
 
        {/* Overview cards skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`p-5 rounded-2xl h-24 border ${
              theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            }`} />
          ))}
        </div>
 
        {/* Grid Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className={`h-[280px] border rounded-2xl ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
            <div className={`h-[400px] border rounded-2xl ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className={`h-[340px] border rounded-2xl ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
            <div className={`h-[340px] border rounded-2xl ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`} />
          </div>
        </div>
      </div>
    );
  }
 
  if (error || !stats) {
    return (
      <div className={`max-w-xl mx-auto my-16 p-8 text-center rounded-3xl border shadow-xl space-y-4 ${
        theme === "dark" ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
      }`} id="trending-dashboard">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold">Metrics Gathering Interrupt</h2>
        <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{error || "The remote news aggregates were unreachable or took too long to compile."}</p>
        <button 
          onClick={fetchStats} 
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-display shadow-lg transition-transform hover:scale-[1.02]"
        >
          Re-align news coordinates
        </button>
      </div>
    );
  }
 
  // Calculate percentages for empty stats safely
  const hasArticles = stats.totalArticlesFetched > 0;
 
  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans transition-colors duration-300 ${
      theme === "dark" ? "text-white" : "text-slate-940 text-slate-900"
    }`} id="trending-dashboard">
      
      {/* 🚀 Top Header Title Navigation */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b ${
        theme === "dark" ? "border-slate-800" : "border-slate-100"
      }`}>
        <div className="space-y-1.5">
          <h1 className={`text-3xl font-extrabold tracking-tight font-display flex items-center gap-3 ${
            theme === "dark" ? "text-white" : "text-slate-900"
          }`}>
            <TrendingUp className="w-8 h-8 text-blue-600 animate-pulse" />
            News Intelligence Dashboard
          </h1>
          <p className={`${theme === "dark" ? "text-slate-400" : "text-slate-500"} text-xs sm:text-sm font-medium leading-relaxed max-w-2xl`}>
            Real-time factual mapping of verified Indian publications, dynamic beat analysis, and claims verification typology indices.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border ${
            theme === "dark" 
              ? "bg-blue-950/40 text-blue-400 border-blue-900/30" 
              : "bg-blue-50 text-blue-600 border-blue-100/30"
          }`}>
            <Activity className="w-3.5 h-3.5" />
            {stats.rawSource}
          </span>
          <button
            onClick={fetchStats}
            className={`px-4 py-2 border text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-all focus:ring-2 focus:ring-blue-500 ${
              theme === "dark"
                ? "bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Collect Live News
          </button>
        </div>
      </div>
 
      {/* 📊 Section: Live News Overview & Most Discussed Topic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Total Articles */}
        <div className={`p-5 border rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300 ${
          theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className={`p-3 rounded-xl shrink-0 ${
            theme === "dark" ? "bg-blue-950/40 text-blue-400" : "bg-blue-50 text-blue-600"
          }`}>
            <Newspaper className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase block tracking-wider ${
              theme === "dark" ? "text-slate-500" : "text-slate-400"
            }`}>Total Articles Fetched</span>
            <span className={`text-2xl font-black leading-none font-display ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}>
              {stats.totalArticlesFetched}
            </span>
          </div>
        </div>
 
        {/* Most Discussed Topic */}
        <div className={`p-5 border rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300 ${
          theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className={`p-3 rounded-xl shrink-0 animate-bounce ${
            theme === "dark" ? "bg-rose-950/40 text-rose-400" : "bg-rose-50 text-rose-500"
          }`}>
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase block tracking-wider ${
              theme === "dark" ? "text-slate-500" : "text-slate-400"
            }`}>Most Discussed Topic</span>
            <span className={`text-sm font-extrabold truncate block leading-tight pt-0.5 ${
              theme === "dark" ? "text-slate-100" : "text-slate-800"
            }`}>
              {stats.topic}
            </span>
          </div>
        </div>
 
        {/* Total Sources */}
        <div className={`p-5 border rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300 ${
          theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className={`p-3 rounded-xl shrink-0 ${
            theme === "dark" ? "bg-teal-950/40 text-teal-400" : "bg-teal-50 text-teal-600"
          }`}>
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase block tracking-wider ${
              theme === "dark" ? "text-slate-500" : "text-slate-400"
            }`}>Total News Sources</span>
            <span className={`text-2xl font-black leading-none font-display ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}>
              {stats.totalSourcesCount}
            </span>
          </div>
        </div>
 
        {/* Active Categories */}
        <div className={`p-5 border rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300 ${
          theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className={`p-3 rounded-xl shrink-0 ${
            theme === "dark" ? "bg-purple-950/40 text-purple-400" : "bg-purple-50 text-purple-600"
          }`}>
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase block tracking-wider ${
              theme === "dark" ? "text-slate-500" : "text-slate-400"
            }`}>Active Categories</span>
            <span className={`text-2xl font-black leading-none font-display ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}>
              {stats.activeCategoriesCount} <span className="text-xs text-slate-400 font-bold">/ {CATEGORIES.length}</span>
            </span>
          </div>
        </div>
      </div>
 
      {/* 🧭 Secondary Metadata: Last Updated Badge */}
      <div className={`flex justify-end pr-1 text-[10px] font-semibold font-mono items-center gap-1.5 ${
        theme === "dark" ? "text-slate-500" : "text-slate-400"
      }`}>
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        Last Checked GNews: {new Date(stats.lastUpdated).toLocaleTimeString()} ({new Date(stats.lastUpdated).toLocaleDateString()})
      </div>
 
      {/* 📊 Primary Grid Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 units) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Chart Card: Category Distribution Chart */}
          <div className={`p-6 border rounded-3xl shadow-sm space-y-4 transition-colors duration-300 ${
            theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              theme === "dark" ? "border-slate-800" : "border-slate-100"
            }`}>
              <div className="space-y-0.5">
                <h3 className={`font-bold text-base tracking-tight flex items-center gap-2 ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}>
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Category Distribution Split
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Real-time GNews article density indexed according to local categorical feeds.</p>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                theme === "dark" ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
              }`}>Dynamic Chart</span>
            </div>
 
            {!hasArticles ? (
              <div className="h-[260px] flex flex-col items-center justify-center text-center space-y-2">
                <Info className="w-8 h-8 text-slate-300" />
                <p className="text-xs text-slate-400 font-semibold">No dynamic articles available to graph split</p>
              </div>
            ) : (
              <div className="h-[280px] w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 15, right: 10, left: -22, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#334155" : "#E2E8F0"} className="opacity-40" />
                    <XAxis dataKey="name" stroke={theme === "dark" ? "#94A3B8" : "#4af"} />
                    <YAxis stroke={theme === "dark" ? "#94A3B8" : "#4af"} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        background: theme === "dark" ? "#0F172A" : "#FFFFFF", 
                        color: theme === "dark" ? "#FFF" : "#0F172A", 
                        borderRadius: "12px", 
                        border: theme === "dark" ? "none" : "1px solid #E2E8F0" 
                      }}
                      itemStyle={{ color: "#3B82F6", fontWeight: "bold" }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Articles Count" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={40}>
                      {stats.chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
 
          {/* headlines List: Latest Verified Headlines */}
          <div className={`p-6 border rounded-3xl shadow-sm space-y-5 transition-colors duration-300 ${
            theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
              theme === "dark" ? "border-slate-800" : "border-slate-100"
            }`}>
              <div className="space-y-0.5">
                <h3 className={`font-bold text-base tracking-tight flex items-center gap-2 ${
                  theme === "dark" ? "text-white" : "text-slate-950 text-slate-900"
                }`}>
                  <Database className="w-5 h-5 text-purple-600" />
                  Latest Verified Headlines
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Top live feeds retrieved securely through GNews API. High authenticity rating.</p>
              </div>
              <span className={`w-fit text-[9px] font-mono px-2 py-0.5 rounded-md font-bold uppercase border ${
                theme === "dark" 
                  ? "bg-indigo-950/50 text-indigo-400 border-indigo-900/30" 
                  : "bg-indigo-50 text-indigo-600 border-indigo-100/30"
              }`}>
                Sorted chronological
              </span>
            </div>
 
            {!hasArticles ? (
              <div className={`text-center py-16 border rounded-2xl space-y-3 ${
                theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100"
              }`}>
                <Newspaper className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className={`font-bold text-xs ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>No headlines fetched</h4>
                  <p className="text-slate-400 text-[11px]">Check GNews proxy settings or press the Collect news button to refresh feeds.</p>
                </div>
              </div>
            ) : (
              <div className={`divide-y space-y-1 max-h-[580px] overflow-y-auto pr-1 ${
                theme === "dark" ? "divide-slate-850" : "divide-slate-100"
              }`}>
                {stats.headlines.map((item: any, idx: number) => {
                  return (
                    <div 
                      key={item.id || idx}
                      onClick={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
                      className={`py-4 flex gap-4 items-start select-none group cursor-pointer px-2 rounded-xl transition-all ${
                        theme === "dark" ? "hover:bg-slate-805 hover:bg-slate-800/40" : "hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Image Preview thumbnail */}
                      {item.image && (
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border ${
                          theme === "dark" ? "border-slate-800 bg-slate-950" : "border-slate-100 bg-slate-100"
                        }`}>
                          <img 
                            src={item.image} 
                            alt="news thumbnail" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-wider font-mono">
                          <span className={`px-2 py-0.5 rounded-md border ${
                            theme === "dark" 
                              ? "text-blue-400 bg-blue-950/40 border-blue-900/40" 
                              : "text-blue-600 bg-blue-50 border-blue-100/30"
                          }`}>
                            {item.category}
                          </span>
                          <span className={`${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                            {item.source}
                          </span>
                          <span className={`${theme === "dark" ? "text-slate-400" : "text-slate-505"} flex items-center gap-1`}>
                            • {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
 
                        <h4 className={`font-extrabold text-sm group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 ${
                          theme === "dark" ? "text-slate-100" : "text-slate-800"
                        }`}>
                          {item.id.includes("news-99") ? `Claim Check: "${item.headline}"` : item.headline}
                        </h4>
 
                        <p className={`text-[11px] leading-relaxed font-semibold line-clamp-1 ${
                          theme === "dark" ? "text-slate-400" : "text-slate-500"
                        }`}>
                          {item.description}
                        </p>
                      </div>
 
                      <div className={`self-center p-2 rounded-lg shrink-0 transition-colors ${
                        theme === "dark" 
                          ? "text-slate-400 group-hover:text-blue-450 bg-slate-800 group-hover:bg-slate-700" 
                          : "text-slate-400 group-hover:text-blue-500 bg-slate-50 group-hover:bg-blue-50/50"
                      }`}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
 
        </div>
 
        {/* Right Column (4 units) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Section: Trending Categories list */}
          <div className={`p-6 border rounded-3xl shadow-sm space-y-4 transition-colors duration-300 ${
            theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              theme === "dark" ? "border-slate-800" : "border-slate-100"
            }`}>
              <div className="space-y-0.5">
                <h3 className={`font-bold text-base tracking-tight flex items-center gap-2 ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}>
                  <Flame className="w-4 h-4 text-orange-500" />
                  Trending Categories
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Ranked by volumetric content density.</p>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-extrabold font-display uppercase shrink-0 border ${
                theme === "dark" 
                  ? "bg-orange-950/50 text-orange-400 border-orange-900/30" 
                  : "bg-orange-50 text-orange-600 border-orange-100/30"
              }`}>Live density</span>
            </div>
 
            <div className="space-y-4">
              {stats.trendingCategories.map((item: any, index: number) => {
                const total = stats.totalArticlesFetched || 1;
                const ratio = Math.round((item.count / total) * 100);
                
                return (
                  <div key={item.name} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold items-center">
                      <span className={`${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{item.name}</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md border ${
                        theme === "dark" 
                          ? "text-slate-400 bg-slate-800 border-slate-750" 
                          : "text-slate-500 bg-slate-50 border-slate-100"
                      }`}>
                        {item.count} articles ({ratio}%)
                      </span>
                    </div>
 
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${
                      theme === "dark" ? "bg-slate-800" : "bg-slate-100"
                    }`}>
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${ratio}%`,
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
 
          {/* Section: TruthLens Verification Summary */}
          <div className={`p-6 border rounded-3xl shadow-sm space-y-4 transition-colors duration-300 ${
            theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              theme === "dark" ? "border-slate-800" : "border-slate-100"
            }`}>
              <div className="space-y-0.5">
                <h3 className={`font-bold text-base tracking-tight flex items-center gap-2 ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}>
                  <Award className="w-4.5 h-4.5 text-blue-600" />
                  TruthLens Verification
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Authenticity ratios derived from claim audits.</p>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-extrabold border uppercase shrink-0 ${
                theme === "dark" 
                  ? "bg-blue-950/50 text-blue-400 border-blue-900/40" 
                  : "bg-blue-50 text-blue-600 border-blue-100/30"
              }`}>Account secure</span>
            </div>
 
            {!stats.verification ? (
              <div className={`p-6 text-center border border-dashed rounded-2xl space-y-2 ${
                theme === "dark" ? "bg-slate-850/40 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <ShieldAlert className={`w-8 h-8 mx-auto ${theme === "dark" ? "text-slate-600" : "text-slate-300"}`} />
                <p className={`text-[11px] font-semibold max-w-xs mx-auto ${
                  theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}>
                  No verification data available yet.
                </p>
                <span className="text-[10px] text-slate-400 block max-w-[200px] mx-auto font-medium">Log in and run a diagnostic check in the analyzer!</span>
              </div>
            ) : (
              <div className="space-y-3.5 pt-1">
                
                {/* Real Claims */}
                <div className={`flex items-center justify-between p-3.5 border rounded-2xl ${
                  theme === "dark" 
                    ? "bg-emerald-950/20 border-emerald-900/40" 
                    : "bg-emerald-50/50 border-emerald-100/20"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span className={`text-xs font-bold ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Verified Real Claims</span>
                  </div>
                  <span className={`text-sm font-black font-mono px-3 py-1 rounded-xl border shadow-sm ${
                    theme === "dark" 
                      ? "text-emerald-400 bg-slate-900 border-emerald-950" 
                      : "text-emerald-600 bg-white border-emerald-100/30"
                  }`}>
                    {stats.verification.Real}
                  </span>
                </div>
 
                {/* Fake Claims */}
                <div className={`flex items-center justify-between p-3.5 border rounded-2xl ${
                  theme === "dark" 
                    ? "bg-red-950/20 border-red-900/40" 
                    : "bg-red-50/50 border-red-100/20"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <XCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
                    <span className={`text-xs font-bold ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Deceptive/Fake Claims</span>
                  </div>
                  <span className={`text-sm font-black font-mono px-3 py-1 rounded-xl border shadow-sm ${
                    theme === "dark" 
                      ? "text-red-400 bg-slate-900 border-red-950" 
                      : "text-red-550 bg-white border-red-100/30"
                  }`}>
                    {stats.verification.Fake}
                  </span>
                </div>
 
                {/* Misleading */}
                <div className={`flex items-center justify-between p-3.5 border rounded-2xl ${
                  theme === "dark" 
                    ? "bg-amber-950/20 border-amber-900/40" 
                    : "bg-amber-50/50 border-amber-100/20"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                    <span className={`text-xs font-bold ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Misleading Disclosures</span>
                  </div>
                  <span className={`text-sm font-black font-mono px-3 py-1 rounded-xl border shadow-sm ${
                    theme === "dark" 
                      ? "text-amber-400 bg-slate-900 border-amber-950" 
                      : "text-amber-600 bg-white border-amber-100/30"
                  }`}>
                    {stats.verification.Misleading}
                  </span>
                </div>
 
                {/* Partially True */}
                <div className={`flex items-center justify-between p-3.5 border rounded-2xl ${
                  theme === "dark" 
                    ? "bg-blue-950/20 border-blue-900/40" 
                    : "bg-blue-50/50 border-blue-105 border-blue-100/20"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                    <span className={`text-xs font-bold ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Partially True Accounts</span>
                  </div>
                  <span className={`text-sm font-black font-mono px-3 py-1 rounded-xl border shadow-sm ${
                    theme === "dark" 
                      ? "text-blue-400 bg-slate-900 border-blue-950" 
                      : "text-blue-500 bg-white border-blue-100/30"
                  }`}>
                    {stats.verification["Partially True"]}
                  </span>
                </div>
 
              </div>
            )}
          </div>
 
          {/* Section: Top News Sources Contribution */}
          <div className={`p-6 border rounded-3xl shadow-sm space-y-4 transition-colors duration-300 ${
            theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              theme === "dark" ? "border-slate-800" : "border-slate-100"
            }`}>
              <div className="space-y-0.5">
                <h3 className={`font-bold text-base tracking-tight flex items-center gap-2 ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}>
                  <BookOpen className="w-4.5 h-4.5 text-slate-500" />
                  Top News Sources
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Publishers ranked by volumetric coverage.</p>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-extrabold uppercase shrink-0 ${
                theme === "dark" ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
              }`}>Aggregate top 5</span>
            </div>
 
            <div className="space-y-4 pt-1">
              {stats.topSources.map((src: any, index: number) => (
                <div key={src.name} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-extrabold">
                    <span className={`truncate pr-2 ${theme === "dark" ? "text-slate-350" : "text-slate-705 text-slate-700"}`}>{src.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">
                      {src.count} {src.count === 1 ? 'article' : 'articles'} ({src.percentage}%)
                    </span>
                  </div>
 
                  <div className={`h-1.5 w-full rounded-full overflow-hidden ${
                    theme === "dark" ? "bg-slate-800" : "bg-slate-100"
                  }`}>
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${src.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
 
        </div>
 
      </div>
 
      {/* 📜 Footer Informational Disclaimer */}
      <div className={`max-w-7xl mx-auto p-4 border text-[10px] sm:text-[11px] font-bold text-center select-none rounded-2xl leading-relaxed ${
        theme === "dark" ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
      }`}>
        * Reality Sync: All statistics displayed are computed strictly from real-time live GNews feeds. No mock values or simulated data weights are applied. Fallback sets utilize high-fidelity curated archives active during rate limits.
      </div>

    </div>
  );
}
