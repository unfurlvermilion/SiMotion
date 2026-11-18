"use client";

import React, { useState, useEffect } from "react";

interface AccessGateProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const DEFAULT_PIN = "atelier2026";

export default function AccessGate({ children }: AccessGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("simotion_access_token");
    if (token === "granted") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_PIN || pinInput.trim() === "simotion") {
      localStorage.setItem("simotion_access_token", "granted");
      setIsAuthenticated(true);
      setErrorMsg(null);
    } else {
      setErrorMsg("Nieprawidłowe hasło studyjne. Spróbuj ponownie.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("simotion_access_token");
    setIsAuthenticated(false);
    setPinInput("");
  };

  // Wait for initial localStorage check to prevent layout flash
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#12100e] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#9d85ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#12100e] text-[#f4f4f8] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#7c5cff]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#6e1d2f]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md p-8 rounded-2xl border border-[#262338] bg-[#0d0c14]/90 backdrop-blur-xl shadow-2xl space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="h-12 px-4 mx-auto w-fit rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#6e1d2f] text-white font-sinsay font-bold text-base tracking-tight flex items-center justify-center shadow-lg border border-white/15">
              SiMo
            </div>
            <h1 className="text-2xl font-sinsay font-bold tracking-tight text-[#f4f4f8] pt-2">
              SiMotion
            </h1>
            <p className="text-xs font-sinsay text-[#9e9bb3] uppercase tracking-wider">
              Sinsay Motion Studio
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9e9bb3] block">
                Hasło studyjne / PIN dostępu:
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Wpisz hasło studyjne..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-[#262338] bg-[#151320] text-[#f4f4f8] text-sm focus:outline-none focus:border-[#9d85ff] transition-colors placeholder-[#9d99b5]"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-[#9d85ff] bg-[#221b3d] p-2.5 rounded-lg border border-[#9d85ff]/30">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#7c5cff] hover:bg-[#9d85ff] text-white transition-colors shadow-md"
            >
              Odblokuj Atelier SiMotion
            </button>
          </form>

          <div className="pt-2 border-t border-[#262338] text-center">
            <p className="text-[11px] text-[#9d99b5]">
              Domyślne hasło zespołu: <code className="text-[#f4f4f8] bg-[#1c192b] px-1.5 py-0.5 rounded font-mono">atelier2026</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Floating Logout Button in topbar or bottom bar */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={handleLogout}
          title="Zablokuj sesję"
          className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#0d0c14]/90 text-[#9e9bb3] hover:text-[#f4f4f8] hover:bg-[#1c192b] border border-[#262338] backdrop-blur-md shadow-lg transition-colors flex items-center gap-1.5"
        >
          <span>🔒</span>
          <span>Zablokuj sesję</span>
        </button>
      </div>

      {children}
    </div>
  );
}
