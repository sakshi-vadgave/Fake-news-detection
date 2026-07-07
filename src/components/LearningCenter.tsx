import React from "react";
import { BookOpen, Award, CheckCircle2, ChevronRight, HelpCircle, GraduationCap, XCircle, RefreshCw, Sparkles, BookMarked, ArrowRight } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface LearningCenterProps {
  token: string | null;
  user: any;
  openLoginModal: () => void;
}

interface Question {
  q: string;
  options: string[];
  answer: number; // Index of correct option
}

interface Module {
  id: string;
  title: string;
  desc: string;
  time: string;
  readTime: string;
  sections: { title: string; paragraphs: string[] }[];
  quiz: Question[];
}

const MODULES: Module[] = [
  {
    id: "mod-1",
    title: "Understanding Misinformation, Disinformation, and Propaganda",
    desc: "Understand the core taxonomy differences between accidental mistakes (misinformation) and hostile campaign weapons (disinformation).",
    time: "Section 1 • Fundamental Concepts",
    readTime: "7 min study",
    sections: [
      {
        title: "The Intentionality Spectrum",
        paragraphs: [
          "Information ecosystems are messy. To navigate them, we must first categorize content by intent. Misinformation is false information shared without harmful intent (e.g., your friend sharing an outdated weather rumor).",
          "Disinformation is false information created and shared with deliberate intent to deceive, manipulate, or profit. This includes fabricated quotes, staged videos, or counterfeit digital documents.",
          "Propaganda is heavily loaded information, often with real elements, designed to manipulate emotional crowds to support a specific political agenda, government policy, or ideological side."
        ]
      },
      {
        title: "Taxonomy of Fake News",
        paragraphs: [
          "Fact checkers catalog fake news into distinct styles: 1) Counterfeit design (cloning real publishers), 2) Selective quoting out of context (Contextomy), 3) False correlation (where headlines don't match the actual article text), and 4) Purely fabricated rumors (completely fabricated stories designed to trigger viral sharing)."
        ]
      }
    ],
    quiz: [
      {
        q: "What is the defining difference between Misinformation and Disinformation?",
        options: [
          "Misinformation is always shared by governments.",
          "Disinformation is backed by physical evidence.",
          "Disinformation involves a deliberate, intentional attempt to deceive or cause harm.",
          "Misinformation is shared exclusively on personal blogs."
        ],
        answer: 2
      },
      {
        q: "An article has real facts, but uses a wildly exaggerated headline that doesn't match the article body. This is a form of:",
        options: [
          "Balanced reporting",
          "Clickbait / False Correlation",
          "Peer-reviewed research",
          "None of the above"
        ],
        answer: 1
      },
      {
        q: "What is 'Contextomy'?",
        options: [
          "The scientific study of dictionary definitions",
          "Selecting and cropping quote fragments out of their original context to distort meaning",
          "Creating high-density visual graphics for news sites",
          "Editing typo errors in local columns"
        ],
        answer: 1
      }
    ]
  },
  {
    id: "mod-2",
    title: "How Misinformation Spreads: The Mechanics of Virality",
    desc: "Examine how confirmation bias, algorithm feedback loops, and outraged reactions turn rumors into explosive trends.",
    time: "Section 2 • Psychology & Mechanics",
    readTime: "8 min study",
    sections: [
      {
        title: "The Outrage Economy",
        paragraphs: [
          "Social media feeds are tuned to capture attention. Outrage, fear, moral indignation, and surprise are the strongest psychological drivers for forwarding a link. Fabricated content is intentionally styled with inflammatory words to hack these emotional triggers.",
          "A study by MIT discovered that fake news on social media spreads six times faster than verified factual news, and penetrates significantly deeper into user networks."
        ]
      },
      {
        title: "Cognitive Shorthands and Confirmation Bias",
        paragraphs: [
          "Our brains rely on heuristics (cognitive shorthands) to navigate news. Confirmation Bias makes us immediately trust rumors that align with our pre-existing beliefs, while systematically rejecting or ignoring rigorous documentation that contradicts our views."
        ]
      }
    ],
    quiz: [
      {
        q: "According to behavioral research, which emotions are the strongest drivers for pushing a link virally?",
        options: [
          "Neutral observation and quiet content",
          "Scientific skepticism",
          "Anger, frustration, surprise, and moral outrage",
          "Boredom"
        ],
        answer: 2
      },
      {
        q: "If we immediately accept a rumor as fact because it makes a political candidate we dislike look bad, we are illustrating:",
        options: [
          "Critical source checking",
          "Confirmation Bias",
          "Unbiased reasoning",
          "Double-blind review"
        ],
        answer: 1
      }
    ]
  },
  {
    id: "mod-3",
    title: "Manual Fact-Checking: Pro Cross-Examination Techniques",
    desc: "Equip yourself with elite, professional investigative routines used by Snopes, PolitiFact, and Reuters.",
    time: "Section 3 • Investigative Core",
    readTime: "10 min study",
    sections: [
      {
        title: "Lateral Reading over Vertical Reading",
        paragraphs: [
          "Amateurs read 'vertically'—clinging to the article page, reading the about block, and scrutinizing formatting. Professionals read 'laterally'—immediately opening new search tabs to see what external authorities say about the claim, the domain, and the authors.",
          "Lateral reading prevents you from falling for deceptive formatting, high-sounding corporate listings, or fake credentials of the origin site."
        ]
      },
      {
        title: "The SIFT Framework",
        paragraphs: [
          "Developed by digital media literacy specialists, SIFT stands for: 1) Stop (check original emotional reactions), 2) Investigate the Source (who published this?), 3) Find Better Coverage (read laterally to check if reputable bodies confirm this), and 4) Trace Claims back to the Original Context (find the raw research, video, or data)."
        ]
      }
    ],
    quiz: [
      {
        q: "What does the SIFT framework stand for?",
        options: [
          "Search, Index, Filter, Translate",
          "Stop, Investigate the Source, Find Better Coverage, Trace back to Original Context",
          "Scan, Isolate, Finalize, Transcribe",
          "Share, Innovate, Factcheck, Think"
        ],
        answer: 1
      },
      {
        q: "What is 'Lateral Reading'?",
        options: [
          "Reading an article backwards row-by-row to spot spelling typos",
          "Reading books only on tablet screens",
          "Leaving the origin article tab and checking external verified resources to test claim validity",
          "Reading only left-leaning news articles"
        ],
        answer: 2
      }
    ]
  },
  {
    id: "mod-4",
    title: "AI & Algorithmic Media Verification",
    desc: "Learn how modern AI classifiers evaluate linguistic constructs, trace citation networks, and track bot accounts.",
    time: "Section 4 • AI Verification Methods",
    readTime: "9 min study",
    sections: [
      {
        title: "How Automated Natural Language Systems Work",
        paragraphs: [
          "Modern AI model core nodes (like our TruthLens engine connected to Gemini) look for structural semantic patterns. Authentic journalism usually employs low emotional variance, highly structured timelines, neutral verbs ('stated', 'reported'), and direct document citations.",
          "Deceptive clickbait, in contrast, shows massive clusters of superlative adjectives ('miracle', 'shocking'), unsupported logical leaps, and context gaps designed to exploit psychological triggers."
        ]
      },
      {
        title: "Algorithmic Bot-Net Triaging",
        paragraphs: [
          "Large scale disinformation relies heavily on bots. Fact checking agencies use algorithm clusters to crawl temporal data: if 500 accounts post the exact same phrase within 30 seconds of an incident, artificial coordinated activity is immediately flagged."
        ]
      }
    ],
    quiz: [
      {
        q: "What linguistic cues of deception does an AI verification platform analyze?",
        options: [
          "The font face used in the layout",
          "Massive density of emotional superlatives, conspiracy loops, and unverified data assertions",
          "The speed of the host web server hosting the post",
          "The native language of the author"
        ],
        answer: 1
      },
      {
        q: "Which verb is typically found in professional, balanced reporting?",
        options: [
          "Admitted (implies hidden guilt)",
          "Screeched (highly dramatized)",
          "Stated / Explained (implies objective conveying)",
          "Shocked"
        ],
        answer: 2
      }
    ]
  }
];

