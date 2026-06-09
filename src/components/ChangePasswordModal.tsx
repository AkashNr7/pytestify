import React, { useState } from "react";
import { Lock, Check, ShieldAlert, X, Eye, EyeOff } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  isDarkMode: boolean;
}

export default function ChangePasswordModal({ isOpen, onClose, session, isDarkMode }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  if (!isOpen) return null;

  const bgStyle = isDarkMode ? "bg-[#18191c] text-neutral-100 border-neutral-800" : "bg-white text-neutral-800 border-neutral-200";
  const inputStyle = isDarkMode ? "bg-[#1f2023] border-neutral-800 text-white" : "bg-neutral-50 border-neutral-300 text-neutral-800";

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    if (newPassword.length < 4) {
      setErrorText("Password must be at least 4 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorText("The confirmation password does not match your new password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update security credentials.");
      }

      setSuccessText("Your teammate password has been updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        onClose();
        setSuccessText("");
      }, 2500);
    } catch (err: any) {
      setErrorText(err.message || "Credential mutation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-sm rounded-xl border p-6 shadow-xl ${bgStyle} transform transition-all`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-500 animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">Update Credentials</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800/20 rounded transition text-neutral-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorText && (
          <div className="mb-4 p-2 text-[11px] font-mono bg-red-500/10 border border-red-500/25 rounded-md text-red-400 flex items-start gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}

        {successText && (
          <div className="mb-4 p-2 text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/25 rounded-md text-emerald-400 flex items-start gap-1.5">
            <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{successText}</span>
          </div>
        )}

        <form onSubmit={handleAction} className="flex flex-col gap-3.5">
          <p className="text-[10px] text-neutral-400 font-mono leading-relaxed mb-1">
            Re-enter your previous password and configure a new one below to secure your workspace clearance.
          </p>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">CURRENT PASSWORD</label>
            <div className="relative">
              <input 
                type={showCurrent ? "text" : "password"}
                required
                placeholder="Enter current password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${inputStyle}`}
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)} 
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
              >
                {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">NEW PASSWORD</label>
            <div className="relative">
              <input 
                type={showNew ? "text" : "password"}
                required
                placeholder="New security key"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${inputStyle}`}
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)} 
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
              >
                {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-neutral-400">CONFIRM NEW PASSWORD</label>
            <input 
              type="password"
              required
              placeholder="Confirm new security key"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${inputStyle}`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-xs font-mono font-bold tracking-wider rounded-lg bg-[#2563eb] hover:bg-blue-600 text-white transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? "MUTATING SECURITY KEY..." : "SAVE SECURITY KEY"}
          </button>
        </form>
      </div>
    </div>
  );
}
