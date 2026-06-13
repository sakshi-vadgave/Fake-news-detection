import { ShipWheel, HelpCircle, Shield, CheckCircle, Flame, Star, Award, ChevronDown, Rocket, Search, Link as LinkIcon, Compass, Sparkles, BookOpen, Clock, FileDown, Plus, Eye, BarChart2, AlertTriangle, Check, RefreshCw, Bot, Newspaper, GraduationCap, PenTool, Users, School } from "lucide-react";
import React from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs } from "firebase/firestore";
import VerifiedNewsFeed from "./VerifiedNewsFeed.tsx";

interface LandingPageProps {
  setTab: (tab: string) => void;
  openLoginModal: () => void;
  user: any;
  onAnalyzeNews?: (news: { headline: string; content: string; url: string; autoAnalyze?: boolean }) => void;
}

export default function LandingPage({ setTab, openLoginModal, user, onAnalyzeNews }: LandingPageProps) {
  // Temporary switch to enable/disable the Verified Indian News Feed section.
  // Set to true to re-enable, false to temporarily hide it without deleting any code.
  const SHOW_NEWS_FEED = true;

  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const [logoError, setLogoError] = React.useState(false);

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
      <section className="relative overflow-hidden pt-16 pb-20 md:py-28 bg-white border-b border-slate-100">
        {/* Decorative ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[250px] h-[250px] bg-cyan-300/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="space-y-8 flex flex-col items-center">
            
            {/* Centered Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-blue-700 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              Next-Gen AI Media Intelligence
            </div>
            
            {/* Centered Main Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl">
              Detect Fake News{" "}
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent block sm:inline mt-1 sm:mt-0">
                Before It Spreads
              </span>
            </h1>
            
            {/* Centered Description */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Use advanced AI-powered verification to identify misinformation, clickbait, bias, and suspicious claims before sharing content online.
            </p>
            
            {/* Centered Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => setTab("analyzer")}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:translate-y-px transition-all text-center cursor-pointer min-w-[200px]"
              >
                Analyze News Claim
              </button>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 transition-all text-center cursor-pointer min-w-[200px]"
              >
                Learn More
              </a>
            </div>

            {/* Centered Balanced Trust Band */}
            <div className="w-full max-w-2xl pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center mt-4">
              <div className="space-y-1">
                <span className="block text-lg font-extrabold text-slate-800">In-Depth</span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">Multi-Layered Verification</span>
              </div>
              <div className="hidden sm:block h-8 w-px bg-slate-200" />
              <div className="space-y-1">
                <span className="block text-lg font-extrabold text-slate-800">Objective</span>
                <span className="text-xs text-slate-400 font-medium tracking-wide font-sans">Media Bias Scoring</span>
              </div>
              <div className="hidden sm:block h-8 w-px bg-slate-200" />
              <div className="space-y-1">
                <span className="block text-lg font-extrabold text-slate-800">Real-time</span>
                <span className="text-xs text-slate-400 font-medium tracking-wide">Gemini Analytics Engine</span>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* 2. CORE FEATURES HIGHLIGHTS PANEL */}
      <section className="bg-slate-900 border-y border-slate-800 py-12 relative z-10 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: AI Analysis */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/30 transition-all flex items-start gap-4 text-left group">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl transition-colors group-hover:bg-blue-500/20">
                <Bot className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white tracking-tight"> AI Analysis</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Advanced content verification</p>
              </div>
            </div>

            {/* Card 2: Verified News */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 hover:border-cyan-500/30 transition-all flex items-start gap-4 text-left group">
              <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl transition-colors group-hover:bg-cyan-500/20">
                <Newspaper className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white tracking-tight"> Verified News</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Trusted Indian news sources</p>
              </div>
            </div>

            {/* Card 3: Trust Score */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/30 transition-all flex items-start gap-4 text-left group">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl transition-colors group-hover:bg-emerald-500/20">
                <BarChart2 className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white tracking-tight"> Trust Score</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Credibility-based evaluation</p>
              </div>
            </div>

            {/* Card 4: Fake News Detection */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 hover:border-purple-500/30 transition-all flex items-start gap-4 text-left group">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl transition-colors group-hover:bg-purple-500/20">
                <Shield className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white tracking-tight"> Fake News Detection</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Identify misinformation risks</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* VERIFIED INDIAN NEWS FEED */}
      {SHOW_NEWS_FEED && <VerifiedNewsFeed user={user} onAnalyzeNews={onAnalyzeNews} />}

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

      {/* 5. REAL-WORLD IMPACT */}
      <section className="py-24 bg-slate-50 relative overflow-hidden" id="real-world-impact">
        {/* Subtle decorative background gradient spots */}
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-72 h-72 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Real-World Impact
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Discover how TruthLens AI helps users identify misinformation, verify credibility, and make informed decisions in today's digital world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Card 1 */}
            <div className="backdrop-blur-md bg-white/70 border border-slate-200/55 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-blue-500/20 active:translate-y-0 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white shadow-inner">
                  <GraduationCap className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                    Students & Researchers
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Verify sources, improve research quality, and build confidence in academic work.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="backdrop-blur-md bg-white/70 border border-slate-200/55 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-cyan-500/20 active:translate-y-0 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center transition-all duration-300 group-hover:bg-cyan-600 group-hover:text-white shadow-inner">
                  <PenTool className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                    Journalists & Content Creators
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Analyze news credibility and identify potentially misleading claims before publishing.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="backdrop-blur-md bg-white/70 border border-slate-200/55 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-emerald-500/20 active:translate-y-0 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white shadow-inner">
                  <Users className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                    General Public
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Make informed decisions by detecting misinformation and understanding content reliability.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="backdrop-blur-md bg-white/70 border border-slate-200/55 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-purple-500/20 active:translate-y-0 transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center transition-all duration-300 group-hover:bg-purple-600 group-hover:text-white shadow-inner">
                  <School className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                    Educational Institutions
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Promote digital literacy, critical thinking, and responsible information consumption.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Mission Statement Bar */}
          <div className="mt-16 bg-white/80 border border-slate-200/40 p-8 sm:p-10 rounded-3xl shadow-sm max-w-4xl mx-auto text-center space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
            <span className="text-xs uppercase tracking-widest text-blue-600 font-extrabold">Our Mission</span>
            <p className="text-slate-800 text-base sm:text-lg font-bold max-w-2xl mx-auto leading-relaxed">
              "To empower people with AI-driven tools that help identify misinformation, verify credibility, and build trust in the information they consume every day."
            </p>
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
