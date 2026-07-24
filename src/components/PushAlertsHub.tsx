import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Sparkles, 
  Check, 
  Loader2, 
  Volume2, 
  Send, 
  RefreshCw, 
  Sliders, 
  Terminal, 
  MessageSquare
} from "lucide-react";

interface PushAlertsHubProps {
  onNotificationTrigger?: () => void;
}

export default function PushAlertsHub({ onNotificationTrigger }: PushAlertsHubProps) {
  // Multichannel settings states
  const [preferences, setPreferences] = useState({
    fcm: true,
    email: true,
    sms: true,
    telegram: true,
    whatsapp: false
  });
  const [emailRecipient, setEmailRecipient] = useState("tanishtthasehgal@gmail.com");
  const [phoneRecipient, setPhoneRecipient] = useState("+91 93108 91246");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Simulation parameters
  const [simType, setSimType] = useState<"FIREBASE" | "EMAIL" | "SMS">("FIREBASE");
  const [selectedIpo, setSelectedIpo] = useState("Waaree Energies");
  const [alertType, setAlertType] = useState<"GMP_SPIKE" | "ALLOTMENT_OUT" | "PROSPECTUS_UPDATE">("GMP_SPIKE");
  
  // Status transition simulator states
  const [statusIpo, setStatusIpo] = useState("WAAREEENER|Waaree Energies Ltd");
  const [runningStatusTrigger, setRunningStatusTrigger] = useState(false);
  
  // Simulator result states
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simResult, setSimResult] = useState<{
    title: string;
    message: string;
    emailHtml: string;
    smsText: string;
  } | null>(null);

  // Sound/haptic triggers
  const [phoneBouncing, setPhoneBouncing] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync settings with server on load
  useEffect(() => {
    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.notificationPreferences) {
          setPreferences(data.notificationPreferences);
        }
      })
      .catch(err => console.error("Failed to load user settings:", err));
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences })
      });
      if (res.ok) {
        setSettingsSavedMsg(true);
        setTimeout(() => setSettingsSavedMsg(false), 2500);
      }
    } catch (e) {
      console.error("Failed to save settings:", e);
    } finally {
      setSavingSettings(false);
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Play synthetic alert chime for authentic browser trigger
  const playAlertSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const playTone = (time: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(0.2, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.start(time);
        osc.stop(time + duration);
      };

      const now = ctx.currentTime;
      playTone(now, 587.33, 0.15); // D5
      playTone(now + 0.12, 880, 0.3); // A5
    } catch (err) {
      console.warn("Audio context chime blocked by autoplay policy:", err);
    }
  };

  const fireStatusTrigger = async () => {
    setRunningStatusTrigger(true);
    setSimLogs([]);
    setSimResult(null);

    const [symbol, name] = statusIpo.split("|");

    const printLog = (msg: string, delay: number) => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          setSimLogs(prev => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    await printLog("[GCP Executor] Triggering server status mock callback...", 100);

    try {
      const res = await fetch("/api/notifications/test-status-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipoSymbol: symbol,
          ipoName: name,
          oldStatus: "UPCOMING",
          newStatus: "LISTING",
          emailRecipient
        })
      });

      if (!res.ok) {
        throw new Error("Trigger service reported a timeout or permissions failure.");
      }

      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        for (const log of data.logs) {
          await printLog(log, 200);
        }
      }

      setSimResult({
        title: data.title,
        message: data.message,
        emailHtml: data.emailHtml,
        smsText: `[SMS Alert] ${name} (${symbol}) is officially listing now on NSE! Check allotment status.`
      });

      playAlertSound();

      if (onNotificationTrigger) {
        onNotificationTrigger();
      }
    } catch (err: any) {
      console.error(err);
      await printLog(`[ERROR] Trigger failed: ${err.message || "Unknown error"}`, 200);
    } finally {
      setRunningStatusTrigger(false);
    }
  };

  const executeSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningSimulation(true);
    setSimLogs([]);
    setSimResult(null);

    const printLog = (msg: string, delay: number) => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          setSimLogs(prev => [...prev, msg]);
          resolve();
        }, delay);
      });
    };

    await printLog(`[SYSTEM] Instantiating micro-service trigger for ${simType}...`, 100);
    await printLog(`[SCHEDULER] Dispatching high-priority transaction. targetChannel=${simType}`, 300);

    try {
      const res = await fetch("/api/notifications/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: simType,
          ipoName: selectedIpo,
          alertType,
          emailRecipient,
          phoneRecipient
        })
      });

      if (!res.ok) {
        throw new Error("Simulated gateway pipeline timed out.");
      }

      const data = await res.json();
      
      if (data.logs && Array.isArray(data.logs)) {
        for (const log of data.logs) {
          await printLog(log, 200);
        }
      }

      setSimResult({
        title: data.title,
        message: data.message,
        emailHtml: data.emailHtml,
        smsText: data.smsText
      });

      if (simType === "SMS" || simType === "FIREBASE") {
        setPhoneBouncing(true);
        setTimeout(() => setPhoneBouncing(false), 1200);
      }

      playAlertSound();

      if (onNotificationTrigger) {
        onNotificationTrigger();
      }
    } catch (err: any) {
      console.error(err);
      await printLog(`[ERROR] Pipeline exception occurred: ${err.message || "Unknown gateway error"}`, 200);
    } finally {
      setRunningSimulation(false);
    }
  };

  return (
    <div id="push-notifications-alert-workspace" className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-1 sm:px-0">
      {/* Header Panel */}
      <div className="border-b border-border pb-4 sm:pb-5">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-violet-500/10 text-violet-500 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-violet-500/20">
          Firebase • Email • SMS Hub
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground mt-1.5 sm:mt-2 flex items-center">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary mr-2 animate-bounce shrink-0" />
          Multichannel Alerts & Push Hub
        </h1>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Simulate and verify production alert gateways. Toggle cloud preferences, trigger mock alert flows, and observe real-time Firebase Admin, SMTP, and cellular SMS outputs in high-fidelity preview sandboxes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left 5 Columns */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          
          {/* Section 1: User Preferences Configuration */}
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest font-mono flex items-center">
                <Sliders className="h-4 w-4 text-primary mr-1.5 shrink-0" />
                Alert Routing
              </h3>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">Postgres Settings</span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed mb-3 sm:mb-4">
              Configure active delivery pathways for real-time portfolio GMP drops or allotment publish releases.
            </p>

            <div className="space-y-3 sm:space-y-4 pt-1">
              <div className="flex items-start justify-between border-b border-border/40 pb-3 gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground flex items-center">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-1 shrink-0" />
                    Firebase Web Push
                  </span>
                  <span className="text-[10px] text-muted-foreground block">Instant web client browser chime alerts.</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.fcm}
                  onChange={() => togglePreference("fcm")}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 sm:h-4.5 sm:w-4.5 cursor-pointer shrink-0 mt-0.5"
                />
              </div>

              <div className="flex items-start justify-between border-b border-border/40 pb-3 gap-2">
                <div className="space-y-0.5 w-full">
                  <span className="text-xs font-bold text-foreground flex items-center">
                    <Mail className="h-3.5 w-3.5 text-blue-500 mr-1 shrink-0" />
                    Email Summaries
                  </span>
                  <span className="text-[10px] text-muted-foreground block">Detailed financial analysis inline reports.</span>
                  
                  {preferences.email && (
                    <input
                      type="email"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      className="mt-2 w-full sm:w-52 bg-muted/30 border border-border rounded-lg px-2 py-1 text-[10px] text-foreground focus:outline-none"
                      placeholder="Enter target email"
                    />
                  )}
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.email}
                  onChange={() => togglePreference("email")}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 sm:h-4.5 sm:w-4.5 cursor-pointer shrink-0 mt-0.5"
                />
              </div>

              <div className="flex items-start justify-between border-b border-border/40 pb-3 gap-2">
                <div className="space-y-0.5 w-full">
                  <span className="text-xs font-bold text-foreground flex items-center">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-500 mr-1 shrink-0" />
                    SMS Alerts
                  </span>
                  <span className="text-[10px] text-muted-foreground block">High-priority telecom cellular messages.</span>
                  
                  {preferences.sms && (
                    <input
                      type="text"
                      value={phoneRecipient}
                      onChange={(e) => setPhoneRecipient(e.target.value)}
                      className="mt-2 w-full sm:w-52 bg-muted/30 border border-border rounded-lg px-2 py-1 text-[10px] text-foreground focus:outline-none"
                      placeholder="Enter target phone"
                    />
                  )}
                </div>
                <input 
                  type="checkbox" 
                  checked={preferences.sms}
                  onChange={() => togglePreference("sms")}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 sm:h-4.5 sm:w-4.5 cursor-pointer shrink-0 mt-0.5"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 gap-2">
                {settingsSavedMsg ? (
                  <span className="text-[10px] text-emerald-500 font-mono flex items-center">
                    <Check className="h-3.5 w-3.5 mr-1 shrink-0" />
                    Saved to cloud successfully!
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Changes sync immediately in Postgres.
                  </span>
                )}

                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="w-full sm:w-auto px-4 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-[11px] font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  {savingSettings ? (
                    <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  ) : (
                    <span>Save Preference</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Simulator Controls */}
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest font-mono flex items-center mb-3 sm:mb-4">
              <Sparkles className="h-4 w-4 text-violet-500 mr-1.5 shrink-0" />
              Campaign Simulator
            </h3>

            <form onSubmit={executeSimulation} className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1.5">
                  1. Choose Channel to Test
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "FIREBASE", label: "FCM Push", icon: <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" /> },
                    { id: "EMAIL", label: "Email", icon: <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" /> },
                    { id: "SMS", label: "SMS", icon: <Smartphone className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> }
                  ].map(ch => {
                    const active = simType === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setSimType(ch.id as any)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 sm:space-y-1.5 text-center transition-all cursor-pointer ${
                          active 
                            ? "bg-primary/10 border-primary text-foreground font-bold" 
                            : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        {ch.icon}
                        <span className="text-[9px] sm:text-[10px]">{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                  2. Focus IPO Ticker
                </label>
                <select
                  value={selectedIpo}
                  onChange={(e) => setSelectedIpo(e.target.value)}
                  className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="Waaree Energies">Waaree Energies (Solar)</option>
                  <option value="NTPC Green Energy">NTPC Green Energy (Renewable)</option>
                  <option value="Tata Technologies">Tata Technologies (Engineering)</option>
                  <option value="Swiggy Limited">Swiggy Limited (Consumer Tech)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                  3. Alert Trigger Type
                </label>
                <select
                  value={alertType}
                  onChange={(e: any) => setAlertType(e.target.value)}
                  className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="GMP_SPIKE">GMP Spike (Greymarket Momentum Surge)</option>
                  <option value="ALLOTMENT_OUT">Allotment Out (Official NSE Allotments Release)</option>
                  <option value="PROSPECTUS_UPDATE">RHP Prospectus Update (AI Risk Factors Revision)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={runningSimulation}
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {runningSimulation ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span>Executing Sandbox Run...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 shrink-0" />
                    <span>Dispatch Simulated Campaign</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section 3: Cloud Function Status Trigger Simulator */}
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                Firebase Cloud Function
              </span>
            </div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest font-mono flex items-center mb-1">
              <RefreshCw className="h-4 w-4 text-indigo-500 mr-1.5 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
              IPO Status-Update Trigger
            </h3>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3 sm:mb-4">
              Simulates a backend database trigger that detects when a user's tracked IPO transitions from <strong className="text-amber-500">Upcoming</strong> to <strong className="text-emerald-500">Listing</strong>.
            </p>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                  1. Target IPO Document
                </label>
                <select
                  value={statusIpo}
                  onChange={(e) => setStatusIpo(e.target.value)}
                  className="w-full bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="WAAREEENER|Waaree Energies Ltd">Waaree Energies Ltd (WAAREEENER)</option>
                  <option value="SWIGGY|Swiggy Limited">Swiggy Limited (SWIGGY)</option>
                  <option value="NTPCGREEN|NTPC Green Energy">NTPC Green Energy (NTPCGREEN)</option>
                  <option value="HYUNDAI|Hyundai Motor India">Hyundai Motor India (HYUNDAI)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                    Old Status
                  </label>
                  <div className="bg-muted/10 border border-border/40 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-amber-500 font-bold font-mono text-center sm:text-left">
                    UPCOMING
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1 truncate">
                    New Status (Triggers Code)
                  </label>
                  <div className="bg-muted/10 border border-border/40 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-emerald-500 font-bold font-mono text-center sm:text-left">
                    LISTING
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={fireStatusTrigger}
                disabled={runningStatusTrigger}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {runningStatusTrigger ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span>Executing Cloud Function...</span>
                  </>
                ) : (
                  <>
                    <Terminal className="h-3.5 w-3.5 shrink-0" />
                    <span>Fire Firebase Trigger</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 7 Columns */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          <div className="bg-[#030712] border border-[#1f2937] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-[#111827] px-3.5 sm:px-4 py-2 border-b border-[#1f2937] flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-mono text-[#a78bfa] flex items-center font-bold">
                <Terminal className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                Live delivery trace console
              </span>
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full inline-block"></span>
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-amber-500 rounded-full inline-block"></span>
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full inline-block"></span>
              </div>
            </div>

            <div className="p-3 sm:p-4 h-40 sm:h-48 font-mono text-[9px] sm:text-[10px] leading-relaxed overflow-y-auto space-y-1 text-[#e5e7eb]">
              {simLogs.length === 0 ? (
                <div className="text-gray-500 italic flex items-center h-full justify-center text-center">
                  Awaiting sandbox execution. Logs will print here during live dispatch.
                </div>
              ) : (
                simLogs.map((log, idx) => {
                  let colorClass = "text-[#e5e7eb]";
                  if (log.startsWith("[SYSTEM]")) colorClass = "text-[#60a5fa] font-semibold";
                  else if (log.startsWith("[AI]")) colorClass = "text-[#c084fc] font-bold";
                  else if (log.startsWith("[POSTGRES]")) colorClass = "text-[#f472b6]";
                  else if (log.startsWith("[FCM]")) colorClass = "text-[#fbbf24]";
                  else if (log.startsWith("[SMTP]")) colorClass = "text-[#38bdf8]";
                  else if (log.startsWith("[SMS]")) colorClass = "text-[#34d399]";
                  else if (log.startsWith("[ERROR]")) colorClass = "text-rose-400 font-extrabold";
                  
                  return (
                    <div key={idx} className={`${colorClass} whitespace-pre-wrap`}>
                      {log}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Interactive Live Output Sandbox Viewports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest font-mono mb-3 sm:mb-4 flex items-center">
                  <Smartphone className="h-4 w-4 text-emerald-500 mr-1.5 shrink-0" />
                  Target Device Simulator
                </h4>

                <div className={`w-[190px] sm:w-[210px] h-[340px] sm:h-[370px] bg-[#020617] border-4 border-slate-700 rounded-[26px] sm:rounded-[30px] mx-auto relative overflow-hidden shadow-2xl transition-all duration-300 ${phoneBouncing ? "scale-105 border-primary shadow-primary/20" : ""}`}>
                  <div className="w-16 sm:w-20 h-3.5 sm:h-4 bg-slate-800 absolute top-0 left-1/2 transform -translate-x-1/2 rounded-b-xl z-20 flex justify-center items-center">
                    <span className="w-1.5 h-1.5 bg-slate-900 rounded-full mr-1.5 sm:mr-2"></span>
                    <span className="w-6 sm:w-8 h-1 bg-slate-700 rounded-full"></span>
                  </div>

                  <div className="w-full h-full bg-gradient-to-b from-[#1e1b4b] to-[#020617] p-2.5 sm:p-3 pt-5 sm:pt-6 text-white relative flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[7px] sm:text-[8px] font-mono opacity-80 pt-1 z-10 px-1">
                      <span>9:41 AM</span>
                      <div className="flex items-center space-x-1">
                        <span>5G</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="flex-1 mt-3 sm:mt-4 relative">
                      {simResult && (simType === "SMS" || simType === "FIREBASE") ? (
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 sm:p-2.5 space-y-1 text-[8px] sm:text-[9px] animate-fade-in-down shadow-xl z-30">
                          <div className="flex justify-between items-center opacity-90 border-b border-white/10 pb-1 mb-1 font-semibold text-primary">
                            <span className="flex items-center text-amber-400">
                              {simType === "SMS" ? (
                                <MessageSquare className="h-2.5 w-2.5 mr-1 shrink-0" />
                              ) : (
                                <Bell className="h-2.5 w-2.5 mr-1 shrink-0" />
                              )}
                              {simType === "SMS" ? "SMS • IPOSNS" : "IPOSense WebPush"}
                            </span>
                            <span>now</span>
                          </div>
                          <span className="font-bold text-white block truncate">{simResult.title}</span>
                          <p className="text-gray-300 leading-normal text-[7.5px] sm:text-[8px] line-clamp-3">
                            {simType === "SMS" ? simResult.smsText : simResult.message}
                          </p>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-center opacity-40 px-3">
                          <div className="space-y-1">
                            <Smartphone className="h-7 w-7 sm:h-8 sm:w-8 text-slate-500 mx-auto animate-pulse" />
                            <p className="text-[7.5px] sm:text-[8px] text-slate-400 leading-normal">
                              Phone is locked. Awaiting campaign execution to display real-time push/SMS.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-center pb-1 text-[7.5px] sm:text-[8px] opacity-75 font-mono animate-pulse">
                      — Swipe up to unlock —
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-3 sm:pt-4">
                <span className="text-[9px] text-muted-foreground font-mono inline-flex items-center">
                  <Volume2 className="h-3.5 w-3.5 mr-1 text-primary shrink-0" />
                  Chimes play upon delivery.
                </span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest font-mono mb-3 sm:mb-4 flex items-center">
                  <Mail className="h-4 w-4 text-blue-500 mr-1.5 shrink-0" />
                  Email Client Preview
                </h4>

                <div className="bg-slate-950/40 border border-border/80 rounded-xl p-2.5 sm:p-3 h-[320px] sm:h-[370px] overflow-y-auto space-y-3 relative text-left">
                  {simResult && simType === "EMAIL" ? (
                    <div className="space-y-3 animate-fade-in text-[10px]">
                      <div className="border-b border-border/60 pb-2 space-y-1 font-mono text-[8.5px] sm:text-[9px] text-muted-foreground">
                        <div className="truncate"><strong>From:</strong> alerts@mail.iposense.com</div>
                        <div className="truncate"><strong>To:</strong> {emailRecipient}</div>
                        <div className="truncate"><strong>Subject:</strong> {simResult.title}</div>
                      </div>

                      <div 
                        className="email-rendered-preview bg-[#0b0f19] p-2.5 sm:p-3 border border-border/40 rounded-lg overflow-x-hidden text-slate-100"
                        dangerouslySetInnerHTML={{ __html: simResult.emailHtml }}
                      />
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center opacity-40 px-3">
                      <div className="space-y-1">
                        <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-slate-500 mx-auto animate-pulse" />
                        <p className="text-[7.5px] sm:text-[8px] text-slate-400 leading-normal">
                          Inbox empty. Select "Email" channel and trigger campaign to generate full HTML previews.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center pt-3 sm:pt-4 border-t border-border/40 mt-3 sm:mt-4 text-[9px] text-muted-foreground font-mono">
                Responsive layouts optimized for iOS & Android.
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}