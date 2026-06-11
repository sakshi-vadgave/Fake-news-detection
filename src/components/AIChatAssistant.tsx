import React from "react";
import { MessageSquare, Send, Sparkles, User, RefreshCw, BookmarkCheck, MessageSquareCode, ShieldAlert, Bot } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

interface AIChatAssistantProps {
  lastAnalysisResult: any | null;
  token: string | null;
}

export default function AIChatAssistant({ lastAnalysisResult, token }: AIChatAssistantProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "model",
      text: "Hello! I am the TruthLens Fact-Checking Companion. Ask me questions about active news claims, logical fallacies, political biases, or media literacy. How can I assist your investigation today?",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const rawMsg = textToSend || input;
    if (!rawMsg.trim() || loading) return;

    if (!textToSend) setInput("");

    // Append user message
    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      text: rawMsg,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Map message lists to the model's history standard
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historyPayload,
          message: rawMsg,
          lastAnalysisResult
        })
      });

      if (!response.ok) throw new Error("Connection glitch to chat servers");
      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: "ai-" + Date.now(),
        role: "model",
        text: data.response,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: "error-" + Date.now(),
        role: "model",
        text: "I had a temporary connection issue. To spot misinformation, remember: 1) Stop to verify your immediate emotions, 2) Search other authorities, and 3) Examine raw data citations.",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 flex flex-col h-[85vh]" id="ai-chat-assistant">
      
      {/* Title */}
      <div className="text-center space-y-1.5 shrink-0">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <MessageSquareCode className="w-7 h-7 text-blue-600 animate-pulse" />
          LensBot AI Fact Checker Assistant
        </h1>
        <p className="text-slate-500 text-xs max-w-lg mx-auto">
          An intelligent interactive sandbox trained in logical errors, verification tactics, and political tilts.
        </p>
      </div>

      {lastAnalysisResult && (
        <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4.5 h-4.5 text-blue-600" />
            <div className="leading-normal">
              <span className="font-bold text-blue-800 block">Loaded Context Analysis:</span>
              <p className="text-slate-500 font-medium line-clamp-1">"{lastAnalysisResult.headline || lastAnalysisResult.content || "Vetted document"}" • {lastAnalysisResult.classification}</p>
            </div>
          </div>
          <button
            onClick={() => loadSuggestion("Provide a detailed breakdown of the loaded analysis results, highlighting specific manipulation tactics.")}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border text-blue-600 hover:text-blue-700 font-bold rounded-lg transition-all cursor-pointer shadow-sm text-[10px]"
          >
            Ask About It
          </button>
        </div>
      )}

      {/* Message Stage */}
      <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-5 overflow-y-auto space-y-4 shadow-inner min-h-[250px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar block */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === "user" ? "bg-blue-100 text-blue-600" : "bg-slate-900 text-emerald-400"
            }`}>
              {msg.role === "user" ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5 stroke-[2]" />}
            </div>

            {/* Bubble */}
            <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
              msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10" : "bg-[#F8FAFC] text-slate-800 border rounded-tl-none whitespace-pre-wrap"
            }`}>
              {msg.text}
              <span className={`block text-[9px] mt-1.5 font-semibold font-mono text-right ${msg.role === "user" ? "text-blue-100/80" : "text-slate-400"}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start max-w-[80%] items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div className="py-3 px-4 bg-[#F8FAFC] border rounded-2xl rounded-tl-none flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              <span className="text-xs text-slate-400 font-semibold font-mono">LensBot is checking sources...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Action chips */}
      <div className="flex flex-wrap gap-2 shrink-0 justify-center">
        <button
          onClick={() => loadSuggestion("What are the most common clickbait indicators?")}
          className="px-3 py-1.5 bg-slate-50 border hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs rounded-xl transition-all cursor-pointer font-medium"
        >
          🔍 clickbait traits
        </button>
        <button
          onClick={() => loadSuggestion("Explain SIFT fact checking method in simple terms.")}
          className="px-3 py-1.5 bg-slate-50 border hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs rounded-xl transition-all cursor-pointer font-medium"
        >
          📖 SIFT framework
        </button>
        <button
          onClick={() => loadSuggestion("How do automated algorithmic social bots trick users?")}
          className="px-3 py-1.5 bg-slate-50 border hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs rounded-xl transition-all cursor-pointer font-medium"
        >
          🤖 Bot disinformation
        </button>
      </div>

      {/* Input controls */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2.5 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask LensBot a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4.5 py-3 border border-slate-200 outline-none rounded-xl focus:border-blue-500 bg-[#FAFCFE] focus:bg-white text-sm transition-all shadow-inner focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center transition-all shrink-0 active:scale-95"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>

    </div>
  );
}
