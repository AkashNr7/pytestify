import React, { useState } from "react";
import { getSupabaseClient } from "../supabaseClient";
import { X, Mail, Lock, Sparkles, LogIn, UserPlus, HelpCircle, ShieldAlert } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onAuthSuccess: (session: any) => void;
}

export default function AuthModal({ isOpen, onClose, isDarkMode, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const handleSkip = () => {
    localStorage.setItem("pytestify_skipped_login", "true");
    onClose();
  };

  if (!isOpen) return null;

  const bgModal = isDarkMode ? "bg-[#111215] text-neutral-100" : "bg-white text-neutral-800";
  const bgCard = isDarkMode ? "bg-[#17181c]" : "bg-neutral-50";
  const borderCol = isDarkMode ? "border-neutral-800" : "border-neutral-200";
  const inputStyle = isDarkMode 
    ? "bg-[#151619] border-neutral-700 text-neutral-100 placeholder-neutral-500 hover:border-neutral-600 focus:border-indigo-500" 
    : "bg-white border-neutral-300 text-neutral-800 placeholder-neutral-400 hover:border-neutral-400 focus:border-indigo-500";

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured yet. Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY inside environment settings.");
      }

      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        // Sync user with backend db
        if (data.session) {
          try {
            await fetch("/api/users/sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${data.session.access_token}`
              }
            });
          } catch (syncErr) {
            console.error("Profile sync warning:", syncErr);
          }
          onAuthSuccess(data.session);
          onClose();
        }
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessText("Account registered! Please check your email to confirm the status, then sign in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setSuccessText("Password reset email transmitted. Check your spam and inbox folders.");
      }
    } catch (err: any) {
      console.error("Auth transaction failed:", err);
      setErrorText(err.message || "An unexpected error occurred during auth transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className={`relative w-full max-w-sm rounded-xl border ${borderCol} ${bgModal} shadow-2xl overflow-hidden flex flex-col`}>
        
        {/* Decorative Top Accent Tag */}
        <div className="h-1 bg-indigo-600 w-full"></div>

        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-5 pb-3">
          <div className="flex items-center gap-1.5 text-indigo-500">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold">SECURE IDENTITY PROV</span>
          </div>
          <button 
            onClick={onClose}
            className={`p-1 rounded-md transition ${isDarkMode ? "hover:bg-neutral-800 text-neutral-400 hover:text-white" : "hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900"}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="px-5 pb-5 flex-1 select-none">
          <h3 className="text-lg font-bold font-display tracking-tight text-neutral-300">
            {mode === "login" && "Login to Store & Retrieve Details"}
            {mode === "signup" && "Create Developer Account"}
            {mode === "forgot" && "Recover Credentials"}
          </h3>
          <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-neutral-500"} mt-0.5`}>
            {mode === "login" && "Sign in to securely save your migration files, execution reports, and retrieve them later from any device."}
            {mode === "signup" && "Configure email and credentials to unlock automated cloud backups and persistent projects."}
            {mode === "forgot" && "Transmits a secure email token reset key to restore access."}
          </p>

          <form onSubmit={handleAction} className="mt-4 flex flex-col gap-3">
            
            {/* EMAIL */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400">EMAIL ADDRESS</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input 
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full text-xs pl-9 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${inputStyle}`}
                />
              </div>
            </div>

            {/* PASSWORD */}
            {mode !== "forgot" && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400">PASSWORD</label>
                  {mode === "login" && (
                    <button 
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input 
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`w-full text-xs pl-9 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${inputStyle}`}
                  />
                </div>
              </div>
            )}

            {/* ERROR FEEDBACK */}
            {errorText && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 animate-pulse">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorText}</span>
              </div>
            )}

            {/* SUCCESS FEEDBACK */}
            {successText && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-start gap-2">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successText}</span>
              </div>
            )}

            {/* CTA BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-mono font-bold transition duration-200 flex items-center justify-center gap-2 shadow-md disabled:bg-neutral-700 disabled:text-neutral-400 cursor-pointer"
            >
              {loading ? (
                "Authenticating Session..."
              ) : mode === "login" ? (
                <>
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In Workspace
                </>
              ) : mode === "signup" ? (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Configure My Account
                </>
              ) : (
                <>
                  <HelpCircle className="h-3.5 w-3.5" />
                  Transmit Reset Key
                </>
              )}
            </button>

            {/* SKIP LOGIN / GUEST MODE */}
            <button
              type="button"
              onClick={handleSkip}
              className={`w-full mt-1.5 py-2 border ${borderCol} rounded-lg text-xs font-mono font-bold transition duration-200 bg-neutral-500/5 hover:bg-neutral-500/15 text-neutral-400 hover:text-white cursor-pointer flex items-center justify-center gap-1`}
            >
              Skip Login & Continue as Guest
            </button>
          </form>

          {/* Action toggle footer */}
          <div className="mt-4 pt-3 border-t border-dashed border-neutral-800/40 text-center">
            {mode === "login" ? (
              <p className="text-[11px] text-neutral-400">
                New developer workspace?{" "}
                <button 
                  onClick={() => { setMode("signup"); setErrorText(""); setSuccessText(""); }}
                  className="text-indigo-400 hover:underline font-bold"
                >
                  Create Account
                </button>
              </p>
            ) : (
              <p className="text-[11px] text-neutral-400">
                Already have an active account?{" "}
                <button 
                  onClick={() => { setMode("login"); setErrorText(""); setSuccessText(""); }}
                  className="text-indigo-400 hover:underline font-bold"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
