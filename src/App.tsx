import React from "react";
import Navbar from "./components/Navbar.tsx";
import LandingPage from "./components/LandingPage.tsx";
import NewsAnalyzer from "./components/NewsAnalyzer.tsx";
import ResultDashboard from "./components/ResultDashboard.tsx";
import TrendingDashboard from "./components/TrendingDashboard.tsx";
import LearningCenter from "./components/LearningCenter.tsx";
import AnalysisHistory from "./components/AnalysisHistory.tsx";
import UserProfile from "./components/UserProfile.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import LoginModal from "./components/LoginModal.tsx";
import AIChatAssistant from "./components/AIChatAssistant.tsx";
import { MessageSquareCode, Sparkles, X, ShieldCheck, Mail, Globe, BrainCircuit } from "lucide-react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function App() {
  const [tab, setTab] = React.useState("landing");
  const [user, setUser] = React.useState<any>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [activeResult, setActiveResult] = React.useState<any>(null);
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [appReady, setAppReady] = React.useState(false);
  const [prefillNews, setPrefillNews] = React.useState<{ headline: string; content: string; url: string; autoAnalyze?: boolean } | null>(null);

  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Authenticate user session from Firebase Auth on mount
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let profileData = userDocSnap.data();
          if (!profileData) {
            profileData = {
              name: firebaseUser.displayName || "TruthLens Auditor",
              email: firebaseUser.email || "",
              createdAt: new Date().toISOString(),
              profilePhoto: firebaseUser.photoURL || ""
            };
            await setDoc(userDocRef, profileData);
          }
          
          setUser({
            id: firebaseUser.uid,
            ...profileData
          });
          setToken(firebaseUser.uid);
        } catch (e) {
          console.error("Firestore profile synchronization error:", e);
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "TruthLens Auditor",
            email: firebaseUser.email || "",
            createdAt: new Date().toISOString()
          });
          setToken(firebaseUser.uid);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setAppReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (loggedInUser: any, sessionToken: string) => {
    // Session token would be active Firebase User UID
    if (loggedInUser.email === "admin@truthlens.ai" || loggedInUser.email === "vadgavesakshi8@gmail.com") {
      setTab("admin");
    } else {
      setTab("analyzer");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
      setTab("landing");
    } catch (e) {
      console.error("Failed to sign out:", e);
    }
  };

  const handleAnalyzeSuccess = (result: any) => {
    setActiveResult(result);
  };

  // Render correct route component
  const renderTabContent = () => {
    switch (tab) {
      case "landing":
        return (
          <LandingPage
            setTab={setTab}
            openLoginModal={() => setLoginModalOpen(true)}
            user={user}
            onAnalyzeNews={(news) => {
              setPrefillNews(news);
              setTab("analyzer");
            }}
          />
        );
      case "analyzer":
        if (activeResult) {
          return (
            <ResultDashboard
              result={activeResult}
              token={token}
              onReset={() => setActiveResult(null)}
            />
          );
        }
        return (
          <NewsAnalyzer
            token={token}
            onAnalyzeSuccess={handleAnalyzeSuccess}
            setTab={setTab}
            initialHeadline={prefillNews?.headline}
            initialContent={prefillNews?.content}
            initialUrl={prefillNews?.url}
            autoAnalyze={prefillNews?.autoAnalyze}
            onClearPrefill={() => setPrefillNews(null)}
          />
        );
      case "trends":
        return <TrendingDashboard token={token || ""} />;
      case "learning":
        return (
          <LearningCenter
            token={token}
            user={user}
            openLoginModal={() => setLoginModalOpen(true)}
          />
        );
      case "history":
        return (
          <AnalysisHistory
            token={token || ""}
            onReopen={(report) => {
              setActiveResult(report);
              setTab("analyzer");
            }}
            setTab={setTab}
          />
        );
      case "profile":
        return <UserProfile user={user} setTab={setTab} token={token} />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <LandingPage setTab={setTab} openLoginModal={() => setLoginModalOpen(true)} user={user} />;
    }
  };

  if (!appReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] space-y-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">TruthLens Loading...</span>
      </div>
    );
  }

  // Check if admin is currently logged in to offer Admin route
  const isAdmin = user && (user.email === "admin@truthlens.ai" || user.email === "vadgavesakshi8@gmail.com");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between font-sans selection:bg-blue-100 relative">
      
      {/* 1. NAVIGATION BAR */}
      <nav id="app-nav">
        <Navbar
          currentTab={tab}
          setTab={(t) => {
            setTab(t);
            // Auto reset inside analyzer tab when switching back
            if (t !== "analyzer") setActiveResult(null);
          }}
          user={user}
          onLogout={handleLogout}
          openLoginModal={() => setLoginModalOpen(true)}
          theme={theme}
          setTheme={setTheme}
        />
        {/* Quick Admin bar shortcut */}
        {isAdmin && tab !== "admin" && (
          <div className="bg-indigo-600 text-white text-xs font-bold py-1.5 px-4 flex justify-between items-center print:hidden">
            <span>Logged in as Administrator. Monitor systems on the control panel.</span>
            <button
              onClick={() => setTab("admin")}
              className="px-2.5 py-0.5 bg-white/15 hover:bg-white/25 rounded font-mono text-[10px] uppercase transition-all"
            >
              Control Panel →
            </button>
          </div>
        )}
      </nav>

      {/* 2. MAIN ROUTER PANEL CONTENT */}
      <main className="flex-1 pb-16">
        {renderTabContent()}
      </main>

      {/* 3. PERSISTENT STARTUP FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-12 px-4 sm:px-6 lg:px-8 print:hidden" id="app-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">✓</div>
              <span className="font-sans text-lg font-black tracking-tight text-slate-800">TruthLens AI</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              An elite, award-winning multi-layered natural language verification and media literacy sandbox. Developed with high-fidelity telemetry models suitable for college competition boards.
            </p>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">Platform Ecosystem</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
              <button onClick={() => setTab("analyzer")} className="hover:text-blue-600 text-left cursor-pointer">Verification Core</button>
              <button onClick={() => setTab("trends")} className="hover:text-blue-600 text-left cursor-pointer">Live Trends</button>
              <button onClick={() => setTab("learning")} className="hover:text-blue-600 text-left cursor-pointer">Literacy syllabus</button>
              <button onClick={() => setTab("landing")} className="hover:text-blue-600 text-left cursor-pointer">Platform FAQ</button>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-mono">Telemetry Standard</h4>
            <div className="space-y-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                Region: Global-Ingress (SSL)
              </span>
              <span className="flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-slate-400" />
                Engine: Gemini 3.5 Core
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] font-medium text-slate-400 gap-4">
          <span>&copy; 2026 TruthLens AI Technology. All sovereign copyright directories protected.</span>
          <div className="flex gap-4">
            <span className="font-mono">BUILD: v2.4.9 // PORT: 3000</span>
          </div>
        </div>
      </footer>

      {/* 4. FLOATING FLOATING CORNER CHAT CONTROL BOT */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden flex flex-col items-end gap-3" id="floating-chat-trigger">
        
        {/* Dynamic chat window drawer */}
        {chatOpen && (
          <div className="w-[340px] sm:w-[400px] h-[520px] bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden flex flex-col justify-between animate-in slide-in-from-bottom duration-300">
            {/* Drawer header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500 text-slate-900 flex items-center justify-center font-bold">🤖</div>
                <div>
                  <h4 className="text-xs font-bold tracking-wide">Intelligent LensBot Drawer</h4>
                  <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider block -mt-0.5">Continuous Sandbox</span>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Embed chatbot component */}
            <div className="flex-1 overflow-hidden">
              <AIChatAssistant lastAnalysisResult={activeResult} token={token} />
            </div>
          </div>
        )}

        {/* Floating Bubble button */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-300 cursor-pointer animate-[bounce_5s_infinite] hover:rotate-12"
          >
            <MessageSquareCode className="w-7 h-7 animate-pulse" />
          </button>
        )}
      </div>

      {/* 5. GUEST/USER LOGIN OVERLAY LOCKS */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

    </div>
  );
}
