import React, { useState, useEffect } from "react";
import { 
  X, 
  Mail, 
  Lock, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  Loader2, 
  Chrome,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { auth, googleAuthProvider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthTab = "PASSWORD" | "OTP";

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>("PASSWORD");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"INVESTOR" | "RESEARCH_ANALYST" | "ADMINISTRATOR">("INVESTOR");
  
  // OTP States
  const [otpStep, setOtpStep] = useState<"SEND" | "VERIFY">("SEND");
  const [otpCode, setOtpCode] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Listen to message events for the Google OAuth popup callback
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "OAUTH_AUTH_SUCCESS") {
        const { accessToken, refreshToken, user } = event.data;
        
        localStorage.setItem("iposense_access_token", accessToken);
        localStorage.setItem("iposense_refresh_token", refreshToken);
        localStorage.setItem("iposense_user", JSON.stringify(user));
        
        // Dispatch custom auth state change event for App.tsx
        window.dispatchEvent(new Event("iposense_auth_changed"));

        setSuccessMsg(`Welcome back, ${user.name}! Connected via Google SSO.`);
        setLoading(false);

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [onSuccess, onClose]);

  if (!isOpen) return null;

  // JWT / Password Auth handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const url = isSignUp ? "/api/auth/register" : "/api/auth/login";
    const payload = isSignUp 
      ? { email, password, role } 
      : { email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Store custom JWT structure
      localStorage.setItem("iposense_access_token", data.accessToken);
      localStorage.setItem("iposense_refresh_token", data.refreshToken);
      localStorage.setItem("iposense_user", JSON.stringify(data.user));

      // Dispatch event
      window.dispatchEvent(new Event("iposense_auth_changed"));

      setSuccessMsg(isSignUp ? "Account successfully created! Welcome to IPOSense AI." : "Successfully signed in! Initializing workspace...");
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("JWT password auth failed:", err);
      setError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Trigger
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Please input a valid email");

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/otp-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch OTP");

      setSuccessMsg(`A 6-digit OTP has been sent. Check your secure logs!`);
      if (data.simulatedOtp) {
        setSimulatedOtp(data.simulatedOtp);
        // Automatically insert for instant frictionless evaluation!
        setOtpCode(data.simulatedOtp);
      }
      setOtpStep("VERIFY");
    } catch (err: any) {
      setError(err.message || "OTP delivery failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return setError("Please enter the verification code");

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/otp-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP code provided");

      localStorage.setItem("iposense_access_token", data.accessToken);
      localStorage.setItem("iposense_refresh_token", data.refreshToken);
      localStorage.setItem("iposense_user", JSON.stringify(data.user));

      window.dispatchEvent(new Event("iposense_auth_changed"));
      setSuccessMsg(`OTP verified! Welcome back.`);

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Google SSO via Popup with postMessage callback
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Fetch Google OAuth URL from the custom backend
      const res = await fetch("/api/auth/google-url");
      const data = await res.json();

      if (!data.url) {
        throw new Error("Failed to construct Google OAuth Gateway URL");
      }

      // Open OAuth in a popup window (safe inside iframe contexts)
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.url,
        "Google Sign-In",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        throw new Error("Popup blocked by browser. Please enable popups to login with Google.");
      }
    } catch (err: any) {
      console.error("Google SSO popup failed:", err);
      setError(err.message || "Google Single Sign-On failed");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Animated Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-violet-500 to-primary"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mt-2">
          <div className="inline-flex bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {activeTab === "OTP" 
              ? "Access with Passwordless OTP" 
              : isSignUp 
                ? "Create Premium Account" 
                : "Access IPO Intelligence"
            }
          </h2>
          <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
            {activeTab === "OTP"
              ? "Use high-security OTP login with JWT sessions and auto-refresh mechanisms."
              : isSignUp 
                ? "Gain secure cloud synchronization for portfolios, watchlists, and custom AI reports."
                : "Sign in to synchronize your watchlists, track applications, and unlock Groq Llama 3."
            }
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl mt-5">
          <button 
            type="button"
            onClick={() => { setActiveTab("PASSWORD"); setError(null); setSuccessMsg(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "PASSWORD" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Password & Email
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab("OTP"); setError(null); setSuccessMsg(null); }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "OTP" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Passwordless OTP
          </button>
        </div>

        {/* Form Container */}
        {activeTab === "PASSWORD" ? (
          <form onSubmit={handleEmailAuth} className="mt-5 space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-start space-x-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl flex items-start space-x-2 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Role Selection (visible on signup to let user easily test roles!) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">Workspace Role Profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["INVESTOR", "RESEARCH_ANALYST", "ADMINISTRATOR"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        role === r 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "bg-background border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r === "INVESTOR" ? "Investor" : r === "RESEARCH_ANALYST" ? "Analyst" : "Admin"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Register Account ({role.toLowerCase().replace("_", " ")})</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In Securely</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={otpStep === "SEND" ? handleSendOtp : handleVerifyOtp} className="mt-5 space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-start space-x-2 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl flex items-start space-x-2 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {simulatedOtp && otpStep === "VERIFY" && (
              <div className="p-3 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-xl text-center">
                <p className="text-xs font-semibold">Simulated Verification OTP Dispatched!</p>
                <div className="text-xl font-black font-mono tracking-widest mt-1 text-white">{simulatedOtp}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Pre-filled automatically below for instant testing.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  disabled={otpStep === "VERIFY"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {otpStep === "VERIFY" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">6-Digit Verification Code</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm tracking-widest font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Role selection so user can pick their desired testing role for OTP login! */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Login Account Role Profile</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["INVESTOR", "RESEARCH_ANALYST", "ADMINISTRATOR"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          role === r 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r === "INVESTOR" ? "Investor" : r === "RESEARCH_ANALYST" ? "Analyst" : "Admin"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2">
              {otpStep === "VERIFY" && (
                <button
                  type="button"
                  onClick={() => { setOtpStep("SEND"); setSimulatedOtp(null); setOtpCode(""); setError(null); setSuccessMsg(null); }}
                  className="w-1/3 py-2.5 bg-background border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 ${otpStep === "VERIFY" ? "w-2/3" : "w-full"}`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : otpStep === "SEND" ? (
                  <>
                    <Smartphone className="h-4 w-4" />
                    <span>Send Verification Code</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verify Code & Login</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono">
            <span className="bg-card px-2.5 text-muted-foreground">or continue with</span>
          </div>
        </div>

        {/* Third-Party Provider */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          type="button"
          className="w-full py-2.5 bg-background hover:bg-muted text-foreground border border-border text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Chrome className="h-4 w-4 text-primary" />
              <span>Google SSO Gateway</span>
            </>
          )}
        </button>

        {/* Toggle Sign Up / Sign In (for Password tab) */}
        {activeTab === "PASSWORD" && (
          <div className="text-center mt-5">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-all underline decoration-dotted underline-offset-4 cursor-pointer"
            >
              {isSignUp 
                ? "Already registered? Sign in to your workspace" 
                : "Need a dedicated workspace? Create an account"
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
