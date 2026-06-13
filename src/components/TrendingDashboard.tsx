import React from "react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Award, Users, ShieldAlert, PieChart as PieIcon, RefreshCw, Layers, Compass, Eye } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function TrendingDashboard() {
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      let fireUsersCount = 0;
      let fireHistoryCount = 0;
      let dist: any[] = [];

      try {
        const usersSnap = await getDocs(collection(db, "users"));
        fireUsersCount = usersSnap.size;
      } catch (e) {
        console.warn("Restricted user count access (expected for non-admins). Using secure demographics fallback.");
      }

      try {
        const historySnap = await getDocs(collection(db, "analysisHistory"));
        fireHistoryCount = historySnap.size;

        // Classifying results directly from genuine logs
        const categoryCounts: { [key: string]: number } = {};
        historySnap.docs.forEach((doc) => {
          const d = doc.data();
          const cls = d.classification || "Partially True";
          categoryCounts[cls] = (categoryCounts[cls] || 0) + 1;
        });

        dist = Object.keys(categoryCounts).map((cat) => ({
          name: cat,
          value: categoryCounts[cat]
        }));
      } catch (e) {
        console.warn("Restricted history access (expected for non-admins). Using secure verification log fallback.");
      }

      // High-fidelity fallback metrics if db is empty or restricted
      const totalUsers = fireUsersCount > 0 ? fireUsersCount : 34;
      const totalAnalyses = fireHistoryCount > 0 ? fireHistoryCount : 156;
      const finalDist = dist.length > 0 ? dist : [
        { name: "Real", value: 42 },
        { name: "Fake", value: 68 },
        { name: "Misleading", value: 25 },
        { name: "Partially True", value: 11 },
        { name: "Clickbait", value: 10 }
      ];

      const weekly = [
        { name: "Mon", real: 4, fake: 8 },
        { name: "Tue", real: 6, fake: 11 },
        { name: "Wed", real: 8, fake: 7 },
        { name: "Thu", real: 12, fake: 18 },
        { name: "Fri", real: 9, fake: 14 },
        { name: "Sat", real: 3, fake: 6 },
        { name: "Sun", real: 5, fake: 4 }
      ];

      const monthly = [
        { name: "Jan", count: 35 },
        { name: "Feb", count: 48 },
        { name: "Mar", count: 72 },
        { name: "Apr", count: 95 },
        { name: "May", count: 124 },
        { name: "Jun", count: totalAnalyses }
      ];

      let newsHubStatsList: any[] = [];
      try {
        const statsSnap = await getDocs(collection(db, "newsHubStats"));
        statsSnap.forEach((doc) => {
          newsHubStatsList.push({ id: doc.id, ...doc.data() });
        });
      } catch (e) {
        console.warn("Restricted news hub stats snap access (standard guest context). Using high-fidelity seeded stats:");
      }

      if (newsHubStatsList.length === 0) {
        newsHubStatsList = [
          { id: "article-1", headline: "Bipartisan Committee Reaches Landmark Agreement on National Privacy Standard", category: "Politics", viewCount: 142, analyzeCount: 56, label: "Trending" },
          { id: "article-2", headline: "Silicon Valley Labs Announce Breakthrough 120-Qubit Quantum Computing Node", category: "Technology", viewCount: 98, analyzeCount: 34, label: "Popular" },
          { id: "article-3", headline: "Retail Giant Integrates Autonomous Logistics Vehicles in Ten Distribution Hubs", category: "Business", viewCount: 84, analyzeCount: 28, label: "Recent" },
          { id: "article-4", headline: "Marine Expedition Uncovers 45 Unrecorded Deep-Sea Species Near Marianas", category: "Science", viewCount: 120, analyzeCount: 15, label: "Rising" },
          { id: "article-5", headline: "Clinical Verification Completed for Peptide-Based Asthma Inhaler Compound", category: "Health", viewCount: 110, analyzeCount: 42, label: "Popular" },
          { id: "article-6", headline: "Major Cybersecurity Framework Released to Protect Public Cloud Infrastructure", category: "Technology", viewCount: 160, analyzeCount: 75, label: "Trending" },
          { id: "article-7", headline: "Trade Delegation Finalizes Multi-Lateral Customs Modernization Accords", category: "Business", viewCount: 75, analyzeCount: 20, label: "Recent" },
          { id: "article-8", headline: "Global Meteorological Observatory Records Steady Oceanic Temperature Fluctuations", category: "Science", viewCount: 95, analyzeCount: 30, label: "Rising" },
          { id: "article-9", headline: "Health Authorities Deliver Recommendations for Seasonal Preventive Immunization", category: "Health", viewCount: 105, analyzeCount: 35, label: "Popular" }
        ];
      }

      const mostViewed = [...newsHubStatsList].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5);
      const mostAnalyzed = [...newsHubStatsList].sort((a, b) => (b.analyzeCount || 0) - (a.analyzeCount || 0)).slice(0, 5);

      const catSums: { [key: string]: number } = {};
      newsHubStatsList.forEach((item) => {
        const cat = item.category || "Unassigned";
        const sum = (item.viewCount || 0) + (item.analyzeCount || 0);
        catSums[cat] = (catSums[cat] || 0) + sum;
      });
      const trendingCategories = Object.keys(catSums).map((cat) => ({
        name: cat,
        value: catSums[cat]
      })).sort((a, b) => b.value - a.value);

      setStats({
        totalUsers,
        totalAnalyses,
        accuracyRate: 98.4,
        fakeRatio: fireHistoryCount > 0 ? Math.floor((dist.find(d => d.name === "Fake" || d.name === "Misleading")?.value || 0) / fireHistoryCount * 100) : 65,
        activeUsers24h: Math.max(Math.floor(totalUsers * 0.3), 1),
        categoryDistribution: finalDist,
        weeklyTrends: weekly,
        monthlyTrends: monthly,
        mostViewed,
        mostAnalyzed,
        trendingCategories
      });
    } catch (e: any) {
      setError(e.message || "Failed to retrieve tracking data.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3" id="trending-dashboard">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm font-bold text-slate-500">Retrieving News Engagement Data...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-slate-50 rounded-2xl border" id="trending-dashboard">
        <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-slate-600 text-sm">{error || "Data compilation error"}</p>
        <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
          Retry Sync
        </button>
      </div>
    );
  }

  const COLORS = ["#10B981", "#EF4444", "#F59E0B", "#3B82F6", "#8B5CF6"];

  const getQualitativeLabel = (item: any): string => {
    if (item.label) return item.label;
    const view = item.viewCount || 0;
    const scans = item.analyzeCount || 0;
    const sum = view + scans;
    if (sum >= 180) return "Trending";
    if (view >= 110) return "Popular";
    if (view >= 90) return "Rising";
    return "Recent";
  };

  const getLabelColor = (label: string): string => {
    switch (label?.toLowerCase()) {
      case "trending":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "rising":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "popular":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "recent":
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans" id="trending-dashboard">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Media & News Literacy Engagement
          </h1>
          <p className="text-slate-500 text-sm">
            Factual engagement summaries, distribution splits across categories, and claim typology indices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full select-none">
            Demo Analytics
          </span>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-white hover:bg-slate-50 border text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Feed
          </button>
        </div>
      </div>

      {/* ADMIN STAT CARD QUICK GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-1.5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Indexed Claims</span>
            <span className="text-xl font-extrabold text-slate-900">{stats.totalAnalyses}</span>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-1.5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Observer Corps</span>
            <span className="text-xl font-extrabold text-slate-900">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-1.5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Unverified Ratio</span>
            <span className="text-xl font-extrabold text-orange-600">{stats.fakeRatio}%</span>
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-1.5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Verification Accuracy</span>
            <span className="text-xl font-extrabold text-emerald-600">{stats.accuracyRate}%</span>
          </div>
        </div>
      </div>

      {/* PRIMARY RECHARTS PANEL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: WEEKLY DISTRIBUTION SPLIT (Area) */}
        <div className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm lg:col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">Weekly Fact check Outcomes</h3>
              <p className="text-[11px] text-slate-400">Comparing verified factual indices to suspicious fabrications daily.</p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
              Demo Analytics
            </span>
          </div>
          <div className="h-[280px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFake" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ background: "#0F172A", color: "#FFF", borderRadius: "8px" }} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="real" name="Verified Factual" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReal)" />
                <Area type="monotone" dataKey="fake" name="Deceptive Claims" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFake)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: CATEGORIES OF SUSPICIOUS MEDIA (Pie) */}
        <div className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm lg:col-span-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-[15px] tracking-tight flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-slate-500" />
              Claim Typology Categories
            </h3>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
              Demo
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Aggregate split of overall claim verifications.</p>
          <div className="h-[180px] w-full flex items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.categoryDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1E293B", color: "#fff", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-50">
            {stats.categoryDistribution.map((entry: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate" title={entry.name}>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECONDARY PANEL METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* CHART 3: TOTAL CHRONICLED MONTHLY PROGRESS */}
        <div className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm md:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">Chronicled Analysis Scale</h3>
              <p className="text-[11px] text-slate-400">Month-over-month volume of tracked queries.</p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
              Demo Analytics
            </span>
          </div>
          <div className="h-[240px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ background: "#0F172A", color: "#FFF", borderRadius: "8px" }} />
                <Bar dataKey="count" name="Audited Count" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DYNAMIC CAMPAIGN FOCUS BOARD */}
        <div className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm md:col-span-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">Active Education Campaigns</h3>
                <p className="text-[11px] text-slate-400">Top media training & feedback initiatives active this week.</p>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md shrink-0">
                Demo
              </span>
            </div>
            
            <div className="space-y-3.5">
              <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-2">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 block">Digital Verification Seminars</span>
                  <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full w-fit block mt-1">Active Class</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 block">Weekly Highlight</span>
                  <span className="text-[10px] text-slate-405 leading-normal block">Technology</span>
                </div>
              </div>

              <div className="flex justify-between items-start text-xs border-b border-slate-100 pb-2">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 block">Evaluating Algorithmic Feeds</span>
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full w-fit block mt-1">Curriculum Launch</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 block">In Progress</span>
                  <span className="text-[10px] text-slate-405 leading-normal block">Media Literacy</span>
                </div>
              </div>

              <div className="flex justify-between items-start text-xs rounded-xl">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 block">Navigating Clinical/Health Reports</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full w-fit block mt-1">Scientific Clarity</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 block">Syllabus Complete</span>
                  <span className="text-[10px] text-slate-405 leading-normal block">Science & Health</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 mt-4">
            <Award className="w-7 h-7 text-emerald-600 shrink-0" />
            <p className="text-[11px] leading-relaxed font-semibold">
              These simulations and learning markers update each session to display the full potential of regional tracking.
            </p>
          </div>
        </div>

      </div>

      {/* REAL-TIME NEWS HUB CLICKS & ENGAGEMENT METRICS */}
      <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-950 text-lg tracking-tight">
              Latest News Hub Engagement & Spotlight Categories
            </h3>
            <p className="text-xs text-slate-500">
              Assigned qualitative parameters evaluating key topical beats in Technology, Politics, Health, Science, and Business.
            </p>
          </div>
          <span className="w-fit text-[11px] font-extrabold px-2.5 py-1 bg-slate-100 text-slate-650 border border-slate-200 rounded-full select-none shrink-0">
            Demo Analytics
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Trending Spotlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Eye className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider font-mono">Trending & Popular Spotlights</h4>
            </div>
            
            <div className="space-y-3">
              {stats.mostViewed?.map((item: any) => {
                const label = item.label || getQualitativeLabel(item);
                return (
                  <div key={item.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/75 border border-slate-100 rounded-2xl space-y-2.5 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono font-black text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getLabelColor(label)}`}>
                        {label}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-xs leading-relaxed line-clamp-2">
                      {item.headline}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Recent Audiences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider font-mono">Audited & Rising Topics</h4>
            </div>

            <div className="space-y-3">
              {stats.mostAnalyzed?.map((item: any) => {
                const label = item.label || getQualitativeLabel(item);
                return (
                  <div key={item.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/75 border border-slate-100 rounded-2xl space-y-2.5 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono font-black text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getLabelColor(label)}`}>
                        {label}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-xs leading-relaxed line-clamp-2">
                      {item.headline}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Categorized Engagements */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Compass className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider font-mono">Subject Engagement Ratios</h4>
            </div>

            <div className="space-y-4.5 pt-1">
              {stats.trendingCategories?.map((item: any) => {
                // Determine a nice qualitative rating
                let scaleText = "Moderate";
                let scaleColor = "text-slate-500";
                let indicatorColor = "bg-slate-400";
                let pctWidth = 50;

                if (item.name === "Technology") {
                  scaleText = "Critical";
                  scaleColor = "text-rose-600";
                  indicatorColor = "bg-rose-500";
                  pctWidth = 92;
                } else if (item.name === "Politics") {
                  scaleText = "Elevated";
                  scaleColor = "text-amber-600";
                  indicatorColor = "bg-amber-500";
                  pctWidth = 78;
                } else if (item.name === "Health" || item.name === "Science") {
                  scaleText = "Substantial";
                  scaleColor = "text-emerald-600";
                  indicatorColor = "bg-emerald-500";
                  pctWidth = 65;
                } else {
                  pctWidth = 40;
                }

                return (
                  <div key={item.name} className="space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-700">{item.name}</span>
                      <span className={`font-mono text-[10px] uppercase font-black ${scaleColor}`}>{scaleText} Engagement</span>
                    </div>
                    {/* Visual Segmented Progress indicators */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${indicatorColor} rounded-full transition-all duration-500`}
                        style={{ width: `${pctWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Informative alert foot */}
        <div className="p-4 bg-slate-50 border rounded-2xl text-[11px] text-slate-500 font-semibold text-center select-none">
          * Demo Analytics: These statistics represent simulated media literacy engagement data configured explicitly for demonstration purposes.
        </div>
      </div>

    </div>
  );
}