export default function LearningCenter({ token, user, openLoginModal }: LearningCenterProps) {
  const [activeMod, setActiveMod] = React.useState<Module | null>(null);
  const [quizMode, setQuizMode] = React.useState(false);
  const [currentQIndex, setCurrentQIndex] = React.useState(0);
  const [selectedOpt, setSelectedOpt] = React.useState<number | null>(null);
  const [score, setScore] = React.useState(0);
  const [quizFinished, setQuizFinished] = React.useState(false);
  
  const [dbProgress, setDbProgress] = React.useState<any>({
    completedModules: [],
    quizScores: {},
    certified: false
  });
  const [syncing, setSyncing] = React.useState(false);

  const fetchProgress = async () => {
    if (!token) return;
    if (token.startsWith("demo-")) {
      const localProg = localStorage.getItem("truthlens_quiz_progress");
      if (localProg) {
        try {
          setDbProgress(JSON.parse(localProg));
        } catch {
          setDbProgress({
            completedModules: [],
            quizScores: {},
            certified: false
          });
        }
      } else {
        setDbProgress({
          completedModules: [],
          quizScores: {},
          certified: false
        });
      }
      return;
    }
    try {
      const docRef = doc(db, "quizProgress", token);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDbProgress(docSnap.data());
      } else {
        setDbProgress({
          completedModules: [],
          quizScores: {},
          certified: false
        });
      }
    } catch (e) {
      console.error("Progress fetch error:", e);
    }
  };

  React.useEffect(() => {
    fetchProgress();
  }, [token]);

  const startModule = (mod: Module) => {
    setActiveMod(mod);
    setQuizMode(false);
    setCurrentQIndex(0);
    setSelectedOpt(null);
    setScore(0);
    setQuizFinished(false);
  };

  const handleNextQuestion = () => {
    if (activeMod === null || selectedOpt === null) return;

    const isCorrect = selectedOpt === activeMod.quiz[currentQIndex].answer;
    if (isCorrect) setScore((prev) => prev + 1);

    if (currentQIndex + 1 < activeMod.quiz.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOpt(null);
    } else {
      setQuizFinished(true);
      saveScoreToServer(isCorrect ? score + 1 : score);
    }
  };

  const saveScoreToServer = async (finalScore: number) => {
    if (!token || !activeMod) return;
    setSyncing(true);
    try {
      let currentProgress = {
        completedModules: [] as string[],
        quizScores: {} as { [key: string]: number },
        certified: false
      };

      if (token.startsWith("demo-")) {
        const localProg = localStorage.getItem("truthlens_quiz_progress");
        if (localProg) {
          try {
            Object.assign(currentProgress, JSON.parse(localProg));
          } catch {}
        }
        
        currentProgress.quizScores[activeMod.id] = finalScore;
        const passRatio = finalScore / activeMod.quiz.length;
        const isPassed = passRatio >= 0.7;

        if (isPassed && !currentProgress.completedModules.includes(activeMod.id)) {
          currentProgress.completedModules.push(activeMod.id);
        }
        
        const allModules = ["mod-1", "mod-2", "mod-3", "mod-4"];
        const allPassed = allModules.every(modId => currentProgress.completedModules.includes(modId));
        if (allPassed) {
          currentProgress.certified = true;
        }

        localStorage.setItem("truthlens_quiz_progress", JSON.stringify(currentProgress));
        setDbProgress(currentProgress);
        return;
      }

      const docRef = doc(db, "quizProgress", token);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentProgress = {
          completedModules: data.completedModules || [],
          quizScores: data.quizScores || {},
          certified: data.certified || false
        };
      }
      
      currentProgress.quizScores[activeMod.id] = finalScore;
      
      const passRatio = finalScore / activeMod.quiz.length;
      const isPassed = passRatio >= 0.7;

      if (isPassed && !currentProgress.completedModules.includes(activeMod.id)) {
        currentProgress.completedModules.push(activeMod.id);
      }
      
      const allModules = ["mod-1", "mod-2", "mod-3", "mod-4"];
      const allPassed = allModules.every(modId => currentProgress.completedModules.includes(modId));
      if (allPassed) {
        currentProgress.certified = true;
      }
      
      await setDoc(docRef, {
        userId: token,
        ...currentProgress
      });
      
      setDbProgress(currentProgress);
    } catch (e) {
      console.error("Failed to commit score to Firestore:", e);
    } finally {
      setSyncing(false);
    }
  };

  const passesQuiz = (score: number, total: number) => {
    return score >= total * 0.7;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" id="learning-center">
      
      {/* LANDING STATS */}
      {!activeMod ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <GraduationCap className="w-9 h-9 text-blue-600" />
              Claim-Busters Media Literacy Course
            </h1>
            <p className="text-slate-500 text-sm max-w-2xl mx-auto">
              Master the research techniques used by international fact checking centers. Complete four essential modules and unlock your certified media observer card.
            </p>
          </div>

          {/* Digital Certificate Unlock notification if certified */}
          {dbProgress.certified ? (
            <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl border border-emerald-400 text-white shadow-lg shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Award className="w-8 h-8 text-cyan-200" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg leading-tight">Digital Media Literacy Advocate Credentials Unlocked!</h3>
                  <p className="text-emerald-100 text-xs">Congratulations! Your deep analysis scores verify high competency. Card added to user profile.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-blue-800 font-semibold">
                Pass all 4 quizzes with at least 70% accuracy to earn your digital certification credentials. Current progress: {dbProgress.completedModules?.length || 0}/4 modules.
              </p>
            </div>
          )}

          {/* Syllabus Catalog */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Syllabus Curriculum Course Modules:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MODULES.map((mod) => {
                const isCompleted = dbProgress.completedModules?.includes(mod.id);
                const highestScore = dbProgress.quizScores?.[mod.id];

                return (
                  <div
                    key={mod.id}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>{mod.time}</span>
                        <span>{mod.readTime}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-bold text-slate-800 text-[15px] leading-tight hover:text-blue-600 transition-colors">
                          {mod.title}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                          {mod.desc}
                        </p>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-slate-200 mt-5 flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Passed
                          </span>
                        ) : highestScore !== undefined ? (
                          <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide">
                            Not Passed
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Unstarted</span>
                        )}
                        {highestScore !== undefined && (
                          <span className="text-slate-500 font-mono">Score: {highestScore}/{mod.quiz.length}</span>
                        )}
                      </div>

                      <button
                        onClick={() => startModule(mod)}
                        className="px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-bold rounded-lg border border-slate-200 hover:border-blue-200 transition-all cursor-pointer flex items-center gap-1"
                      >
                        Enter Module
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE MODULE STAGE */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200">
          
          {/* Module Nav Actions */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <button
              onClick={() => setActiveMod(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              ← Back to syllabus
            </button>
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider bg-slate-50 px-3 py-1 rounded-full uppercase">
              {activeMod.time}
            </span>
          </div>

          {!quizMode ? (
            /* STUDY MODE */
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">{activeMod.title}</h1>
                <p className="text-slate-500 text-xs italic">Estimated study duration: {activeMod.readTime}</p>
              </div>

              {/* Study sections */}
              <div className="space-y-6 pt-2">
                {activeMod.sections.map((sec, sIdx) => (
                  <div key={sIdx} className="space-y-2.5">
                    <h2 className="text-[15px] font-bold text-slate-800 tracking-tight flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <span className="w-2.5 h-2.5 rounded-lg bg-blue-500" />
                      {sec.title}
                    </h2>
                    <div className="space-y-3">
                      {sec.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="text-slate-600 text-xs leading-relaxed md:text-sm">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Enter Quiz Actions */}
              <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 text-center sm:text-left">
                  <GraduationCap className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Finished reviewing? Enter the evaluation check to earn module credentials.</span>
                </div>
                
                <button
                  onClick={() => setQuizMode(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1 w-full sm:w-auto justify-center"
                >
                  Start Module Quiz Check
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE QUIZ MODE */
            <div className="space-y-6">
              
              {!quizFinished ? (
                /* LIVE QUESTIONS PLAYING */
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-widest">Question {currentQIndex + 1} of {activeMod.quiz.length}</span>
                    <span className="font-mono text-slate-500">Progress: {Math.round(((currentQIndex) / activeMod.quiz.length) * 100)}%</span>
                  </div>

                  <div className="h-1.5 bg-slate-100 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${((currentQIndex) / activeMod.quiz.length) * 100}%` }} />
                  </div>

                  {/* Question headline */}
                  <h3 className="font-extrabold text-slate-800 text-base md:text-lg">
                    {activeMod.quiz[currentQIndex].q}
                  </h3>

                  {/* Options Stack */}
                  <div className="space-y-3 pt-2">
                    {activeMod.quiz[currentQIndex].options.map((option, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => setSelectedOpt(optIdx)}
                          className={`w-full text-left p-4 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/50 text-blue-700"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <span>{option}</span>
                          <span className={`w-4 h-4 rounded-full border shrink-0 ml-4 flex items-center justify-center ${isSelected ? "border-blue-600 bg-blue-600 text-white font-mono text-[9px]" : "border-slate-300"}`}>
                            {isSelected && "✓"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Option controls */}
                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">No penalties for incorrect tries</span>
                    <button
                      onClick={handleNextQuestion}
                      disabled={selectedOpt === null}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {currentQIndex + 1 === activeMod.quiz.length ? "Finish Quiz" : "Submit & Continue"}
                    </button>
                  </div>
                </div>
              ) : (
                /* QUIZ FINISHED STAGE */
                <div className="text-center py-6 space-y-6">
                  
                  {/* Graphical result score headers */}
                  {passesQuiz(score, activeMod.quiz.length) ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                        <CheckCircle2 className="w-9 h-9" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Quiz Evaluation Passed!</h2>
                        <p className="text-slate-500 text-xs">Fantastic! Your media analysis accuracy score is {score}/{activeMod.quiz.length}.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto shadow-md">
                        <XCircle className="w-9 h-9" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Score Checked: {score}/{activeMod.quiz.length} Correct</h2>
                        <p className="text-slate-500 text-xs">A passing score of 70% or more is needed to earn credentials.</p>
                      </div>
                    </div>
                  )}

                  {!token && (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl max-w-md mx-auto text-xs text-center font-semibold">
                      Please log in or sign up to store progress on your official transcript persistently!
                    </div>
                  )}

                  <div className="pt-4 flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setQuizFinished(false);
                        setCurrentQIndex(0);
                        setSelectedOpt(null);
                        setScore(0);
                      }}
                      className="px-5 py-2.5 bg-slate-50 border text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                    >
                      Retake Quiz
                    </button>

                    <button
                      onClick={() => setActiveMod(null)}
                      className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
                    >
                      Return to Curriculum
                    </button>
                    
                    {!token && (
                      <button
                        onClick={openLoginModal}
                        className="px-5 py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 cursor-pointer"
                      >
                        Create Profile Log
                      </button>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
