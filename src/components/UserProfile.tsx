import React from "react";
import { User, Mail, Calendar, Eye, ShieldAlert, BadgeCheck, FileText, HelpCircle, GraduationCap } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface UserProfileProps {
  user: any;
  setTab: (tab: string) => void;
  token: string | null;
}

export default function UserProfile({ user, setTab, token }: UserProfileProps) {
  const [profileProgress, setProfileProgress] = React.useState<any>({
    completedModules: [],
    certified: false
  });

  React.useEffect(() => {
    const fetchProgress = async () => {
      if (!token) return;
      if (token.startsWith("demo-")) {
        const localProg = localStorage.getItem("truthlens_quiz_progress");
        if (localProg) {
          try {
            setProfileProgress(JSON.parse(localProg));
          } catch {
            setProfileProgress({
              completedModules: [],
              certified: false
            });
          }
        } else {
          setProfileProgress({
            completedModules: [],
            certified: false
          });
        }
        return;
      }
      try {
        const docRef = doc(db, "quizProgress", token);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileProgress(docSnap.data());
        } else {
          setProfileProgress({
            completedModules: [],
            certified: false
          });
        }
      } catch (e) {
        console.error("Failed to fetch custom user progress:", e);
      }
    };
    fetchProgress();
  }, [token]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" id="user-profile">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Media Observer Profile</h1>
        <p className="text-slate-500 text-sm">Monitor your current media observer level, tracking logs, and active credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* STATS DECK */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold mb-3 shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-extrabold text-slate-800 text-base leading-snug">{user.name}</h2>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Observer Core Rank</span>
            </div>

            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Total News Audits: <strong className="text-slate-800">{user.totalAnalyses || 0}</strong></span>
              </div>
            </div>
          </div>

          <div className="p-4.5 bg-[#FAFBFD] border rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest">Observer Status</span>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Rank climbs based on your cumulative quiz passes and evaluated articles. High activity unlocks custom credentials styles.
            </p>
          </div>
        </div>

        {/* COMPRESSION CARD */}
        <div className="md:col-span-8 space-y-6">
          
          {/* DIGITAL ADVOCATE CERTIFICATE */}
          {profileProgress.certified ? (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white rounded-3xl p-6.5 shadow-xl relative overflow-hidden flex flex-col justify-between aspect-[1.6] md:aspect-auto md:h-76 select-none group">
              {/* Glowing aesthetic grids */}
              <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-indigo-500/10 blur-3xl" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">TruthLens Accreditation License</span>
                  <h3 className="text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">Digital Media Literacy Advocate</h3>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-400">
                  <BadgeCheck className="w-7 h-7 stroke-[2]" />
                </div>
              </div>

              <div className="pt-6 relative z-10 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Credential Bearer</span>
                  <span className="font-extrabold text-base tracking-wide text-white block">{user.name}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 block">Sponsor Authority</span>
                    <span className="text-xs font-bold text-slate-300 block">TruthLens AI Board</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase text-slate-500 block">License status</span>
                    <span className="text-xs font-bold text-emerald-400 block flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active / Verified
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-4 right-4 text-[9px] font-semibold tracking-wider font-mono text-cyan-500/60 uppercase">
                ID NO. TL-MED-LIT-2026
              </div>
            </div>
          ) : (
            <div className="bg-white border rounded-3xl p-6.5 shadow-sm space-y-6 text-center py-10 md:py-16">
              <div className="w-14 h-14 rounded-full bg-[#FAFBFD] border flex items-center justify-center mx-auto text-slate-400">
                <GraduationCap className="w-7 h-7" />
              </div>
              
              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="font-black text-slate-800 text-[17px]">Accreditation Badge Locked</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Pass all four modules of our Claim-Busters media literacy curriculum (scoring 70%+ on all quizzes) to unlock your custom advocate observer license.
                </p>
              </div>

              <button
                onClick={() => setTab("learning")}
                className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer inline-block"
              >
                Go to Learning Center
              </button>
            </div>
          )}

          {/* COURSE COMPLETION STATS */}
          <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-3.5">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block pb-1 border-b border-slate-100">Module Completion Matrix</span>
            
            <div className="space-y-3 pt-1 text-xs">
              <div className="flex justify-between items-center bg-[#FBFDFE] border border-slate-100 p-3 rounded-xl">
                <span className="font-bold text-slate-700">Course Syllabus Progress:</span>
                <span className="font-mono text-slate-500 font-bold">{profileProgress.completedModules?.length || 0}/4 Passed</span>
              </div>
              
              <div className="flex justify-between items-center bg-[#FBFDFE] border border-slate-100 p-3 rounded-xl">
                <span className="font-bold text-slate-700">Accumulated Quizzes Submitted:</span>
                <span className="font-mono text-slate-500 font-bold">{Object.keys(profileProgress.quizScores || {}).length} modules</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
