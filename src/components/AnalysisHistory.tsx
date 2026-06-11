import React from "react";
import { Search, Trash2, Bookmark, Star, Calendar, ArrowUpRight, ShieldAlert, BadgeCheck, FileText, Compass, AlertCircle, RefreshCw } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

interface AnalysisHistoryProps {
  onReopen: (report: any) => void;
  token: string;
  setTab: (tab: string) => void;
}

export default function AnalysisHistory({ onReopen, token, setTab }: AnalysisHistoryProps) {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Search, Filter & Sorters
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("all"); // all, favorites, Real, Fake, Misleading, Partially True, Clickbait
  const [sort, setSort] = React.useState("latest"); // latest, oldest, highestScore

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const q = query(
        collection(db, "analysisHistory"),
        where("userId", "==", token)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(items);
    } catch (err: any) {
      console.error("Failed to fetch history:", err);
      handleFirestoreError(err, OperationType.GET, "analysisHistory");
      setError(err.message || "Could not synchronize history files.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const currentItem = history.find((item) => item.id === id);
    if (!currentItem) return;

    try {
      const docRef = doc(db, "analysisHistory", id);
      await updateDoc(docRef, { isFavorite: !currentItem.isFavorite });
      setHistory((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
      );
    } catch (err: any) {
      console.error("Failed to toggle favorite:", err);
      handleFirestoreError(err, OperationType.UPDATE, `analysisHistory/${id}`);
    }
  };

  const deleteReport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this news audit transcript permanently?")) return;
    
    try {
      const docRef = doc(db, "analysisHistory", id);
      await deleteDoc(docRef);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error("Failed to delete report:", err);
      handleFirestoreError(err, OperationType.DELETE, `analysisHistory/${id}`);
      alert("Failed to delete the report.");
    }
  };

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case "Real":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "Fake":
        return "bg-red-50 text-red-700 border border-red-100";
      case "Misleading":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case "Clickbait":
        return "bg-cyan-50 text-cyan-700 border border-cyan-100";
      default:
        return "bg-indigo-50 text-indigo-700 border border-indigo-100";
    }
  };

  // Processing Local Searches, Filters, and sorts
  const filteredHistory = history
    .filter((item) => {
      // Search matches
      const textToSearch = `${item.headline || ""} ${item.content || ""} ${item.url || ""}`.toLowerCase();
      const matchesSearch = textToSearch.includes(search.toLowerCase());

      // Filter matches
      if (filter === "favorites") return matchesSearch && item.isFavorite;
      if (filter !== "all") return matchesSearch && item.classification === filter;
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime();
      }
      if (sort === "highestScore") {
        return b.authenticityScore - a.authenticityScore;
      }
      // default: latest
      return new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime();
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3" id="analysis-history">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm font-bold text-slate-500">Opening Analysis Transcripts...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" id="analysis-history">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Your Verification History
          </h1>
          <p className="text-slate-500 text-sm">Review, reopen, and manage your past AI health audits and claim verifications.</p>
        </div>
        <button
          onClick={fetchHistory}
          className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer flex items-center gap-1 bg-white ml-auto sm:ml-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refetch Entries
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search titles, transcript content or origin link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Rating filters */}
        <div className="md:col-span-4 flex items-center gap-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Filter</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
          >
            <option value="all">All Transcripts</option>
            <option value="favorites">Saved Favorites ⭐</option>
            <option value="Real">Verified Real</option>
            <option value="Fake">Fake Claims</option>
            <option value="Misleading">Misleading</option>
            <option value="Clickbait">Clickbait pitch</option>
            <option value="Partially True">Partially True</option>
          </select>
        </div>

        {/* Sorters */}
        <div className="md:col-span-3 flex items-center gap-2">
          <label className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
          >
            <option value="latest">Latest Checked</option>
            <option value="oldest">Oldest Checked</option>
            <option value="highestScore">Highest Score Match</option>
          </select>
        </div>

      </div>

      {/* SEARCH LISTINGS */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-extrabold text-slate-700 text-sm">No analysis reports identified</h3>
            <p className="text-slate-400 text-xs px-4">
              Try adjusting your filter settings, updating search queries, or run a new Claim check in the News Analyzer!
            </p>
          </div>
          <button
            onClick={() => setTab("analyzer")}
            className="mt-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
          >
            Open News Analyzer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => onReopen(item)}
              className="bg-white border hover:border-blue-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between gap-4"
            >
              
              <div className="space-y-3.5">
                {/* Meta details */}
                <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] font-semibold text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(item.analyzedAt).toLocaleDateString()}
                  </span>
                  <span>ID: {item.id}</span>
                </div>

                {/* Main titles and snippets */}
                <div className="space-y-1 shrink-1">
                  <h3 className="font-extrabold text-slate-800 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                    "{item.headline || "Unheaded News Claim Scan"}"
                  </h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2">
                    {item.content}
                  </p>
                </div>
              </div>

              {/* Bottom indicators */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 flex-wrap gap-2.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getClassificationBadge(item.classification)}`}>
                    {item.classification}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 border px-2 py-0.5 rounded-lg">
                    {item.authenticityScore}% Score
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {/* Favorite toggle button */}
                  <button
                    onClick={(e) => toggleFavorite(e, item.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      item.isFavorite
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-white border-slate-200 text-slate-400 hover:text-amber-500"
                    }`}
                    title={item.isFavorite ? "Saved Favorite" : "Save Favorite"}
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>

                  {/* Delete button (Seed items won't be deleted) */}
                  {!item.id.startsWith("seed-") && (
                    <button
                      onClick={(e) => deleteReport(e, item.id)}
                      className="p-2 border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-xl transition-all"
                      title="Clear from transcript history log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <span className="p-2 bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 rounded-xl transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
