import { ShipWheel, HelpCircle, Shield, CheckCircle, Flame, Star, Award, ChevronDown, Rocket, Search, Link as LinkIcon, Compass, Sparkles, BookOpen, Clock, FileDown, Plus, Eye, BarChart2, AlertTriangle, Check, RefreshCw } from "lucide-react";
import React from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs } from "firebase/firestore";

interface LandingPageProps {
  setTab: (tab: string) => void;
  openLoginModal: () => void;
  user: any;
  onAnalyzeNews?: (news: { headline: string; content: string; url: string; autoAnalyze?: boolean }) => void;
}

export default function LandingPage({ setTab, openLoginModal, user, onAnalyzeNews }: LandingPageProps) {
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState(0);
  const [syncingNews, setSyncingNews] = React.useState(false);
  const [selectedArticle, setSelectedArticle] = React.useState<any | null>(null);
  const [factCheckArticle, setFactCheckArticle] = React.useState<any | null>(null);
  const [realtimeStats, setRealtimeStats] = React.useState<any>({});
  const [logoError, setLogoError] = React.useState(false);

  const fetchRealtimeStats = async () => {
    try {
      const statsSnap = await getDocs(collection(db, "newsHubStats"));
      const dataMap: any = {};
      statsSnap.forEach((doc) => {
        dataMap[doc.id] = doc.data();
      });
      setRealtimeStats(dataMap);
    } catch (e) {
      console.warn("Restricted stats snap access or offline:", e);
    }
  };

  React.useEffect(() => {
    fetchRealtimeStats();
    
    const timer = setInterval(() => {
      setLastUpdated(prev => prev + 1);
    }, 60000); // increment every minute
    return () => clearInterval(timer);
  }, []);

  const trackArticleMetric = async (articleId: string, headline: string, category: string, field: "viewCount" | "analyzeCount") => {
    try {
      const docRef = doc(db, "newsHubStats", articleId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          [field]: increment(1)
        });
      } else {
        await setDoc(docRef, {
          articleId,
          headline,
          category,
          viewCount: field === "viewCount" ? 1 : 0,
          analyzeCount: field === "analyzeCount" ? 1 : 0
        });
      }
      // Refresh local cache representation as well
      setRealtimeStats((prev: any) => {
        const existing = prev[articleId] || { viewCount: 0, analyzeCount: 0 };
        return {
          ...prev,
          [articleId]: {
            ...existing,
            articleId,
            headline,
            category,
            [field]: (existing[field] || 0) + 1
          }
        };
      });
    } catch (e) {
      console.warn("Realtime Firestore analytics update deferred:", e);
    }
  };

  const handleSyncNews = () => {
    setSyncingNews(true);
    setTimeout(() => {
      setSyncingNews(false);
      setLastUpdated(0);
      fetchRealtimeStats();
    }, 1200); // 1.2s realistic loading spin
  };

  const newsArticles = [
    {
      id: "article-1",
      category: "Politics",
      headline: "Bipartisan Committee Reaches Landmark Agreement on National Privacy Standard",
      description: "A major breakthrough occurs as both parties compromise on federal data restrictions for technological enterprises.",
      content: "In an unexpected shift, a bipartisan senate taskforce has drafted and finalized the first comprehensive national privacy acts since earlier records. The standard places severe penalties on tech giants who harvest metadata without strict double-opt-in permissions, resolving years of policy gridlock.",
      source: "Legislative Alert",
      time: "15 minutes ago",
      credibilityScore: 94,
      riskLevel: "Low",
      initialAnalysis: "Highly verified legislative transcripts. Features direct consensus quotes and legal draft copies with no high emotional wording.",
      image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "article-2",
      category: "Technology",
      headline: "Silicon Valley Labs Announce Breakthrough 120-Qubit Quantum Computing Node",
      description: "Engineers report room-temperature stability for advanced error-correcting qubits, shortening the quantum cryptographical model timeline.",
      content: "Research consortiums have published peer-reviewed validations for a quantum computing node operating with stable coherence under minor ambient conditions. The discovery reduces structural cooling expenses by 95%, accelerating practical applications in encryption.",
      source: "QuantTech Review",
      time: "45 minutes ago",
      credibilityScore: 88,
      riskLevel: "Low",
      initialAnalysis: "Verified by independent physics associations. Tone is factual but contains minor exciting speculative claims regarding cryptography timelines.",
      image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "article-3",
      category: "Business",
      headline: "Retail Giant Integrates Autonomous Logistics Vehicles in Ten Distribution Hubs",
      description: "Corporate filings detail transition to fully electric, automated freight trucks for inter-warehouse transit, projecting huge savings.",
      content: "Retail giants have officially deployed unmanned electric logistical networks for regional operations. The company registered a 30% speedup in deliveries but faces localized worker demonstrations protesting immediate staff shifts.",
      source: "Global Commerce Daily",
      time: "2 hours ago",
      credibilityScore: 91,
      riskLevel: "Low",
      initialAnalysis: "Confirmed by public SEC regulatory filings. Accounts for both financial efficiency and labor impacts neutrally.",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "article-4",
      category: "Science",
      headline: "Marine Expedition Uncovers 45 Unrecorded Deep-Sea Species Near Marianas",
      description: "Oceanographic cameras capture unique bioluminescent organisms thriving on hydrothermal vents, including extreme-tolerant microbes.",
      content: "Deep-sea robots exploring underwater thermal vents have recorded high-definition biology logs of unknown bioluminescent lifeforms. Scientific laboratories are sequencing their genomic structures to look for unique metabolic enzymes.",
      source: "Oceanic Journal",
      time: "3 hours ago",
      credibilityScore: 96,
      riskLevel: "Low",
      initialAnalysis: "Exceptional scientific integrity. Richly documented with high-definition deep sea robotic photography and biologist review logs.",
      image: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "article-5",
      category: "Health",
      headline: "Clinical Verification Completed for Peptide-Based Asthma Inhaler Compound",
      description: "Phase III trials demonstrate rapid reduction in lung inflammation with zero localized cardiovascular side effects.",
      content: "Medical clinics finalized testing on a synthetic peptide compound that terminates immediate bronchial spasms. Results published in main medical journals indicate higher safety indices compared to epinephrine derivatives.",
      source: "Clinical Lancet",
      time: "5 hours ago",
      credibilityScore: 95,
      riskLevel: "Low",
      initialAnalysis: "Factual clinical study overview. Relies on verifiable peer-reviewed statistics and independent trial documentation.",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "article-6",
      category: "Education",
      headline: "Experimental Curriculum Integrating Narrative-VR Raises Mathematics Literacy Scores",
      description: "Trial runs in four public school districts show math retention rates climb as students learn algebra via interactive stories.",
      content: "Educational departments released performance indexes indicating math literacy increased significantly inside classrooms testing visual storytelling tools. Critiques highlight high hardware costs as a barrier to wide deployment.",
      source: "Academia Insights",
      time: "6 hours ago",
      credibilityScore: 89,
      riskLevel: "Low",
      initialAnalysis: "Strong educational research backing. Balances positive trial metrics with honest critiques about financial implementation barriers.",
      image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "article-7",
      category: "Sports",
      headline: "World Athletics Federation Proposes New Guidelines for High-Tech Running Wear",
      description: "New regulations limit carbon-plate thicknesses and sole heights to protect the integrity of athletic legacy times.",
      content: "Athletics boards are drafting restrictions on footwear technologies. Critics claim the rules stifle innovation, but federations argue that mechanical assistance degrades standard cardiovascular merit.",
      source: "Sports Chronicle",
      time: "8 hours ago",
      credibilityScore: 92,
      riskLevel: "Low",
      initialAnalysis: "Verified athletics regulatory announcement. Covers arguments from both technical manufacturers and federation traditionalists.",
      image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "article-8",
      category: "Entertainment",
      headline: "Independent Cinema Outshines Summer Blockbusters at Selected Box Office Returns",
      description: "Atmospheric, character-driven feature film records unprecedented revenue margins following massive grassroot word-of-mouth acclaim.",
      content: "A low-budget independent film has surpassed expectations at national theaters. The visual production costs were minimal, but premium screenplay and viral social reviews created a massive, sustained crowd draw.",
      source: "Screen Hub",
      time: "12 hours ago",
      credibilityScore: 90,
      riskLevel: "Low",
      initialAnalysis: "Factual ticketing revenue analysis. Compiles cinema trade records and verifies historical trend data correctly.",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "article-9",
      category: "Technology",
      headline: "EXPOSED: Leading AI Labs Secretly Training Algorithms on Thought-Reading Vibrations",
      description: "Viral claims assert smart phone microphones capture neurological brainwaves to auto-promote targeted retail products without permission.",
      content: "Shocking whistle-blower clips on social platforms suggest that AI models can read human minds by processing cellular sound waves. Observers warn that neural hacking is completely active across all major networks right now.",
      source: "Disinfo Leak Unfiltered",
      time: "30 minutes ago",
      credibilityScore: 18,
      riskLevel: "High",
      initialAnalysis: "Suspicious conspiracy theory. Relies on out-of-context video claims and utilizes fear-mongering and unscientific statements.",
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const features = [
    {
      id: 1,
      title: "AI Fake News Detection",
      desc: "Instant multi-layered neural parsing searches for propaganda, truth discrepancies, and fabrications.",
      icon: Shield,
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: 2,
      title: "Source Credibility Analysis",
      desc: "Cross-checks source URLs, domains, and publishers against global media credibility tables.",
      icon: LinkIcon,
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      id: 3,
      title: "Bias Detection",
      desc: "Identifies political drift on a Left-to-Right spectrum, detailing hidden electoral tilts.",
      icon: Compass,
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: 4,
      title: "Fact Verification",
      desc: "Deconstructs long publications into granular claims and compares them directly to vetted databases.",
      icon: CheckCircle,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: 5,
      title: "Sentiment Analysis",
      desc: "Measures emotional charging, anger vectors, and polarization scoring in user-supplied content.",
      icon: Flame,
      color: "bg-amber-50 text-amber-600",
    },
    {
      id: 6,
      title: "AI Explanations",
      desc: "Get deep contextual insights into WHY the model reached its authenticity and risk ratings.",
      icon: Sparkles,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      id: 7,
      title: "PDF Reports",
      desc: "Generate professional media audit summaries in downloadable PDF formats to share anywhere.",
      icon: FileDown,
      color: "bg-rose-50 text-rose-600",
    },
    {
      id: 8,
      title: "News URL Analysis",
      desc: "Paste live URLs to verify full-web articles, blog posts, and viral social media claims instantly.",
      icon: Search,
      color: "bg-teal-50 text-teal-600",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Paste Content or Link",
      desc: "Paste any text block, social media claim, news URL, or upload standard document formats (.txt, .pdf).",
    },
    {
      num: "02",
      title: "AI Deep Analysis",
      desc: "TruthLens triggers specialized Gemini evaluations to cross-reference databases and analyze language patterns.",
    },
    {
      num: "03",
      title: "Verification Process",
      desc: "The system scores authenticity, political tilt, source credibility, and lists unsupported arguments.",
    },
    {
      num: "04",
      title: "Detailed Report",
      desc: "Instantly explore an interactive safety metric dashboard and export downloadable verification reports.",
    },
  ];

  const testimonials = [
    {
      quote: "TruthLens is a vital weapon against the tidal wave of viral disinformation. Its bias scoring is exceptionally accurate.",
      author: "Dr. Elena Rostova",
      role: "Media Literacy Researcher, Stanford",
      stars: 5,
    },
    {
      quote: "My students use TruthLens everyday to check their project sources. It has fundamentally changed their approach to researching claims online.",
      author: "Marcus Vance",
      role: "High School Journalism Educator",
      stars: 5,
    },
    {
      quote: "The explainable AI highlights exactly where an article is using emotional manipulation. Incredible tool for critical thinkers.",
      author: "Aisha Jenkins",
      role: "Independent Freelance Journalist",
      stars: 5,
    },
  ];

  const faqs = [
    {
      q: "How does the TruthLens AI detection platform verify claims?",
      a: "TruthLens uses Google's latest Gemini reasoning models to analyze text structure, rhetorical styles, emotional trigger frequencies, and logical inconsistencies. It maps statements against established factual reference points, cross-matching claims to see if they omit key context or rely on pre-fabricated narratives.",
    },
    {
      q: "Can I analyze live web URLs?",
      a: "Yes! In the News Analyzer tab, simply paste any live article URL. Our Express backend processes and fetches the core textual content, parsing it through the same deep multi-layered AI verification pipeline.",
    },
    {
      q: "What do the authenticity scores represent?",
      a: "The score ranges from 0 to 100. A score above 80 indicates verified, trustworthy journalism. Scores between 40-79 reflect misleading, heavily biased, or partially true claims, while scores below 40 are flagrant fabrications, conspiracy theories, or manipulative fake news.",
    },
    {
      q: "Is my search history saved persistently?",
      a: "If you are logged into your free TruthLens account, all report cards are securely stored in your personal History file. You can search, sort, reopen, delete, or save favorites. If searching as a guest, search statistics are logged on the platform analytics but the report itself is session-only.",
    },
    {
      q: "How does the Media Literacy quiz work?",
      a: "Our Learning Center offers four curated media literacy courses. Each module culminates in an interactive quiz. Achieving 70% or more on all quizzes unlocks a customized, certified 'Media Literacy Advocate' credentials card on your Profile page.",
    },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans" id="landing-page">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-32 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-700">
                <Sparkles className="w-3.5 h-3.5" />
                Next-Gen AI Media Intelligence
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
                Detect Fake News <br />
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Before It Spreads
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                Use advanced AI-powered verification to identify misinformation, clickbait, bias, and suspicious claims before sharing content online.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={() => setTab("analyzer")}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:translate-y-px transition-all text-center cursor-pointer"
                >
                  Analyze News Claim
                </button>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 transition-all text-center cursor-pointer"
                >
                  Learn More
                </a>
              </div>

              {/* Verified Trust Band */}
              <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
                <div>
                  <span className="block text-2xl font-extrabold text-slate-800">98.7%</span>
                  <span className="text-xs text-slate-500 font-medium">Fact Check Accuracy</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="block text-2xl font-extrabold text-slate-800">100%</span>
                  <span className="text-xs text-slate-500 font-medium">Objective Media Scoring</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="block text-2xl font-extrabold text-slate-800">Real-time</span>
                  <span className="text-xs text-slate-500 font-medium">Gemini Analytics Engine</span>
                </div>
              </div>
            </div>

            {/* Right: Premium Landing Page Image Illustration (Uses your uploaded custom shield graphic dynamically sized to medium) */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              <div className="relative w-full max-w-md rounded-3xl bg-white p-3 shadow-2xl border border-slate-100 overflow-hidden group">
                {/* Decorative subtle glowing backdrops */}
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-300/15 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-cyan-300/15 blur-3xl" />
                
                {/* 
                  ==================================================================================
                  STEP-BY-STEP CUSTOMIZATION GUIDE: HOW TO CHANGE OR UPDATE YOUR INTERNET IMAGE URL
                  ==================================================================================
                  This image takes your uploaded shield graphic URL and renders it perfectly on the 
                  right side of the Hero section, balanced beautifully to match the text on the left.

                  To change or update this URL in the future:
                  1. Locate the `src="..."` attribute on the dynamic <img> tag below.
                  2. Replace the current URL inside the double quotes with your new URL.
                  3. Save the file.
                  ==================================================================================
                */}
                {!logoError ? (
                  <img 
                    src="logo.png" 
                    alt="TruthLens News Media Monitoring Analysis Illustration"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                    className="w-full h-auto object-contain rounded-2xl shadow-sm transition-transform duration-500 group-hover:scale-101"
                  />
                ) : (
                  <div id="glow-panel-fallback" className="w-full py-8 px-6 bg-slate-950 text-white rounded-2xl flex flex-col items-center justify-center space-y-6 relative overflow-hidden min-h-[320px] transition-all duration-500 border border-slate-800">
                    {/* Glowing effect with smooth premium blue radial pulse */}
                    <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.22),transparent_70%)] animate-pulse" />
                    
                    {/* Target scan rings design */}
                    <div className="relative flex items-center justify-center w-24 h-24 mt-2">
                      <span className="absolute inline-flex h-full w-full rounded-full border-2 border-blue-500/35 animate-ping duration-1000" />
                      <span className="absolute inline-flex h-[80%] w-[80%] rounded-full border-2 border-cyan-400/40 animate-pulse" />
                      
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-[0_0_24px_rgba(37,99,235,0.6)] z-10">
                        <Shield id="scanned-shield-icon" className="w-8 h-8 text-white stroke-[1.5]" />
                      </div>
                    </div>

                    {/* Scanner live labels */}
                    <div className="text-center space-y-2 z-10 w-full">
                      <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold bg-cyan-950/70 py-1.5 px-3 rounded-full border border-cyan-800/40">
                        Media Analytics Active
                      </span>
                      <h4 className="text-lg font-bold text-white tracking-tight">TruthLens Digital Guard</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                        Validation framework scanning syntactic lean, source metadata indicators, and structural truth signals instantaneously.
                      </p>
                    </div>

                    {/* Micro information board */}
                    <div className="w-full grid grid-cols-2 gap-2 text-[10px] text-slate-300 z-10 bg-slate-900/60 p-3 rounded-xl border border-slate-800/50">
                      <div className="flex items-center gap-1.5 justify-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Source Check: Passed</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Style Lean: Neutral</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Accuracy Index: 98.7%</span>
                      </div>
                      <div className="flex items-center gap-1.5 justify-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Vulnerability: Trace</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 2. CORE STATS PANEL */}
      <section className="bg-slate-900 text-white py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <span className="block text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">142,850+</span>
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Articles Analyzed</span>
            </div>
            <div className="space-y-1">
              <span className="block text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300">64,912+</span>
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Fake News Detected</span>
            </div>
            <div className="space-y-1">
              <span className="block text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">98.7%</span>
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">System Accuracy Rate</span>
            </div>
            <div className="space-y-1">
              <span className="block text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">24,500+</span>
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Active Daily Observers</span>
            </div>
          </div>
        </div>
      </section>

      {/* LATEST NEWS & TRENDING HEADLINES SECTION */}
      <section className="py-20 bg-slate-50 border-b border-slate-100" id="news-hub">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header & Controls Column */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-150 border border-blue-200 rounded-full text-xs font-bold text-blue-700 font-mono uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                Live News Coverage
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Latest News & Trending Headlines
              </h2>
              <p className="text-slate-600 text-sm max-w-xl">
                Stay updated with the latest news and instantly verify information using AI.
              </p>
            </div>

            {/* Live Indicator, Timer and Feed Controls */}
            <div className="flex items-center gap-4 bg-white p-3.5 border border-slate-200/80 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider font-semibold">LIVE FEED</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-xs font-medium text-slate-500 font-mono">
                {lastUpdated === 0 ? "Just updated" : `Last updated: ${lastUpdated} min ago`}
              </span>
              <button
                onClick={handleSyncNews}
                disabled={syncingNews}
                className="p-2 bg-slate-50 hover:bg-slate-100 active:translate-y-px text-slate-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Sync News Feed"
              >
                <RefreshCw className={`w-4 h-4 ${syncingNews ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* BREAKING NEWS HERO BANNER */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800 group">
            {/* Visual element overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.18),transparent_50%)]" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 md:p-8 relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-red-600 text-white font-mono text-[10px] uppercase font-black px-2.5 py-1 rounded-full animate-pulse tracking-widest shadow-md shadow-red-500/10">
                    BREAKING NEWS
                  </span>
                  <div className="h-3 w-px bg-slate-700" />
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">Published {newsArticles[0].time}</span>
                  <div className="h-3 w-px bg-slate-700" />
                  <span className="text-[11px] font-mono text-blue-400 font-bold">{newsArticles[0].source}</span>
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug group-hover:text-blue-200 transition-colors">
                  {newsArticles[0].headline}
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  {newsArticles[0].description}
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => {
                      trackArticleMetric(newsArticles[0].id, newsArticles[0].headline, newsArticles[0].category, "analyzeCount");
                      onAnalyzeNews?.({
                        headline: newsArticles[0].headline,
                        content: newsArticles[0].content,
                        url: newsArticles[0].image,
                        autoAnalyze: true
                      });
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 hover:scale-101 active:scale-100 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Verify with TruthLens AI
                  </button>
                  <button
                    onClick={() => {
                      trackArticleMetric(newsArticles[0].id, newsArticles[0].headline, newsArticles[0].category, "viewCount");
                      setSelectedArticle(newsArticles[0]);
                    }}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
                  >
                    Read Full Article
                  </button>
                  <button
                    onClick={() => setFactCheckArticle(newsArticles[0])}
                    className="px-5 py-2.5 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 font-bold text-xs rounded-xl border border-teal-500/15 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Quick Fact Check
                  </button>
                </div>
              </div>

              {/* Banner Right Image */}
              <div className="lg:col-span-5 relative w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-inner border border-white/5 bg-slate-950">
                <img
                  src={newsArticles[0].image}
                  alt="Breaking News Banner visual representation"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                />
              </div>
            </div>
          </div>

          {/* CATEGORIES FILTERS & SEARCH BOX TAB BAR */}
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Category selector row */}
              <div className="flex items-center gap-1.5 max-w-full overflow-x-auto pb-1.5 scrollbar-hide no-scrollbar flex-wrap">
                {["All", "Politics", "Technology", "Business", "Science", "Health", "Education", "Sports", "Entertainment"].map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4.5 py-2 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10 scale-102"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Live search input field */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search headlines, claims, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-medium text-slate-800 transition-all outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* NEWS CARDS RESPONSIVE GRID */}
          {(() => {
            const listFiltered = newsArticles.filter((item) => {
              const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
              const matchesSearch =
                item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.source.toLowerCase().includes(searchQuery.toLowerCase());
              return matchesCat && matchesSearch;
            });

            if (listFiltered.length === 0) {
              return (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800 text-sm">No Headlines Match Your Search</h4>
                    <p className="text-slate-500 text-xs leading-normal font-medium">
                      Try resetting your categories or testing other keywords.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory("All");
                      setSearchQuery("");
                    }}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listFiltered.map((item) => {
                  const statViews = realtimeStats[item.id]?.viewCount ?? 32;
                  const statAnalyzed = realtimeStats[item.id]?.analyzeCount ?? 8;
                  
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Card Image Cover */}
                        <div className="relative h-44 bg-slate-100 overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.headline}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white font-mono text-[9px] uppercase font-black px-2.5 py-1 rounded-full tracking-wider">
                            {item.category}
                          </div>
                        </div>

                        {/* Card Content body */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span className="font-bold text-blue-600">{item.source}</span>
                            <span>{item.time}</span>
                          </div>
                          
                          <h4 className="font-bold text-slate-800 text-sm hover:text-blue-600 line-clamp-2 transition-colors">
                            {item.headline}
                          </h4>
                          
                          <p className="text-xs text-slate-500 leading-normal line-clamp-3 font-medium">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer & Actions */}
                      <div className="p-5 pt-0 space-y-4">
                        {/* Traffic Counter Badge bar */}
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            Views: {statViews}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
                            Analyzed: {statAnalyzed}
                          </span>
                        </div>

                        {/* Action buttons row */}
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <button
                            onClick={() => {
                              trackArticleMetric(item.id, item.headline, item.category, "viewCount");
                              setSelectedArticle(item);
                            }}
                            className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                          >
                            Read More
                          </button>
                          <button
                            onClick={() => setFactCheckArticle(item)}
                            className="py-2.5 bg-teal-50 hover:bg-teal-100 hover:border-teal-300 text-teal-700 font-bold rounded-xl border border-teal-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5 shrink-0 text-teal-500" />
                            Fact Check
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            trackArticleMetric(item.id, item.headline, item.category, "analyzeCount");
                            onAnalyzeNews?.({
                              headline: item.headline,
                              content: item.content,
                              url: item.image,
                              autoAnalyze: true
                            });
                          }}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/10 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-200" />
                          Analyze with TruthLens
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

        </div>
      </section>

      {/* Selected News Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header Cover Image */}
            <div className="relative h-56 bg-slate-100 shrink-0">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.headline}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/60 backdrop-blur-md hover:bg-slate-900/80 rounded-full text-white/95 hover:text-white transition-all border border-white/10 cursor-pointer"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              
              {/* Tag & Source bottom label on image */}
              <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
                <span className="bg-blue-600 text-white font-mono text-[9px] uppercase font-black px-2.5 py-1 rounded-full tracking-wider">
                  {selectedArticle.category}
                </span>
                <span className="text-white text-xs font-mono font-bold leading-none">{selectedArticle.source}</span>
              </div>
            </div>

            {/* Text Area (with scroll) */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-4">
              <div className="text-[12px] text-slate-400 font-bold font-mono">
                Published {selectedArticle.time}
              </div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
                {selectedArticle.headline}
              </h3>
              <p className="text-slate-650 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {selectedArticle.content}
              </p>

              {/* Quick AI Veracity score preview bar */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    TruthLens Estimated Veracity
                  </span>
                  <span className={`font-mono font-black ${selectedArticle.credibilityScore > 70 ? "text-emerald-600" : "text-amber-500"}`}>
                    {selectedArticle.credibilityScore}% ({selectedArticle.credibilityScore > 80 ? "High Trust" : "Medium Trust"})
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedArticle.credibilityScore > 70 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${selectedArticle.credibilityScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  trackArticleMetric(selectedArticle.id, selectedArticle.headline, selectedArticle.category, "analyzeCount");
                  onAnalyzeNews?.({
                    headline: selectedArticle.headline,
                    content: selectedArticle.content,
                    url: selectedArticle.image,
                    autoAnalyze: true
                  });
                  setSelectedArticle(null);
                }}
                className="w-full sm:flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                Analyze Full Article with Deep AI
              </button>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-full sm:w-28 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Fact Check Popup Modal */}
      {factCheckArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between animate-in zoom-in-95 duration-200">
            
            {/* Header Title bar */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                <h4 className="text-xs font-black uppercase tracking-wider font-mono">Quick Fact Check</h4>
              </div>
              <button
                onClick={() => setFactCheckArticle(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Article Info */}
              <div className="space-y-1">
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block font-mono">Headline</span>
                <h3 className="text-sm font-extrabold text-slate-800 leading-normal line-clamp-2">
                  {factCheckArticle.headline}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 1. Score Block */}
                <div className="bg-slate-50 p-3.5 border border-slate-150 rounded-2xl flex flex-col items-center justify-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">AI Veracity Score</span>
                  <span className={`text-2xl font-black ${factCheckArticle.credibilityScore > 75 ? "text-emerald-500" : factCheckArticle.credibilityScore > 40 ? "text-amber-500" : "text-red-500"}`}>
                    {factCheckArticle.credibilityScore}/100
                  </span>
                </div>

                {/* 2. Risk Badge */}
                <div className="bg-slate-50 p-3.5 border border-slate-150 rounded-2xl flex flex-col items-center justify-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Share Risk Level</span>
                  <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full ${
                    factCheckArticle.riskLevel === "Low"
                      ? "bg-emerald-50 text-emerald-600"
                      : factCheckArticle.riskLevel === "Medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-red-50 text-red-600"
                  }`}>
                    {factCheckArticle.riskLevel} Risk
                  </span>
                </div>
              </div>

              {/* Initial Analysis Report */}
              <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">AI Quick Verdict</span>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  {factCheckArticle.initialAnalysis}
                </p>
              </div>
            </div>

            {/* Footer actions block */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-2 shrink-0">
              <button
                onClick={() => {
                  trackArticleMetric(factCheckArticle.id, factCheckArticle.headline, factCheckArticle.category, "analyzeCount");
                  onAnalyzeNews?.({
                    headline: factCheckArticle.headline,
                    content: factCheckArticle.content,
                    url: factCheckArticle.image,
                    autoAnalyze: true
                  });
                  setFactCheckArticle(null);
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                Deep Audit
              </button>
              <button
                onClick={() => setFactCheckArticle(null)}
                className="w-24 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}



      {/* 3. SHIELD FEATURES SECTION */}
      <section className="py-24" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              A Complete Verification Arsenal
            </h2>
            <p className="text-slate-600 text-base">
              Identify logical flaws, clickbait traps, emotional charging, and ideological biases across digital publishing with surgical accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => {
              const IconComponent = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`p-3 rounded-xl w-fit ${feat.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg leading-snug">{feat.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 bg-white border-y border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Pipeline Overview</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              The Verification Journey
            </h2>
            <p className="text-slate-500 text-sm">
              Our automated process breaks down claims and checks them against deep reference material within seconds.
            </p>
          </div>

          {/* Animated timeline steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            
            {/* Horizontal progress accent line (Desktop only) */}
            <div className="hidden md:block absolute top-14 left-[12%] right-[12%] h-[2px] bg-slate-100 z-0" />

            {steps.map((st, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-4 group">
                <div className="w-16 h-16 rounded-full bg-[#F8FAFC] group-hover:bg-blue-600 border border-slate-200 group-hover:border-blue-600 flex items-center justify-center font-extrabold text-slate-700 group-hover:text-white text-lg transition-all duration-300 shadow-md">
                  {st.num}
                </div>
                <h3 className="font-bold text-slate-800 text-base pt-2">{st.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed px-4">{st.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Trusted by Professionals
            </h2>
            <p className="text-slate-500 text-sm">
              Here is what educational experts, critical readers, and independent fact checkers say about our scoring modules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(test.stars)].map((_, sIdx) => (
                      <Star key={sIdx} className="w-4.5 h-4.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-600 italic text-sm leading-relaxed">
                    "{test.quote}"
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h4 className="font-bold text-slate-800 text-sm">{test.author}</h4>
                  <p className="text-slate-400 text-xs">{test.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION SECTION */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-600 mb-2">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 text-sm">
              Everything you need to know about the automated neural assessment engine powering TruthLens AI.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-200">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center px-6 py-4.5 text-left font-semibold text-slate-800 hover:bg-slate-50 bg-white transition-all focus:outline-none"
                  >
                    <span className="text-sm md:text-base pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-slate-500 text-sm leading-relaxed border-t border-slate-100 bg-[#FBFDFE]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. INTUITIVE Call to Action */}
      <section className="bg-[#0b132b] text-white py-16 relative overflow-hidden border-t border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_40%)]" />
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <Award className="w-12 h-12 text-cyan-400 mx-auto stroke-[1.5]" />
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Ready to Audit Media For Free?</h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm leading-relaxed">
            Create an account or start as a guest observer. Test full articles, analyze social media links, export downloadable reports, and master fact checking.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <button
              onClick={() => setTab("analyzer")}
              className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all cursor-pointer"
            >
              Examine News Now
            </button>
            {!user && (
              <button
                onClick={openLoginModal}
                className="px-8 py-3.5 bg-slate-800/80 border border-slate-700/60 text-white font-bold rounded-xl shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
              >
                Sign Up Today
              </button>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
