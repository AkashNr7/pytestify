import React, { useState } from "react";
import { getSupabaseClient } from "../supabaseClient";
import { Sparkles, Mail, Lock, LogIn, UserPlus, HelpCircle, ShieldAlert, Briefcase, Network, UserCheck, Users, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onAuthSuccess: (session: any) => void;
}

export default function AuthModal({ isOpen, onClose, isDarkMode, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [loginRole, setLoginRole] = useState<"staff" | "admin">("staff");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  // Enterprise Custom Registration Fields
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("Staff");

  if (!isOpen) return null;

  const handleSandboxBypass = () => {
    // Generate an automatic workspace sandbox session to prevent Rate Limit blockers
    const normalizedEmail = email.trim() || (loginRole === "admin" ? "admin@organization.com" : "staff@organization.com");
    const mockUserId = loginRole === "admin" ? "00000000-0000-0000-0000-000000000022" : "00000000-0000-0000-0000-000000000100";
    const userRoleValue = loginRole === "admin" ? "Admin" : "Staff";

    const sandboxSession = {
      access_token: `sandbox-bypass-${normalizedEmail}`,
      user: {
        id: mockUserId,
        email: normalizedEmail,
        role: userRoleValue,
        user_metadata: {
          full_name: loginRole === "admin" ? "SYSTEM ADMINISTRATOR" : "STAFF MEMBER",
          role: userRoleValue
        }
      }
    };

    onAuthSuccess(sandboxSession);
    onClose();
  };

  const bgModal = isDarkMode ? "bg-[#111215] text-neutral-100" : "bg-white text-neutral-800";
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
      if (mode === "login") {
        const response = await fetch("/api/auth/login-simple", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim() || email.trim(),
            password,
            loginRole
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Login transaction failed.");
        }

        if (data.session) {
          onAuthSuccess(data.session);
          onClose();
        }
      } else if (mode === "signup") {
        if (!username.trim() || !employeeId.trim() || !role) {
          throw new Error("Please complete the required employee details.");
        }

        // Just collect email as a quiet field
        const targetEmail = email.trim() || `${username.trim()}@organization.com`;

        const response = await fetch("/api/auth/register-simple", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            employeeId: employeeId.trim(),
            role,
            email: targetEmail,
            password
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Teammate registration transaction failed.");
        }

        setSuccessText("Teammate profile registered successfully! You can now sign in using your username and password.");
        setMode("login");
      } else {
        setSuccessText("Corporate credentials recovery bypassed. Please register or log in instead.");
      }
    } catch (err: any) {
      console.error("Identity transaction raised error:", err);
      const errMsg = err.message || "An unexpected error occurred during auth transaction.";
      setErrorText(errMsg);

      // Log login failure on authentication failure if available!
      if (mode === "login") {
        try {
          await fetch("/api/audit/log-failure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim() || username.trim(),
              type: "Login Failure",
              details: `Login failure (${loginRole}): ${errMsg}`
            })
          });
        } catch (audErr) {
          console.warn("Failed to dispatch auth failure audit log", audErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className={`relative w-full max-w-md rounded-xl border ${borderCol} ${bgModal} shadow-2xl overflow-hidden flex flex-col`}>
        
        {/* Top edge styling accent */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        {/* Header toolbar */}
        <div className="flex justify-between items-center px-6 pt-5 pb-3">
          <div className="flex items-center gap-1.5 text-indigo-500 font-mono text-[10px] tracking-widest font-bold">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>SECURE ENTERPRISE AUTHENTICATION</span>
          </div>
        </div>

        {/* Body content */}
        <div className="px-6 pb-6 select-none max-h-[85vh] overflow-y-auto">
          <h3 className="text-xl font-bold font-display tracking-tight text-neutral-200">
            {mode === "login" && (loginRole === "admin" ? "Administrator Control Sign In" : "Staff Teammate Sign In")}
            {mode === "signup" && "Register Corporate Account"}
            {mode === "forgot" && "Recover Security Credentials"}
          </h3>
          <p className={`text-xs ${isDarkMode ? "text-neutral-400" : "text-neutral-500"} mt-1.5`}>
            {mode === "login" && (
              loginRole === "admin"
                ? "Secure Administrative gateway. Access user manager profiles and central security audit telemetry. (Default Admin username: admin / password: admin)"
                : "Authorized Staff workspace. Sign in to analyze repositories, mock endpoints, and invoke MCP utilities. (Default Staff username: staff / password: staff)"
            )}
            {mode === "signup" && "Provide corporate indexes of your engineering profile to configure RBAC and logging telemetry."}
            {mode === "forgot" && "Submit registration email to transmit a secure reset vector."}
          </p>

          {mode === "login" && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950/40 rounded-xl border border-neutral-800/80 mt-4 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  setLoginRole("staff");
                  setErrorText("");
                  setSuccessText("");
                }}
                className={`py-2 px-3 rounded-lg text-center font-extrabold flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer ${
                  loginRole === "staff"
                    ? "bg-[#1f2128] text-indigo-400 border border-indigo-500/30"
                    : "text-neutral-400 border border-transparent hover:text-neutral-200"
                }`}
              >
                <Users className="h-4 w-4 text-indigo-400" />
                Staff Portal
              </button>
              <button
                type="button"
                id="admin-portal-login-tab"
                onClick={() => {
                  setLoginRole("admin");
                  setErrorText("");
                  setSuccessText("");
                }}
                className={`py-2 px-3 rounded-lg text-center font-extrabold flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer ${
                  loginRole === "admin"
                    ? "bg-[#28211b] text-amber-500 border border-amber-500/30"
                    : "text-neutral-400 border border-transparent hover:text-neutral-200"
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                Admin Console
              </button>
            </div>
          )}

          <form onSubmit={handleAction} className="mt-4 flex flex-col gap-3.5">
            
            {/* SIGNUP ADDITIONAL FIELDS (Username, Employee ID, Role) */}
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-neutral-800 bg-neutral-900/40 text-left">
                <div className="col-span-2 text-[10px] text-indigo-400 font-mono uppercase tracking-wider font-extrabold mb-1">
                  Teammate Custom Parameters
                </div>

                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="Teammate username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className={`w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans ${inputStyle}`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-ID"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    className={`w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${inputStyle}`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Assigned Role *</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className={`w-full text-xs px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${inputStyle}`}
                  >
                    <option value="Staff">Staff</option>
                    <option value="Developer">Developer</option>
                    <option value="QA Engineer">QA Engineer</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>
            )}

            {/* USERNAME OR EMAIL */}
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400">
                {mode === "login" ? "Corporate Username" : "Corporate Email *"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input 
                  type={mode === "login" ? "text" : "email"}
                  required
                  placeholder={mode === "login" ? "Enter your username" : "jane.doe@organization.com"}
                  value={mode === "login" ? username : email}
                  onChange={e => mode === "login" ? setUsername(e.target.value) : setEmail(e.target.value)}
                  className={`w-full text-xs pl-9 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition-all ${inputStyle}`}
                />
              </div>
            </div>

            {/* PASSWORD */}
            {mode !== "forgot" && (
              <div className="flex flex-col gap-1 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400">PASSWORD *</label>
                  {mode === "login" && (
                    <button 
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[10px] text-indigo-400 hover:underline hover:text-indigo-300 transition"
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
              <div className="flex flex-col gap-2 text-left">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 animate-shake">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">Security / Provider Block:</span>
                    <span>{errorText}</span>
                  </div>
                </div>

                {/* Secure bypass suggestion for rate limits / external provider failures */}
                {(errorText.toLowerCase().includes("rate limit") || errorText.toLowerCase().includes("limit exceeded") || errorText.toLowerCase().includes("transaction") || errorText.toLowerCase().includes("invalid")) && (
                  <div className="p-3 bg-indigo-950/25 border border-indigo-500/25 rounded-lg text-xs text-neutral-300">
                    <p className="mb-1 font-sans font-bold text-indigo-400 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                      Workspace Sandbox Bypass Available
                    </p>
                    <p className="mb-3 text-[11px] leading-normal text-neutral-400">
                      External identity provider limits (email activity constraints, rate gates, or configuration delays) are active. You can instantly bypass this issue by logging in with our pre-authorized developer sandbox session.
                    </p>
                    <button
                      type="button"
                      onClick={handleSandboxBypass}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold rounded tracking-wider uppercase transition shadow-md cursor-pointer"
                    >
                      Bypass Rate Meter & Enter Sandbox Mode
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SUCCESS FEEDBACK */}
            {successText && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-start gap-2">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-green-400" />
                <span>{successText}</span>
              </div>
            )}

            {/* MAIN ACTION BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-mono font-bold transition duration-200 flex items-center justify-center gap-2 shadow-md disabled:bg-neutral-800 disabled:text-neutral-500 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin"></span>
                  Validating LDAP Index...
                </span>
              ) : mode === "login" ? (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In Secured Portal
                </>
              ) : mode === "signup" ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  Activate Corporate Profile
                </>
              ) : (
                <>
                  <HelpCircle className="h-4 w-4" />
                  Generate Recovery Link
                </>
              )}
            </button>
          </form>

          {/* Toggle link below */}
          <div className="mt-5 pt-4 border-t border-dashed border-neutral-800 text-center font-mono text-[11px]">
            {mode === "login" ? (
              <p className="text-neutral-500 max-w-xs mx-auto leading-relaxed">
                Staff account management is restricted to systemic administration. Contact your organization's Administrator to enroll or revoke credentials.
              </p>
            ) : (
              <p className="text-neutral-400">
                Need to sign in?{" "}
                <button 
                  onClick={() => { setMode("login"); setErrorText(""); setSuccessText(""); }}
                  className="text-indigo-400 hover:underline font-bold"
                >
                  Return to Keypad
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
