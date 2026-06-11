import { Printer, RotateCcw, AlertTriangle, ShieldCheck, HelpCircle, AlertOctagon, TrendingUp, Compass, HeartCrack, Lightbulb, Check, ChevronRight, Bookmark, Download } from "lucide-react";
import React from "react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface ResultProps {
  result: any;
  onReset: () => void;
  token: string | null;
}

export default function ResultDashboard({ result, onReset, token }: ResultProps) {
  const [favorite, setFavorite] = React.useState(result.isFavorite || false);
  const [loadingFav, setLoadingFav] = React.useState(false);
  const [downloadingPdf, setDownloadingPdf] = React.useState(false);

  const toggleFavorite = async () => {
    if (!token || result.id.startsWith("guest-")) return;
    setLoadingFav(true);
    try {
      const docRef = doc(db, "analysisHistory", result.id);
      await updateDoc(docRef, { isFavorite: !favorite });
      setFavorite(!favorite);
    } catch (e: any) {
      console.error("Result favorite toggle failed:", e);
      handleFirestoreError(e, OperationType.UPDATE, `analysisHistory/${result.id}`);
    } finally {
      setLoadingFav(false);
    }
  };

  const getAuthenticityColor = (score: number) => {
    if (score >= 80) return { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", fill: "stroke-emerald-500" };
    if (score >= 45) return { text: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", fill: "stroke-amber-500" };
    return { text: "text-rose-600", bg: "bg-red-50", border: "border-rose-200", fill: "stroke-rose-600" };
  };

  const scoreTheme = getAuthenticityColor(result.authenticityScore);

  const handleExportPDF = async () => {
    setDownloadingPdf(true);
    try {
      // 1. Install/load html2pdf.js from CDN dynamically if it's not present
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = () => resolve();
          script.onerror = (e) => reject(e);
          document.head.appendChild(script);
        });
      }

      const html2pdf = (window as any).html2pdf;

      // 2. Select the container and hide visual controls that shouldn't appear in the PDF report
      const containerElement = document.getElementById("result-dashboard");
      if (!containerElement) {
        throw new Error("Target layout container element not found");
      }

      // Hide all element components with print:hidden, buttons, and specific visual rails
      const hideElements = document.querySelectorAll(".print\\:hidden, button");
      const savedStyles = new Map<Element, string>();

      hideElements.forEach((el) => {
        savedStyles.set(el, (el as HTMLElement).style.display);
        (el as HTMLElement).style.display = "none";
      });

      // Show print-only header by temporarily swapping tailwind's hidden state
      const printHeader = document.querySelector(".print\\:block");
      let originalHeaderDisplay = "";
      let originalHeaderClassList = "";
      if (printHeader) {
        originalHeaderDisplay = (printHeader as HTMLElement).style.display;
        (printHeader as HTMLElement).style.display = "block";
        (printHeader as HTMLElement).classList.remove("hidden");
      }

      // 3. Configure the high-fidelity rendering layout settings
      const opt = {
        margin:       [0.5, 0.4, 0.5, 0.4], // [top, left, bottom, right] in inches
        filename:     `TruthLens_Audit_Report_${result.id || "export"}.pdf`,
        image:        { type: "jpeg", quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0,
          logging: false 
        },
        jsPDF:        { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak:    { mode: ["avoid-all", "css"] }
      };

      // 4. Trigger HTML element capture to standard PDF stream
      await html2pdf().set(opt).from(containerElement).save();

      // 5. Instantly restore application layouts to their clean React UI structures
      hideElements.forEach((el) => {
        const originalStyle = savedStyles.get(el);
        (el as HTMLElement).style.display = originalStyle || "";
      });

      if (printHeader) {
        (printHeader as HTMLElement).style.display = originalHeaderDisplay || "";
        (printHeader as HTMLElement).classList.add("hidden");
      }
    } catch (pdfErr) {
      console.error("Advanced client PDF extraction failed, returning to regular window print stream fallback:", pdfErr);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 print:bg-white print:p-0 print:shadow-none" id="result-dashboard">
      
      {/* Dynamic Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all flex items-center justify-center cursor-pointer"
            title="Go back"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Audit Report</h1>
            <span className="text-xs text-slate-400 font-mono">ID: {result.id} • Verified on {new Date(result.analyzedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {token && !result.id.startsWith("guest-") && (
            <button
              onClick={toggleFavorite}
              disabled={loadingFav}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                favorite
                  ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Bookmark className="w-4 h-4 fill-current" />
              {favorite ? "Favorited" : "Save Favorite"}
            </button>
          )}

          <button
            onClick={handleExportPDF}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {downloadingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">TruthLens AI Audit</h1>
            <p className="text-slate-500 text-sm">Official Media Verification Transcript • https://truthlens.ai</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">REPORT ID: {result.id}</span>
            <span className="text-xs text-slate-400 block font-mono">STAMP DATE: {new Date(result.analyzedAt).toUTCString()}</span>
          </div>
        </div>
      </div>

      {/* 2X2 CORE KPI DECK */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* LARGE SCORE CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 md:col-span-4 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Authenticity Score</span>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circular progress */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" className="stroke-slate-100 fill-none" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`fill-none ${scoreTheme.fill}`}
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * result.authenticityScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl md:text-4xl font-extrabold text-slate-900">{result.authenticityScore}%</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Verifiable</span>
            </div>
          </div>

          <div className="space-y-1.5 w-full">
            <span className={`inline-block px-3.5 py-1 text-xs font-extrabold uppercase rounded-full ${scoreTheme.bg} ${scoreTheme.text} ${scoreTheme.border}`}>
              {result.classification}
            </span>
            <p className="text-[11px] font-medium text-slate-400 leading-normal">
              Confidence index calculated at {result.confidenceScore}% by neural indicators
            </p>
          </div>
        </div>

        {/* METRICS & METERS PANEL */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 md:col-span-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Meter: AI Confidence */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-widest">Confidence Score</span>
                <span className="font-mono font-bold text-slate-700">{result.confidenceScore}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${result.confidenceScore}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">Evaluates baseline text density and corroborating statements.</p>
            </div>

            {/* Meter: Source Credibility */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-widest">Source Credibility</span>
                <span className="font-mono font-bold text-slate-700">{result.sourceCredibilityScore}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${result.sourceCredibilityScore}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">Score generated relative to global media domain reliability listings.</p>
            </div>

            {/* Meter: Manipulation charging */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-widest">Emotional Phrasing</span>
                <span className="font-mono font-bold text-slate-700">{result.emotionalManipulationScore}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${result.emotionalManipulationScore >= 60 ? "bg-red-500" : "bg-amber-400"}`} style={{ width: `${result.emotionalManipulationScore}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">Detects use of outrage triggers, fear, and capital sensational letters.</p>
            </div>

            {/* Meter: Risk & Sentiment stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Sharing Risk</span>
                <span className={`text-sm font-extrabold block mt-0.5 ${result.riskLevel === "High" ? "text-red-500" : result.riskLevel === "Medium" ? "text-amber-500" : "text-emerald-500"}`}>
                  {result.riskLevel}
                </span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Sentiment</span>
                <span className={`text-sm font-extrabold block mt-0.5 ${result.sentiment === "Negative" ? "text-red-500" : result.sentiment === "Positive" ? "text-emerald-400" : "text-slate-500"}`}>
                  {result.sentiment}
                </span>
              </div>
            </div>

          </div>

          {/* Political Bias Drift panel */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                Detected Political Bias
              </span>
              <p className="text-xs text-slate-500 leading-normal">{result.politicalBias?.explanation ?? "No bias analysis details available."}</p>
            </div>
            <div className="px-4.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold text-center shrink-0">
              {result.politicalBias?.bias ?? "Center"}
            </div>
          </div>

        </div>
      </div>

      {/* INPUT CONTENT SNIPPET */}
      <div className="bg-[#F8FAFC] border border-slate-200/60 rounded-3xl p-5 md:p-6 space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Audited News Transcript</span>
        {result.headline && <h3 className="font-bold text-slate-800 text-[15px]">"{result.headline}"</h3>}
        {result.url && (
          <a href={`https://${result.url}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:underline block break-all">
            Origin: {result.url}
          </a>
        )}
        <p className="text-slate-600 text-xs leading-relaxed italic border-l-3 border-slate-300 pl-3">
          "{result.content}"
        </p>
      </div>

      {/* AI CORE DISCLOSURE EXPLANATION */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5.5 h-5.5 text-blue-600" />
          Primary AI Verification Summary
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* EXPLAINABLE AI - Why Conclusion reached */}
      <div className="bg-[#FAFCFF] border border-blue-100 rounded-3xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5.5 h-5.5 text-blue-600" />
            Explainable AI Findings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Why did the neural system arrive at this particular conclusion?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full block w-fit">Flagged Elements</span>
            <ul className="space-y-1.5 text-xs text-slate-600 pl-1">
              {result.explanationDetails?.keywords && result.explanationDetails.keywords.length > 0 ? (
                result.explanationDetails.keywords.map((kw: string, i: number) => (
                  <li key={i} className="flex items-center gap-1.5 font-mono">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    "{kw}"
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">None detected.</li>
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold text-[#F59E0B] bg-[#FFFBEB] border border-[#FEF3C7] px-2.5 py-0.5 rounded-full block w-fit">Manipulation Tactics</span>
            <ul className="space-y-1.5 text-xs text-slate-600 pl-1">
              {result.explanationDetails?.manipulationTactics && result.explanationDetails.manipulationTactics.length > 0 ? (
                result.explanationDetails.manipulationTactics.map((mt: string, i: number) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                    {mt}
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">None detected.</li>
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full block w-fit">Unsupported Affirmations</span>
            <ul className="space-y-1.5 text-xs text-slate-600 pl-1">
              {result.explanationDetails?.unsupportedPhrases && result.explanationDetails.unsupportedPhrases.length > 0 ? (
                result.explanationDetails.unsupportedPhrases.map((up: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>"{up}"</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 italic">None detected.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* SUSPICIOUS CLAIMS ASSESSMENT */}
      {result.suspiciousClaims.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-5.5 h-5.5 text-amber-500" />
            Claim-by-Claim Verified Cross-Checks
          </h2>
          <div className="space-y-4">
            {result.suspiciousClaims.map((claim: any, idx: number) => (
              <div key={idx} className="border border-slate-100 bg-[#FAFBFD] p-4.5 rounded-2xl flex items-start gap-4 hover:border-slate-200 transition-all">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-extrabold text-slate-800 text-[13px]">Claim Assessment</span>
                    <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full tracking-wider ${
                      claim.rating === "Verified" ? "bg-emerald-50 text-emerald-700" : claim.rating === "Needs Verification" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    }`}>
                      {claim.rating}
                    </span>
                  </div>
                  <p className="font-bold text-slate-700 italic">"{claim.claim}"</p>
                  <p className="text-slate-500 leading-relaxed text-[11px]">{claim.analysis}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MISSING EVIDENCE & CLICKBAIT INDICATORS (MERGED BLOCK) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Missing Evidence Indicators list */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block pb-1 border-b border-slate-100">Omitted Content & evidence</span>
          <ul className="space-y-2.5 text-xs text-slate-600">
            {result.missingEvidence.length > 0 ? (
              result.missingEvidence.map((ev: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <HeartCrack className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{ev}</span>
                </li>
              ))
            ) : (
                <li className="flex items-center gap-2 text-slate-400 italic">
                  <Check className="w-4 h-4 text-emerald-500" />
                  No missing primary evidence indicators identified.
                </li>
            )}
          </ul>
        </div>

        {/* Clickbait Phrasing indicators list */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block pb-1 border-b border-slate-100 font-sans">Clickbait Traps</span>
          <ul className="space-y-2.5 text-xs text-slate-600 font-sans">
            {result.clickbaitIndicators.length > 0 ? (
              result.clickbaitIndicators.map((click: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{click}</span>
                </li>
              ))
            ) : (
                <li className="flex items-center gap-2 text-slate-400 italic">
                  <Check className="w-4 h-4 text-emerald-500" />
                  No egregious headlines or curiosity gaps detected.
                </li>
            )}
          </ul>
        </div>
      </div>

      {/* ACTIONABLE RECOMMENDATIONS CARD */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 md:p-8 shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Lightbulb className="w-6 h-6 text-cyan-300" />
          </div>
          <div className="space-y-3 shrink-1">
            <h3 className="font-bold text-base leading-snug">Rethink Before Shifting coordinates: Fact Checking Recommendations</h3>
            <ul className="space-y-2 text-blue-100 text-xs leading-relaxed">
              {result.recommendations.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[11.5px]">
                  <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* RESET/NEW VERIFICATION CTA */}
      <div className="text-center pt-4 print:hidden">
        <button
          onClick={onReset}
          className="px-8 py-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer hover:border-slate-300"
        >
          <RotateCcw className="w-4 h-4" />
          Initialize New News Audit
        </button>
      </div>

    </div>
  );
}
