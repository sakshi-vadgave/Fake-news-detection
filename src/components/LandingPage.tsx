import { ShipWheel, HelpCircle, Shield, CheckCircle, Flame, Star, Award, ChevronDown, Rocket, Search, Link as LinkIcon, Compass, Sparkles, BookOpen, Clock, FileDown, Plus } from "lucide-react";
import React from "react";

interface LandingPageProps {
  setTab: (tab: string) => void;
  openLoginModal: () => void;
  user: any;
}

export default function LandingPage({ setTab, openLoginModal, user }: LandingPageProps) {
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);

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
            <div className="lg:col-span-7 space-y-6">
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

            {/* Right: Premium CSS Illustration (Scanning Mockup) */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-[420px] aspect-square rounded-3xl bg-slate-100 border border-slate-200 p-6 shadow-2xl overflow-hidden group">
                {/* Decorative glowing backdrops */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-300/20 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-cyan-300/20 blur-3xl" />
                
                {/* Simulated Article card */}
                <div className="relative bg-white rounded-2xl border border-slate-200/50 p-5 shadow-sm h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Unverified Claim</span>
                      <span className="text-[10px] font-semibold text-slate-400">🚨 Critical Factor</span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base leading-snug">
                      "New global health alert: Organic juices cure viral infections in 2 hours according to scientists..."
                    </h3>

                    <div className="space-y-2">
                      <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                      <div className="h-2.5 bg-slate-100 rounded-full w-[90%]" />
                      <div className="h-2.5 bg-slate-100 rounded-full w-[40%]" />
                    </div>
                  </div>

                  {/* Laser line simulator */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 opacity-90 animate-[bounce_4s_infinite] shadow-[0_0_12px_#3b82f6]" />

                  {/* Verification Overlay card */}
                  <div className="bg-slate-900 text-white rounded-xl p-4 shadow-xl border border-slate-800 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        Scanning Analysis
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Suspicious</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Authenticity</span>
                        <span className="text-sm font-extrabold text-red-500">22% Match</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Manipulation</span>
                        <span className="text-sm font-extrabold text-amber-500">Extreme</span>
                      </div>
                    </div>
                  </div>
                </div>
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
      <section className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_40%)]" />
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <Award className="w-12 h-12 text-cyan-300 mx-auto stroke-[1.5]" />
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ready to Audit Media For Free?</h2>
          <p className="text-blue-100 max-w-xl mx-auto text-sm leading-relaxed">
            Create an account or start as a guest observer. Test full articles, analyze social media links, export downloadable reports, and master fact checking.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <button
              onClick={() => setTab("analyzer")}
              className="px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:shadow-cyan-500/10 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Examine News Now
            </button>
            {!user && (
              <button
                onClick={openLoginModal}
                className="px-8 py-3.5 bg-blue-600 border border-blue-500/50 text-white font-bold rounded-xl shadow-md hover:bg-blue-500 transition-all cursor-pointer"
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
