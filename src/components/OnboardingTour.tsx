import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  TrendingUp, 
  Search, 
  FileCheck,
  Award,
  HelpCircle,
  Play
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  targetId: string;
  tabId: string; // The tab this step should be viewed on
  position: "bottom" | "top" | "left" | "right" | "center";
}

interface OnboardingTourProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTourClose?: () => void;
}

export default function OnboardingTour({ activeTab, setActiveTab, onTourClose }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  
  const steps: Step[] = [
    {
      id: 1,
      title: "Welcome to IPOSense AI 🚀",
      description: "Welcome! Let's take a quick 1-minute interactive tour of your professional IPO Intelligence & Analytics platform. Learn how we utilize quantitative insights and generative models to optimize your subscription returns.",
      targetId: "welcome-banner",
      tabId: "dashboard",
      position: "center"
    },
    {
      id: 2,
      title: "KPI Analytics & Scores 📊",
      description: "Track your calculated Portfolio Holdings value, total IPO applications bidded, overall AI Smart Score sentiment, and live market indicators at a single glance.",
      targetId: "dashboard-stats",
      tabId: "dashboard",
      position: "bottom"
    },
    {
      id: 3,
      title: "Grey Market Premium Curves 📈",
      description: "Monitor real-time grey market premiums (GMP) and subscription momentum trendlines over the past 5 sessions before making capital deployment decisions.",
      targetId: "dashboard-gmp-chart",
      tabId: "dashboard",
      position: "top"
    },
    {
      id: 4,
      title: "IPO Discovery Matrix 🔍",
      description: "Explore our real-time database of Active, Upcoming, and Listed offerings. Use the robust search filter engine to locate tickers instantly.",
      targetId: "sidebar-item-discovery",
      tabId: "discovery",
      position: "right"
    },
    {
      id: 5,
      title: "Smart Side-by-Side Comparison ⚖️",
      description: "Evaluate multiple IPOs concurrently. Build dynamic side-by-side matrices comparing pre/post-issue dilution, financial profits, subscription rates, and custom AI evaluations.",
      targetId: "discovery-compare-tab",
      tabId: "discovery",
      position: "bottom"
    },
    {
      id: 6,
      title: "Registrar Direct Query Engine 🗄️",
      description: "Query official registrar networks (Link Intime & KFintech) directly. Check active allotment statuses by selecting the IPO and entering your PAN & Application ID.",
      targetId: "tracker-check-form",
      tabId: "tracker",
      position: "right"
    },
    {
      id: 7,
      title: "Automated NSE Live Allotment Guard 🛡️",
      description: "Our secure sentinel actively scans national stock exchange allotment broadcasts. When detected, it verifies your saved details automatically, updates the database, and alerts you.",
      targetId: "tracker-sync-button",
      tabId: "tracker",
      position: "top"
    }
  ];

  // Check if tour completed before or is requested to start
  useEffect(() => {
    const isCompleted = localStorage.getItem("iposense_tour_completed");
    if (!isCompleted) {
      // Auto-trigger tour after a brief initial delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const currentStep = steps[currentStepIdx];

  // Function to switch tabs dynamically before highlighting
  useEffect(() => {
    if (isOpen && currentStep) {
      if (activeTab !== currentStep.tabId) {
        setActiveTab(currentStep.tabId);
        // Add a delay to let the UI render the tab content before measuring
        const timer = setTimeout(() => {
          measureTarget();
        }, 300);
        return () => clearTimeout(timer);
      } else {
        measureTarget();
      }
    }
  }, [currentStepIdx, isOpen, activeTab]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      measureTarget();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentStepIdx, isOpen]);

  const measureTarget = () => {
    if (!isOpen || !currentStep) return;
    const element = document.getElementById(currentStep.targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Temporary ring focus effect
      element.classList.add("tour-highlight");
      
      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setCoords(null);
    }
  };

  // Cleanup highlight styles on step transition
  useEffect(() => {
    return () => {
      steps.forEach(s => {
        const el = document.getElementById(s.targetId);
        if (el) el.classList.remove("tour-highlight");
      });
    };
  }, [currentStepIdx]);

  const handleNext = () => {
    // Clear current highlight class
    const prevEl = document.getElementById(currentStep.targetId);
    if (prevEl) prevEl.classList.remove("tour-highlight");

    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    // Clear current highlight class
    const prevEl = document.getElementById(currentStep.targetId);
    if (prevEl) prevEl.classList.remove("tour-highlight");

    if (currentStepIdx > 0) {
      setCurrentStepIdx(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Clear any leftover highlight styles
    steps.forEach(s => {
      const el = document.getElementById(s.targetId);
      if (el) el.classList.remove("tour-highlight");
    });
    localStorage.setItem("iposense_tour_completed", "true");
    setIsOpen(false);
    if (onTourClose) onTourClose();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const restartTour = () => {
    // Remove previous highlights
    steps.forEach(s => {
      const el = document.getElementById(s.targetId);
      if (el) el.classList.remove("tour-highlight");
    });
    setCurrentStepIdx(0);
    setIsOpen(true);
  };

  // Add listener for global event to restart tour (triggered from dashboard banner)
  useEffect(() => {
    const handleStartTour = () => {
      restartTour();
    };
    window.addEventListener("start-onboarding-tour", handleStartTour);
    return () => window.removeEventListener("start-onboarding-tour", handleStartTour);
  }, []);

  if (!isOpen) return null;

  // Responsive calculation for card positioning
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  
  return (
    <>
      {/* Absolute high-contrast SVG overlay with highlighted cutout */}
      <div className="fixed inset-0 z-50 pointer-events-none transition-all duration-300">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-auto" onClick={handleSkip} />
        
        {coords && (
          <div 
            className="absolute border-2 border-primary rounded-xl sm:rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none transition-all duration-300 animate-pulse"
            style={{
              top: `${coords.top - 6}px`,
              left: `${coords.left - 6}px`,
              width: `${coords.width + 12}px`,
              height: `${coords.height + 12}px`,
            }}
          />
        )}
      </div>

      {/* Floating Interactive Guide Card */}
      <div 
        className="fixed z-50 p-4 sm:p-5 bg-card border border-primary/30 rounded-2xl shadow-2xl max-w-[340px] xs:max-w-sm sm:max-w-sm w-[92%] animate-fadeIn text-xs text-foreground"
        style={
          currentStep.position === "center" || !coords || isMobile
            ? {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                position: "fixed",
              }
            : {
                top: `${Math.min(window.innerHeight - 280, Math.max(20, coords.top + coords.height + 15))}px`,
                left: `${Math.min(window.innerWidth - 360, Math.max(16, coords.left + (coords.width / 2) - 170))}px`,
                position: "absolute",
              }
        }
      >
        <div className="flex justify-between items-center mb-2.5 sm:mb-3 pb-2 border-b border-border">
          <div className="flex items-center space-x-1.5 text-primary">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse text-primary shrink-0" />
            <span className="font-mono font-bold tracking-wider uppercase text-[9px] sm:text-[10px]">AI Tour Guide</span>
          </div>
          <button 
            onClick={handleSkip}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Skip Tour"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <h4 className="text-xs sm:text-sm font-bold text-foreground">{currentStep.title}</h4>
          <p className="text-muted-foreground leading-relaxed text-[10px] sm:text-[11px]">{currentStep.description}</p>
        </div>

        {/* Progress Dots & Buttons */}
        <div className="flex items-center justify-between mt-4 sm:mt-5 pt-2.5 sm:pt-3 border-t border-border">
          <div className="flex space-x-1">
            {steps.map((_, idx) => (
              <span 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentStepIdx ? "w-3.5 sm:w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {currentStepIdx > 0 && (
              <button
                onClick={handlePrev}
                className="p-1 sm:p-1.5 rounded-xl border border-border hover:bg-muted hover:text-foreground transition-all cursor-pointer text-muted-foreground flex items-center justify-center"
                title="Back"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-3 sm:px-4 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-md shadow-primary/10 text-[10px] sm:text-[11px]"
            >
              <span>{currentStepIdx === steps.length - 1 ? "Finish" : "Next"}</span>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}