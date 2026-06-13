import { Printer, RotateCcw, AlertTriangle, ShieldCheck, HelpCircle, AlertOctagon, TrendingUp, Compass, HeartCrack, Lightbulb, Check, ChevronRight, Bookmark, Download } from "lucide-react";
import React from "react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface ResultProps {
  result: any;
  onReset: () => void;
  token: string | null;
}

const oklchCache = new Map<string, string>();

function convertOklchInString(val: string): string {
  if (!val || typeof val !== "string") return val;
  if (!val.includes("oklch")) return val;

  return val.replace(/oklch\([^)]+\)/g, (match) => {
    if (oklchCache.has(match)) {
      return oklchCache.get(match)!;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return match;
      
      ctx.fillStyle = "rgba(0,0,0,0.001)";
      ctx.fillRect(0, 0, 1, 1);
      
      ctx.fillStyle = match;
      ctx.fillRect(0, 0, 1, 1);
      
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      let result = match;
      if (r === 0 && g === 0 && b === 0 && (a === 0 || a === 1)) {
        result = "rgb(71, 85, 105)";
      } else if (a === 255) {
        result = `rgb(${r}, ${g}, ${b})`;
      } else {
        result = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
      }
      oklchCache.set(match, result);
      return result;
    } catch (e) {
      return match;
    }
  });
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
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: "letter"
      });

      let y = 0.5;
      const margin = 0.55;
      const pageWidth = 8.5;
      const pageHeight = 11;
      const contentWidth = pageWidth - (margin * 2);

      const drawHeaderFooter = () => {
        const pageNum = pdf.getNumberOfPages();
        
        // Footer line
        pdf.setDrawColor(203, 213, 225); // slate-200
        pdf.setLineWidth(0.01);
        pdf.line(margin, pageHeight - 0.4, pageWidth - margin, pageHeight - 0.4);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text("https://truthlens.ai • TruthLens AI Fact Checking Registry", margin, pageHeight - 0.25);
        pdf.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 0.25, { align: "right" });

        // Header line ONLY on Page 2 and subsequent pages
        if (pageNum > 1) {
          pdf.line(margin, 0.4, pageWidth - margin, 0.4);
          pdf.text("TRUTHLENS AI VERIFICATION AUDIT", margin, 0.33);
          pdf.text(`REPORT ID: ${result.id}`, pageWidth - margin, 0.33, { align: "right" });
        }
      };

      const checkPageSpace = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin - 0.2) {
          pdf.addPage();
          drawHeaderFooter();
          y = 0.8;
        }
      };

      // PAGE 1 LAYOUT
      drawHeaderFooter();

      // Premium Header Banner
      pdf.setFillColor(15, 23, 42); // slate-900 (Deep Slate)
      pdf.rect(margin, 0.5, contentWidth, 0.9, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("TRUTHLENS AI • MEDIA VERIFICATION CERTIFICATE", margin + 0.2, 0.85);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text("Official AI-Assisted Fact-Checking Registry & Analysis Transcript", margin + 0.2, 1.12);

      y = 1.6;

      // Metadata Block
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.rect(margin, y, contentWidth, 0.7, "F");
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.setLineWidth(0.008);
      pdf.rect(margin, y, contentWidth, 0.7, "D");

      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("REPORT INDEX ID", margin + 0.15, y + 0.25);
      pdf.text("AUDIT TIMESTAMP", margin + 2.5, y + 0.25);
      pdf.text("ORIGIN SOURCE", margin + 4.8, y + 0.25);

      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(String(result.id), margin + 0.15, y + 0.48);
      
      const formattedDate = result.analyzedAt ? new Date(result.analyzedAt).toLocaleString() : new Date().toLocaleString();
      pdf.text(formattedDate, margin + 2.5, y + 0.48);
      
      const sourceUrl = result.url || "N/A (Direct text audit)";
      pdf.text(sourceUrl.length > 35 ? sourceUrl.substring(0, 35) + "..." : sourceUrl, margin + 4.8, y + 0.48);

      y += 0.85;

      // KPI Scorecards
      const scoreHeight = 1.25;
      checkPageSpace(scoreHeight);
      
      const colWidth = (contentWidth - 0.2) / 2;
      
      // Left: Authenticity Score Card
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, colWidth, scoreHeight, "F");
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, y, colWidth, scoreHeight, "D");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text("AUTHENTICITY VERDICT", margin + 0.15, y + 0.25);

      pdf.setFontSize(30);
      if (result.authenticityScore >= 80) {
        pdf.setTextColor(16, 185, 129); // emerald-500
      } else if (result.authenticityScore >= 45) {
        pdf.setTextColor(245, 158, 11); // amber-500
      } else {
        pdf.setTextColor(239, 68, 68); // red-500
      }
      pdf.text(`${result.authenticityScore}%`, margin + 0.15, y + 0.72);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(String(result.classification).toUpperCase(), margin + 0.15, y + 1.02);

      // Right: Other indicators
      pdf.setFillColor(255, 255, 255);
      pdf.rect(margin + colWidth + 0.2, y, colWidth, scoreHeight, "F");
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin + colWidth + 0.2, y, colWidth, scoreHeight, "D");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);

      // Bar 1: Confidence
      pdf.text(`CONFIDENCE INDEX: ${result.confidenceScore}%`, margin + colWidth + 0.35, y + 0.25);
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin + colWidth + 0.35, y + 0.3, colWidth - 0.5, 0.08, "F");
      pdf.setFillColor(37, 99, 235); // blue-600
      pdf.rect(margin + colWidth + 0.35, y + 0.3, (colWidth - 0.5) * (result.confidenceScore / 100), 0.08, "F");

      // Bar 2: Source Credibility
      pdf.setTextColor(100, 116, 139);
      pdf.text(`SOURCE CREDIBILITY: ${result.sourceCredibilityScore}%`, margin + colWidth + 0.35, y + 0.6);
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin + colWidth + 0.35, y + 0.65, colWidth - 0.5, 0.08, "F");
      pdf.setFillColor(6, 182, 212); // cyan-500
      pdf.rect(margin + colWidth + 0.35, y + 0.65, (colWidth - 0.5) * (result.sourceCredibilityScore / 100), 0.08, "F");

      // Bar 3: Emotional manipulation
      pdf.setTextColor(100, 116, 139);
      pdf.text(`EMOTIONAL SENSATIONALISM: ${result.emotionalManipulationScore}%`, margin + colWidth + 0.35, y + 0.95);
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin + colWidth + 0.35, y + 1.0, colWidth - 0.5, 0.08, "F");
      if (result.emotionalManipulationScore >= 60) {
        pdf.setFillColor(239, 68, 68); // red-500
      } else {
        pdf.setFillColor(245, 158, 11); // amber-500
      }
      pdf.rect(margin + colWidth + 0.35, y + 1.0, (colWidth - 0.5) * (result.emotionalManipulationScore / 100), 0.08, "F");

      y += scoreHeight + 0.2;

      // News Content Quote Box
      checkPageSpace(1.1);
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, y, contentWidth, 0.95, "F");
      pdf.setDrawColor(219, 234, 254);
      pdf.rect(margin, y, contentWidth, 0.95, "D");
      
      pdf.setFillColor(59, 130, 246); // blue-500 edge line
      pdf.rect(margin, y, 0.04, 0.95, "F");

      pdf.setTextColor(37, 99, 235);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text("AUDITED NEWS TRANSCRIPT", margin + 0.15, y + 0.2);

      pdf.setTextColor(51, 65, 85); // slate-700
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8.5);
      
      const fullTextToPrint = result.headline ? `"${result.headline}" — ${result.content}` : `"${result.content}"`;
      const quoteLines = pdf.splitTextToSize(fullTextToPrint, contentWidth - 0.35);
      const outputQuoteLines = quoteLines.slice(0, 4);
      if (quoteLines.length > 4) {
        outputQuoteLines[3] = outputQuoteLines[3] + "... [truncated in report]";
      }
      
      let qY = y + 0.38;
      outputQuoteLines.forEach((line: string) => {
        pdf.text(line, margin + 0.15, qY);
        qY += 0.16;
      });

      y += 1.15;

      // Primary AI Verification Summary
      checkPageSpace(1.5);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text("PRIMARY AI VERIFICATION SUMMARY", margin, y);
      y += 0.12;

      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y, margin + contentWidth, y);
      y += 0.18;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);

      const summaryText = result.explanation || "";
      const summaryLines = pdf.splitTextToSize(summaryText, contentWidth);
      summaryLines.forEach((line: string) => {
        checkPageSpace(0.18);
        pdf.text(line, margin, y);
        y += 0.18;
      });

      y += 0.2;

      // Executive Bias Analysis
      if (result.politicalBias) {
        checkPageSpace(0.85);
        pdf.setFillColor(254, 254, 255);
        pdf.rect(margin, y, contentWidth, 0.65, "F");
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(margin, y, contentWidth, 0.65, "D");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(`DETECTED POLITICAL BIAS: ${result.politicalBias.bias || "Center"}`, margin + 0.15, y + 0.22);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(71, 85, 105);
        
        const bText = result.politicalBias.explanation || "";
        const bLines = pdf.splitTextToSize(bText, contentWidth - 0.3);
        let by = y + 0.38;
        bLines.slice(0, 2).forEach((line: string) => {
          pdf.text(line, margin + 0.15, by);
          by += 0.15;
        });

        y += 0.85;
      }

      // PAGE 2: Claim-by-Claim Verified Cross-Checks
      if (result.suspiciousClaims && result.suspiciousClaims.length > 0) {
        pdf.addPage();
        drawHeaderFooter();
        y = 0.8;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text("CLAIM-BY-CLAIM VERIFIED CROSS-CHECKS", margin, y);
        y += 0.12;

        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, y, margin + contentWidth, y);
        y += 0.18;

        result.suspiciousClaims.forEach((claim: any, idx: number) => {
          checkPageSpace(1.1);

          pdf.setFillColor(251, 252, 254);
          pdf.rect(margin, y, contentWidth, 0.95, "F");
          pdf.setDrawColor(235, 241, 250);
          pdf.rect(margin, y, contentWidth, 0.95, "D");

          let rColor = [115, 115, 115]; // neutral
          if (claim.rating === "Verified") {
            rColor = [16, 185, 129];
          } else if (claim.rating === "Needs Verification" || claim.rating === "Misleading") {
            rColor = [245, 158, 11];
          } else {
            rColor = [239, 68, 68];
          }

          pdf.setFillColor(rColor[0], rColor[1], rColor[2]);
          pdf.rect(margin, y, 0.04, 0.95, "F");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8.5);
          pdf.setTextColor(15, 23, 42);
          pdf.text(`Claim Analysis #${idx + 1}`, margin + 0.15, y + 0.22);

          pdf.setFontSize(8);
          pdf.setTextColor(rColor[0], rColor[1], rColor[2]);
          pdf.text(String(claim.rating).toUpperCase(), margin + contentWidth - 0.15, y + 0.22, { align: "right" });

          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(8);
          pdf.setTextColor(71, 85, 105);
          const cLines = pdf.splitTextToSize(`"${claim.claim}"`, contentWidth - 0.3);
          pdf.text(cLines[0] || "", margin + 0.15, y + 0.4);

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          const caLines = pdf.splitTextToSize(claim.analysis || "", contentWidth - 0.3);
          let cay = y + 0.56;
          caLines.slice(0, 3).forEach((line: string) => {
            pdf.text(line, margin + 0.15, cay);
            cay += 0.14;
          });

          y += 1.05;
        });
        
        y += 0.15;
      }

      // Explainable AI & Risk Vectors
      const hasIndicators = (result.explanationDetails?.keywords?.length || 0) > 0 ||
                            (result.explanationDetails?.manipulationTactics?.length || 0) > 0 ||
                            (result.clickbaitIndicators?.length || 0) > 0;

      if (hasIndicators) {
        checkPageSpace(1.8);
        
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text("NEURAL RISK INDICATORS AND AUDIT VECTORS", margin, y);
        y += 0.12;

        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, y, margin + contentWidth, y);
        y += 0.2;

        const colW = (contentWidth - 0.4) / 3;
        const startY = y;

        // Keywords Flagged
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(239, 68, 68); // red
        pdf.text("FLAGGED TERMS", margin, y);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        let ky = y + 0.2;
        const kwList = result.explanationDetails?.keywords || [];
        if (kwList.length > 0) {
          kwList.slice(0, 4).forEach((kw: string) => {
            pdf.text(`• "${kw}"`, margin, ky);
            ky += 0.15;
          });
        } else {
          pdf.text("None detected.", margin, ky);
          ky += 0.15;
        }

        // Tactics
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(245, 158, 11); // amber
        pdf.text("MANIPULATIVE TACTICS", margin + colW + 0.2, startY);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        let ty = startY + 0.2;
        const mtList = result.explanationDetails?.manipulationTactics || [];
        if (mtList.length > 0) {
          mtList.slice(0, 4).forEach((tc: string) => {
            const wrapped = pdf.splitTextToSize(`• ${tc}`, colW);
            pdf.text(wrapped[0] || "", margin + colW + 0.2, ty);
            ty += 0.15;
          });
        } else {
          pdf.text("None identified.", margin + colW + 0.2, ty);
          ty += 0.15;
        }

        // Clickbait
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(37, 99, 235); // blue
        pdf.text("CLICKBAIT TRAPS", margin + (colW * 2) + 0.4, startY);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);
        let cy = startY + 0.2;
        const cbList = result.clickbaitIndicators || [];
        if (cbList.length > 0) {
          cbList.slice(0, 4).forEach((cb: string) => {
            const wrapped = pdf.splitTextToSize(`• ${cb}`, colW);
            pdf.text(wrapped[0] || "", margin + (colW * 2) + 0.4, cy);
            cy += 0.15;
          });
        } else {
          pdf.text("None identified.", margin + (colW * 2) + 0.4, cy);
          cy += 0.15;
        }

        y = Math.max(ky, ty, cy) + 0.25;
      }

      // Recommendations Section
      if (result.recommendations && result.recommendations.length > 0) {
        checkPageSpace(1.3);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text("FACT-CHECKING RECOMMENDATIONS AND NEXT STEPS", margin, y);
        y += 0.12;

        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, y, margin + contentWidth, y);
        y += 0.18;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(71, 85, 105);

        result.recommendations.forEach((rec: string) => {
          checkPageSpace(0.35);
          const wrappedRec = pdf.splitTextToSize(`• ${rec}`, contentWidth - 0.2);
          wrappedRec.forEach((line: string) => {
            pdf.text(line, margin, y);
            y += 0.15;
          });
          y += 0.05;
        });
      }

      // Save PDF instantly
      pdf.save(`TruthLens_Audit_Report_${result.id || "export"}.pdf`);

    } catch (pdfErr) {
      console.error("Native high-fidelity PDF render failed, falling back to window print stream:", pdfErr);
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
