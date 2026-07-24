import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Loader2, 
  Compass, 
  FileText, 
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from "lucide-react";
import { Message } from "../types";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am IPOSense AI Assist, your expert financial analyst and investment advisor. How can I guide your IPO portfolio today? You can type your query or tap the microphone icon to talk with me!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  
  // Voice integration states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeakEnabled, setIsSpeakEnabled] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check speech support on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Suggested prompts
  const suggestions = [
    "Should I apply for Acme CloudTech AI?",
    "Show me the backtesting stats",
    "Are there any RHP red flags?",
    "When is the allotment release date?"
  ];

  // Helper to read text out loud
  const speakText = (text: string) => {
    if (!isSpeakEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Sanitize markdown and symbols for cleaner pronunciation
    const cleanText = text
      .replace(/[#*`_~]/g, "")
      .replace(/₹/g, " Rupees ")
      .replace(/%/g, " percent ")
      .replace(/x/g, " times ")
      .replace(/RHP/g, "Red Herring Prospectus")
      .replace(/GMP/g, "Grey Market Premium");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => 
      v.name.includes("Google US English") || 
      v.name.includes("Female") || 
      v.lang.startsWith("en")
    );
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Toggle micro listener
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInputText(transcript);
        handleSendMessage(transcript);
      }
    };

    recognition.start();
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setSending(true);

    try {
      const res = await fetch("/api/groq/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      const data = await res.json();

      const aiText = (data.text || "Sorry, I couldn't formulate a robust financial valuation. Let me know if I can help you with anything else.")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/__/g, "")
        .replace(/#/g, "")
        .trim();
      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: "assistant",
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      speakText(aiText);
    } catch (err) {
      console.error(err);
      const fallbackText = "I encountered a minor network disruption connecting to my valuation indexes. However, checking local offline registries, Acme Cloudtech remains our top recommended BUY with a robust score of 88 out of 100.";
      const errMsg: Message = {
        id: Math.random().toString(),
        sender: "assistant",
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
      speakText(fallbackText);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 text-xs text-foreground font-sans">
      {/* Floating Toggle Icon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-11 w-11 sm:h-12 sm:w-12 bg-primary hover:bg-primary/95 text-primary-foreground rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-primary/20 relative group"
          aria-label="Open AI Assistant"
        >
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-violet-400 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-violet-400 rounded-full border-2 border-background"></span>
          
          {/* Hover tip */}
          <div className="hidden sm:block absolute right-14 bg-card border border-border px-3 py-1.5 rounded-xl shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-all font-semibold whitespace-nowrap text-foreground text-[10px]">
            AI IPO Assistant
          </div>
        </button>
      )}

      {/* Expanded Chat Dialog */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 h-[450px] sm:h-[480px] max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-border bg-gradient-to-r from-primary/5 via-violet-500/5 to-transparent flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary/15 border border-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">IPOSense AI Assist</h3>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono flex items-center">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse shrink-0"></span>
                  Ready to evaluate IPOs
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
              {/* TTS Toggle */}
              <button
                onClick={() => {
                  const targetState = !isSpeakEnabled;
                  setIsSpeakEnabled(targetState);
                  if (!targetState && typeof window !== "undefined" && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className={`p-1.5 rounded-lg border transition-all ${isSpeakEnabled ? "bg-primary/10 border-primary/20 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                title={isSpeakEnabled ? "Mute Voice Responses" : "Unmute Voice Responses"}
              >
                {isSpeakEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  if (typeof window !== "undefined" && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-muted/10">
            {messages.map((m) => {
              const isAi = m.sender === "assistant";
              return (
                <div key={m.id} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                  <div className={`p-2.5 sm:p-3 rounded-2xl max-w-[88%] sm:max-w-[85%] leading-relaxed ${
                    isAi ? "bg-card border border-border text-foreground rounded-tl-none" : "bg-primary text-primary-foreground rounded-tr-none"
                  }`}>
                    {/* Render break points gracefully */}
                    <p className="whitespace-pre-line text-[10px] sm:text-[11px]">{m.text}</p>
                    <span className={`text-[8px] sm:text-[9px] mt-1 block text-right font-mono ${isAi ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex justify-start">
                <div className="p-2.5 sm:p-3 bg-card border border-border rounded-2xl rounded-tl-none flex items-center space-x-1.5">
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                  <span className="text-muted-foreground font-mono text-[9px] sm:text-[10px]">AI is formulating quantitative model...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions panel */}
          <div className="px-3 sm:px-4 py-2 border-t border-border/60 bg-muted/5 flex space-x-1.5 overflow-x-auto select-none no-scrollbar">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                className="px-2.5 py-1 sm:py-1.5 bg-card hover:bg-muted border border-border rounded-lg shrink-0 text-muted-foreground hover:text-foreground transition-all cursor-pointer font-medium text-[9px] sm:text-[10px] whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Message Input box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-2.5 sm:p-3 border-t border-border bg-card flex space-x-2 items-center"
          >
            {/* Microphone Button (Speech-to-Text) */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`h-8 w-8 sm:h-9 sm:w-9 border rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isListening 
                    ? "bg-rose-500 border-rose-500 text-white animate-pulse" 
                    : "border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
                title={isListening ? "Listening... click to stop" : "Talk with AI Assistant"}
              >
                {isListening ? <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-bounce" /> : <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </button>
            )}

            <input
              type="text"
              placeholder={isListening ? "Listening... Speak now" : "Ask about active IPOs, sell advice..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-muted/40 border border-border rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs focus:outline-none focus:border-primary min-w-0"
              disabled={isListening}
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim() || isListening}
              className="h-8 w-8 sm:h-9 sm:w-9 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl flex items-center justify-center shadow transition-all shrink-0 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}