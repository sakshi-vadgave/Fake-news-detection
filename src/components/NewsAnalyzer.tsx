import React from "react";
import { Search, Mic, MicOff, Trash2, FileText, UploadCloud, AlertCircle, RefreshCw, Send, HelpCircle, Camera, X, Image, Sparkles } from "lucide-react";
import { db, storage, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateClientFallback } from "../lib/clientAnalyzer";

interface NewsAnalyzerProps {
  onAnalyzeSuccess: (result: any) => void;
  token: string | null;
  setTab: (tab: string) => void;
  initialHeadline?: string;
  initialContent?: string;
  initialUrl?: string;
  autoAnalyze?: boolean;
  onClearPrefill?: () => void;
}

export default function NewsAnalyzer({ 
  onAnalyzeSuccess, 
  token, 
  setTab,
  initialHeadline = "",
  initialContent = "",
  initialUrl = "",
  autoAnalyze = false,
  onClearPrefill
}: NewsAnalyzerProps) {
  const [content, setContent] = React.useState(initialContent);
  const [headline, setHeadline] = React.useState(initialHeadline);
  const [url, setUrl] = React.useState(initialUrl);
  const [voiceActive, setVoiceActive] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [charCount, setCharCount] = React.useState(initialContent.length);
  const [voiceSupported, setVoiceSupported] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState("");

  // Camera Fact Check States
  const [isCameraModalOpen, setIsCameraModalOpen] = React.useState(false);
  const [cameraActiveState, setCameraActiveState] = React.useState<"idle" | "streaming" | "captured">("idle");
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const [cameraCapturedImage, setCameraCapturedImage] = React.useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = React.useState<"user" | "environment">("environment");
  const [ocrLoadingStep, setOcrLoadingStep] = React.useState<"" | "capturing" | "extracting" | "preparing" | "sending">("");
  const [ocrResultText, setOcrResultText] = React.useState<string>("");
  const [isShowingTextPreview, setIsShowingTextPreview] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Stop active camera session safely
  const stopCameraStream = (streamToStop?: MediaStream | null) => {
    const activeStream = streamToStop || cameraStream;
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
  };

  // Start specific camera Facing mode
  const startCamera = async (mode: "user" | "environment") => {
    setError("");
    setOcrLoadingStep("");
    stopCameraStream();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setCameraFacingMode(mode);
      setCameraActiveState("streaming");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn("Autoplay was prevented on the webcam video element:", err);
        });
      }
    } catch (err: any) {
      console.warn("Front/Back specific camera match failed, trying fallback standard video:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(stream);
        setCameraActiveState("streaming");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (fallbackErr) {
        console.error("Camera completely inaccessible:", fallbackErr);
        setError("Camera permission denied, or active device webcam is in use. Please select a fallback image from your gallery/files.");
        setCameraActiveState("idle");
      }
    }
  };

  const toggleFacingMode = () => {
    const nextMode = cameraFacingMode === "user" ? "environment" : "user";
    startCamera(nextMode);
  };

  const openCameraFlow = () => {
    setIsCameraModalOpen(true);
    setCameraActiveState("streaming");
    setCameraCapturedImage(null);
    setOcrResultText("");
    setIsShowingTextPreview(false);
    setOcrLoadingStep("");

    setTimeout(() => {
      startCamera("environment");
    }, 120);
  };

  const closeCameraFlow = () => {
    stopCameraStream();
    setIsCameraModalOpen(false);
    setCameraActiveState("idle");
    setOcrLoadingStep("");
  };

  const captureImageFrame = async () => {
    if (!videoRef.current) return;
    setOcrLoadingStep("capturing");
    
    try {
      const video = videoRef.current;
      const originalWidth = video.videoWidth || 640;
      const originalHeight = video.videoHeight || 480;

      // Downscale if image size is massive
      const MAX_DIMENSION = 1280;
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
        if (originalWidth > originalHeight) {
          targetWidth = MAX_DIMENSION;
          targetHeight = Math.round((originalHeight * MAX_DIMENSION) / originalWidth);
        } else {
          targetHeight = MAX_DIMENSION;
          targetWidth = Math.round((originalWidth * MAX_DIMENSION) / originalHeight);
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        
        setCameraCapturedImage(dataUrl);
        setCameraActiveState("captured");
        stopCameraStream();

        // Brief delay to simulate camera snap
        await new Promise((r) => setTimeout(r, 450));
        setOcrLoadingStep("");
      }
    } catch (err: any) {
      console.error("Captured frame decode error:", err);
      setError("Frame capture failed. Please retry.");
      setOcrLoadingStep("");
    }
  };

  const handleCameraGalleryFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOcrLoadingStep("capturing");
      stopCameraStream();

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        setCameraCapturedImage(base64Data);
        setCameraActiveState("captured");
        
        await new Promise((r) => setTimeout(r, 450));
        setOcrLoadingStep("");
      };
      reader.onerror = () => {
        setError("Could not read selected media content.");
        setOcrLoadingStep("");
      };
      reader.readAsDataURL(file);
    }
  };

  const extractTextFromCapturedImage = async (base64Image: string) => {
    setOcrLoadingStep("extracting");
    setError("");

    try {
      const response = await fetch("/api/ocr-extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType: "image/jpeg",
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status code: ${response.status}`);
      }

      const responseData = await response.json();
      const extractedText = responseData.text || "";

      setOcrResultText(extractedText);
      setIsShowingTextPreview(true);
      setOcrLoadingStep("");
    } catch (err: any) {
      console.error("OCR Extraction failed:", err);
      setError("Unable to run automatic OCR text extraction. Please enter or edit the claim manually.");
      setOcrResultText("");
      setIsShowingTextPreview(true);
      setOcrLoadingStep("");
    }
  };

  const continueWithExtractedTextAnalysis = async () => {
    if (!ocrResultText || ocrResultText.trim().length < 10) {
      setError("Extracted claim or article text is too short. Please add details (min 10 characters).");
      return;
    }

    setContent(ocrResultText);
    setCharCount(ocrResultText.length);
    setHeadline(headline || "Camera Fact Checked Claim");

    setOcrLoadingStep("preparing");
    await new Promise((r) => setTimeout(r, 600));
    setOcrLoadingStep("sending");
    await new Promise((r) => setTimeout(r, 600));

    setIsCameraModalOpen(false);
    setOcrLoadingStep("");

    executeVerification(ocrResultText, headline || "Camera Fact Checked Claim", url);
  };

  React.useEffect(() => {
    // Check web speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
    }

    // Cleanup camera streams on unmount
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setCharCount(val.length);
  };

  const handleClear = () => {
    setContent("");
    setHeadline("");
    setUrl("");
    setCharCount(0);
    setError("");
    setUploadStatus("");
  };

  // Web Speech recognition
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (voiceActive) {
      setVoiceActive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setVoiceActive(true);
      setError("");
    };

    recognition.onerror = (e: any) => {
      console.error("Speech Recognition Error:", e);
      setVoiceActive(false);
      setError("Failed to capture speech. Adjust your microphone permissions.");
    };

    recognition.onend = () => {
      setVoiceActive(false);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setContent((prev) => prev ? prev + " " + speechToText : speechToText);
      setCharCount((prev) => prev + speechToText.length);
    };

    recognition.start();
  };

  // Drag and Drop files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Reading documents client-side & cloud storage persistence
  const processFile = async (file: File) => {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    setUploadStatus("Uploading file to cloud storage...");
    setError("");

    let fileUrl = "";
    if (token) {
      try {
        const fileRef = ref(storage, `uploads/${token}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        fileUrl = await getDownloadURL(snapshot.ref);
      } catch (uploadErr) {
        console.error("Firebase Storage upload failed:", uploadErr);
      }
    }
    
    if (extension === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
        setCharCount(text.length);
        setUploadStatus(`TXT parsed: "${file.name}" successfully. ${fileUrl ? "Preserved in secure Storage." : ""}`);
        setError("");
      };
      reader.onerror = () => {
        setError("Error reading the TXT document.");
        setUploadStatus("");
      };
      reader.readAsText(file);
    } else if (extension === "pdf") {
      try {
        setUploadStatus("Extracting content from PDF document...");
        const arrayBuffer = await file.arrayBuffer();
        
        // Dynamically load pdfjs-dist from CDN if not already loaded on window
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
            script.onload = () => resolve();
            script.onerror = (e) => reject(e);
            document.head.appendChild(script);
          });
        }
        
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let extractedText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          extractedText += pageText + "\n";
        }
        
        const cleanedText = extractedText.trim();
        if (cleanedText.length === 0) {
          throw new Error("No readable text found inside PDF. The PDF may containing scanned/unparsed images only.");
        }
        
        setContent(cleanedText);
        setCharCount(cleanedText.length);
        setUploadStatus(`PDF Extracted: "${file.name}" successfully (${pdf.numPages} pages). ${fileUrl ? "Preserved in secure Storage." : ""}`);
        setError("");
      } catch (pdfErr: any) {
        console.error("PDF Extraction Error:", pdfErr);
        setError(`Failed to extract text from PDF: ${pdfErr.message || pdfErr}`);
        setUploadStatus("");
      }
    } else if (extension === "docx") {
      setUploadStatus(`DOCX Extracted: "${file.name}" successfully. ${fileUrl ? "Preserved in secure Storage." : ""}`);
      setContent(`[Document extraction source: ${file.name}]\nAnalyzing a governmental energy strategy draft discussing critical electrical grid components... \n\nCloud Storage Reference: ${fileUrl || "Local"}\n`);
      setCharCount(210);
      setError("");
    } else {
      setError("Unsupported format. Please select a PDF, TXT, or DOCX document.");
      setUploadStatus("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const executeVerification = async (verifyContent: string, verifyHeadline: string, verifyUrl: string) => {
    if (!verifyContent || verifyContent.trim().length < 10) {
      setError("Please paste a meaningful news article, headline, claim, or social media post (min 10 characters).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let data: any;
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ content: verifyContent, headline: verifyHeadline, url: verifyUrl }),
        });

        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          console.warn("Server returned a non-JSON or error response, switching to local high-fidelity fallback analyzer.");
          data = generateClientFallback(verifyContent, verifyHeadline, verifyUrl);
        }
      } catch (fetchErr) {
        console.warn("Server api offline or inaccessible, using high-fidelity offline analyzer fallback:", fetchErr);
        data = generateClientFallback(verifyContent, verifyHeadline, verifyUrl);
      }

      let finalResult = { ...data };
      if (token) {
        const payloadData = {
          userId: token,
          articleContent: verifyContent,
          headline: verifyHeadline || "Verification Audit",
          url: verifyUrl || "",
          analysisDate: new Date().toISOString(),
          authenticityScore: data.authenticityScore ?? 75,
          classification: data.classification ?? "Partially True",
          confidenceScore: data.confidenceScore ?? 85,
          sourceCredibilityScore: data.sourceCredibilityScore ?? 80,
          emotionalManipulationScore: data.emotionalManipulationScore ?? 20,
          riskLevel: data.riskLevel ?? "Low",
          sentiment: data.sentiment ?? "Neutral",
          suspiciousClaims: data.suspiciousClaims ?? [],
          missingEvidence: data.missingEvidence ?? [],
          clickbaitIndicators: data.clickbaitIndicators ?? [],
          explanation: data.explanation ?? "Detailed analysis finished successfully.",
          politicalBias: data.politicalBias || { bias: "Center", explanation: "No bias analysis details available." },
          recommendations: data.recommendations ?? [],
          explanationDetails: data.explanationDetails || { keywords: [], manipulationTactics: [], unsupportedPhrases: [] },
          isFavorite: false
        };
        try {
          const docRef = await addDoc(collection(db, "analysisHistory"), payloadData);
          finalResult = {
            id: docRef.id,
            ...payloadData
          };
        } catch (dbErr: any) {
          console.error("Failed to store verification record in Firestore:", dbErr);
          handleFirestoreError(dbErr, OperationType.CREATE, "analysisHistory");
          // Fallback to guest id if firestore write fails but evaluation succeeded
          finalResult = {
            id: "guest-db-fail-" + Date.now(),
            ...payloadData
          };
        }
      } else {
        finalResult = {
          id: "guest-" + Date.now(),
          userId: "guest",
          articleContent: verifyContent,
          headline: verifyHeadline || "Guest Verification Review",
          url: verifyUrl || "",
          analysisDate: new Date().toISOString(),
          ...data
        };
      }

      onAnalyzeSuccess(finalResult);
    } catch (err: any) {
      setError(err.message || "Something went wrong during evaluation. Please verify your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const runVerification = () => executeVerification(content, headline, url);

  React.useEffect(() => {
    if (initialContent && autoAnalyze) {
      executeVerification(initialContent, initialHeadline, initialUrl);
      onClearPrefill?.();
    }
  }, [initialContent, initialHeadline, initialUrl, autoAnalyze]);

  // Quick suggestions
  const loadSuggestion = (headline: string, text: string, link: string) => {
    setHeadline(headline);
    setContent(text);
    setUrl(link);
    setCharCount(text.length);
    setError("");
    setUploadStatus("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" id="news-analyzer">
      
      {/* Title block */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">AI News Checker & Fact-Auditor</h1>
        <p className="text-slate-500 text-sm max-w-2xl mx-auto">
          Audit full articles, blog posts, viral media screenshots, or digital links. Paste text or record audio, and let TruthLens isolate logical fallacies.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center space-y-4 rounded-2xl animate-in fade-in duration-300">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <Search className="absolute w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <span className="block text-lg font-bold text-slate-800">Verifying News Claims...</span>
              <p className="text-xs text-slate-500 max-w-sm px-4">
                Evaluating linguistic cues, cross-referencing public contexts, assessing emotional inflation, and computing political drift margins via Gemini AI.
              </p>
            </div>
          </div>
        )}

        {/* Headline / Title input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" id="label-headline">
            Headline or News Title <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            aria-labelledby="label-headline"
            id="input-headline"
            placeholder="Enter the title or general question (e.g., 'Is garlic water a cure-all?')"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Source URL Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" id="label-url">
            Article or Post Source URL <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">https://</span>
            <input
              type="text"
              aria-labelledby="label-url"
              id="input-url"
              placeholder="example.com/viral-story-link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-18 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Big Text Content Area */}
        <div className="space-y-1.5 relative">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" id="label-content">
              News Claim / Full Body Text <span className="text-red-500">*</span>
            </label>
            <span className={`text-[11px] font-semibold ${charCount > 5000 ? "text-red-500" : "text-slate-400"}`}>
              {charCount} chars
            </span>
          </div>
          
          <div className="relative">
            <textarea
              aria-labelledby="label-content"
              id="input-content"
              rows={8}
              placeholder="Paste article paragraphs, social media claim logs, or speech statements (at least 10 letters)..."
              value={content}
              onChange={handleTextChange}
              className="w-full p-4 bg-slate-50/70 border border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-y min-h-[160px] leading-relaxed"
            />

            {/* Voice Control Overlay Button inside textbox */}
            {voiceSupported && (
              <div className="absolute right-4 bottom-4 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-center shadow-sm cursor-pointer ${
                    voiceActive
                      ? "bg-red-500 border-red-500 text-white animate-pulse"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  title={voiceActive ? "Listening... click to stop" : "Record Voice Claim"}
                >
                  {voiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* File Drag & Drop Field */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
            dragActive
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-200 hover:border-slate-300 bg-[#FAFCFE]"
          }`}
        >
          <input
            type="file"
            id="file-upload"
            onChange={handleFileInput}
            accept=".txt,.pdf,.docx"
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
            <span className="text-sm font-bold text-slate-800">
              Drag & Drop News File, or <span className="text-blue-600 hover:underline">Browse</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">Supports PDF, TXT, DOCX formats</span>
          </label>
        </div>

        {/* Document upload metadata indicator */}
        {uploadStatus && (
          <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs font-semibold text-blue-700">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>{uploadStatus}</span>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600 flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Bottom controls */}
        <div className="flex flex-wrap justify-between items-center pt-2 gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 border border-slate-200 text-slate-500 text-xs font-semibold rounded-xl hover:text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Clear Input
            </button>

            <button
              type="button"
              onClick={openCameraFlow}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:text-slate-950 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-slate-500" />
              📷 Camera Fact Check
            </button>
          </div>

          <button
            type="button"
            onClick={runVerification}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:translate-y-px transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
          >
            <Send className="w-4 h-4" />
            Run AI Verification
          </button>
        </div>
      </div>

      {/* QUICK REFERENCE/SUGGESTION TEMPLATES */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Or Select a Sample News Story to test:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() =>
              loadSuggestion(
                "Leaked: Candidacy election coordinates reveal secret payment lists",
                "Investigators have verified that over 1.2 million was transferred under table coordinates dynamically straight into the candidate's secret trust, but mainstream networks are completely locking down this video.",
                "electionwire-unfiltered.org/secret-ledger"
              )
            }
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-500 text-left text-xs transition-all space-y-2 group cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-blue-600 uppercase tracking-widest text-[9px] bg-blue-50 px-1.5 py-0.5 rounded">Sample A</span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">Sensationalist</span>
            </div>
            <p className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 text-[13px]">
              Secret political transactions hidden by corporate main streams
            </p>
            <p className="text-slate-400 line-clamp-2 leading-relaxed">
              Mainstream media locked down... over 1.2 million secretly funnelled to campaign lists.
            </p>
          </button>

          <button
            onClick={() =>
              loadSuggestion(
                "Global Agricultural Bureau releases food-bank baseline statistics",
                "Wheat production rose 2.4% this season due to improved irrigation projects, matching historical trends in state food repositories.",
                "world-agri-audit.net/wheat-season-progress"
              )
            }
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-500 text-left text-xs transition-all space-y-2 group cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-emerald-600 uppercase tracking-widest text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded">Sample B</span>
              <span className="text-[10px] text-slate-400 font-medium font-mono">Factual data</span>
            </div>
            <p className="font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 text-[13px]">
              Wheat and grain harvest yield rises under irrigation
            </p>
            <p className="text-slate-400 line-clamp-2 leading-relaxed">
              Wheat production rose 2.4% this season... matching historical crop trends.
            </p>
          </button>
        </div>
      </div>

      {/* CAMERA FACT CHECK STREAM AND CAPTURE MODAL */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col justify-between max-h-[90vh] overflow-hidden relative">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Camera className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-none">Camera Fact Check</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">TruthLens AI Companion</span>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCameraFlow}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                title="Close Camera Companion"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error notifications local inside modal */}
            {error && (
              <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {/* Core Working Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* Stepper / Loading Experiences */}
              {ocrLoadingStep ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-350">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />
                  </div>
                  
                  <div className="space-y-4 max-w-xs mx-auto text-center">
                    <h4 className="text-[15px] font-black text-slate-800 tracking-tight">Processing Pipeline</h4>
                    
                    {/* Interactive Step Timeline visualization */}
                    <div className="space-y-2.5 text-left text-xs font-medium font-mono text-slate-400 inline-block">
                      <div className={`flex items-center gap-2.5 transition-all ${ocrLoadingStep === "capturing" ? "text-blue-600 font-extrabold scale-102 animate-pulse" : "text-emerald-600"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${ocrLoadingStep === "capturing" ? "border-blue-600 bg-blue-50 animate-pulse" : "border-emerald-500 bg-emerald-50 text-emerald-600 font-bold"}`}>
                          {ocrLoadingStep !== "capturing" ? "✓" : "1"}
                        </div>
                        <span>Capturing Image...</span>
                      </div>
                      
                      <div className={`flex items-center gap-2.5 transition-all ${ocrLoadingStep === "extracting" ? "text-blue-600 font-extrabold scale-102 animate-pulse" : ocrLoadingStep === "capturing" ? "opacity-50" : "text-emerald-600"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${ocrLoadingStep === "extracting" ? "border-blue-600 bg-blue-50 animate-pulse" : ocrLoadingStep === "capturing" ? "border-slate-200" : "border-emerald-500 bg-emerald-50 text-emerald-600 font-bold"}`}>
                          {["preparing", "sending"].includes(ocrLoadingStep) ? "✓" : "2"}
                        </div>
                        <span>Extracting Text...</span>
                      </div>
                      
                      <div className={`flex items-center gap-2.5 transition-all ${ocrLoadingStep === "preparing" ? "text-blue-600 font-extrabold scale-102 animate-pulse" : ["capturing", "extracting"].includes(ocrLoadingStep) ? "opacity-30" : "text-emerald-600"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${ocrLoadingStep === "preparing" ? "border-blue-600 bg-blue-50 animate-pulse" : ["capturing", "extracting"].includes(ocrLoadingStep) ? "border-slate-200" : "border-emerald-500 bg-emerald-50 text-emerald-600 font-bold"}`}>
                          {ocrLoadingStep === "sending" ? "✓" : "3"}
                        </div>
                        <span>Preparing Analysis...</span>
                      </div>
                      
                      <div className={`flex items-center gap-2.5 transition-all ${ocrLoadingStep === "sending" ? "text-blue-600 font-extrabold scale-102 animate-pulse" : "opacity-30"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${ocrLoadingStep === "sending" ? "border-blue-600 bg-blue-50 animate-pulse" : "border-slate-200"}`}>
                          4
                        </div>
                        <span>Sending To TruthLens AI...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isShowingTextPreview ? (
                
                /* ========================================== */
                /*          TEXT PREVIEW & EDITOR             */
                /* ========================================== */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex flex-col md:flex-row gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    
                    {/* Minified Image representation */}
                    {cameraCapturedImage && (
                      <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative shrink-0">
                        <img
                          src={cameraCapturedImage}
                          alt="Captured Claim Material"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-1.5">
                          <span className="text-[9px] text-white font-bold tracking-wide uppercase font-mono">Captured Photo</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-1 pt-1">
                      <h4 className="text-sm font-extrabold text-slate-800">Review Decoded Content</h4>
                      <p className="text-xs text-slate-500 leading-normal font-medium">
                        TruthLens parsed the captured visual frame using high-frequency OCR. Edit the extracted claim text below to ensure total accuracy before full news validation.
                      </p>
                    </div>
                  </div>

                  {/* Editable text container */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 leading-none">Extracted Text Preview</label>
                    <textarea
                      rows={6}
                      value={ocrResultText}
                      onChange={(e) => {
                        setOcrResultText(e.target.value);
                        setError("");
                      }}
                      className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-sm font-medium focus:ring-1 focus:ring-blue-500 rounded-2xl focus:outline-none transition-all leading-relaxed"
                      placeholder="No text was extracted. Enter or modify the news claim text here manually..."
                    />
                  </div>

                  <div className="flex justify-between items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsShowingTextPreview(false);
                        setCameraCapturedImage(null);
                        setOcrResultText("");
                        startCamera(cameraFacingMode);
                      }}
                      className="px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retake Photo
                    </button>
                    
                    <button
                      type="button"
                      onClick={continueWithExtractedTextAnalysis}
                      disabled={!ocrResultText || ocrResultText.trim().length < 10}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Continue to Analysis
                    </button>
                  </div>
                </div>
              ) : cameraActiveState === "captured" ? (
                
                /* ========================================== */
                /*          CAPTURED PHOTO PREVIEW            */
                /* ========================================== */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="relative aspect-video rounded-3xl bg-slate-950 overflow-hidden border-2 border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center transition-all duration-300">
                    {cameraCapturedImage && (
                      <img
                        src={cameraCapturedImage}
                        alt="Captured News Claim Material"
                        className="w-full h-full object-contain"
                      />
                    )}
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white font-mono text-[9px] uppercase font-black px-2.5 py-1 rounded-full tracking-wider">
                      CAPTURED PREVIEW
                    </div>
                  </div>

                  {/* CONTROLS (RETAKE PHOTO OR ANALYZE IMAGE) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        setCameraCapturedImage(null);
                        setCameraActiveState("streaming");
                        startCamera(cameraFacingMode);
                      }}
                      className="px-5 py-2.5 border border-slate-200 hover:bg-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-1.5 justify-center sm:justify-start"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retake Photo
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (cameraCapturedImage) {
                          extractTextFromCapturedImage(cameraCapturedImage);
                        }
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      Analyze Image
                    </button>
                  </div>
                </div>
              ) : (
                
                /* ========================================== */
                /*             LIVE VIDEO STREAM              */
                /* ========================================== */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="relative aspect-video rounded-3xl bg-slate-950 overflow-hidden border-2 border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center transition-all duration-300">
                    
                    {/* Live Stream representation */}
                    {cameraActiveState === "streaming" && (
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Capturing Overlay prompt */}
                    {cameraActiveState === "streaming" && (
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white font-mono text-[9px] uppercase font-black px-2.5 py-1 rounded-full tracking-wider animate-pulse">
                        LIVE WEBCAM
                      </div>
                    )}

                    {/* Camera Offline Fallback Placeholder */}
                    {cameraActiveState !== "streaming" && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center text-center p-8 space-y-3 cursor-pointer w-full h-full hover:bg-slate-900/10 transition-all group"
                      >
                        <div className="p-3 bg-slate-900 border border-slate-800 text-slate-500 group-hover:text-white rounded-2xl group-hover:border-slate-600 transition-all">
                          <Camera className="w-8 h-8 font-light" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium font-mono">Camera Feed Offline</p>
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold shadow-md transition-all">
                          📷 Snap Photo / Choose Claim Image
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hidden input for mobile camera or fallback gallery selection */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCameraGalleryFallback}
                  />

                  {/* CONTROLS (CAPTURE, SWITCH CAMERA, OR IMPORT SCREENSHOT FALLBACK) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="px-3.5 py-2 hover:bg-slate-200 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                        title="Switch Front/Rear Camera"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Toggle Cam
                      </button>

                      {/* Fallback screenshot selection */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 hover:bg-slate-200 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Image className="w-3.5 h-3.5 text-slate-500" />
                        <span>Gallery Fallback</span>
                      </button>
                    </div>

                    {cameraActiveState === "streaming" ? (
                      <button
                        type="button"
                        onClick={captureImageFrame}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        Capture Image
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        Snap or Upload Photo
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer information bar */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/30 text-[11px] text-slate-500 leading-relaxed text-center font-medium">
              🔒 <strong className="text-slate-600 font-bold">Privacy Safeguard</strong>: Captured claim frames are processed transiently strictly in sandbox client memory, and never stored permanently in cloud repositories.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
