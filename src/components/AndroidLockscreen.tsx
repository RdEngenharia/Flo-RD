import React, { useState } from "react";
import { ClaraResponsePayload, UserScenario } from "../types";
import { CheckCircle2, AlertTriangle, ShieldCheck, Wifi, Battery, Bell, Smartphone, Sparkles, MessageSquare, ListCollapse, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AndroidLockscreenProps {
  payload: ClaraResponsePayload | null;
  scenarioInput: UserScenario;
  isGenerating: boolean;
}

export default function AndroidLockscreen({ payload, scenarioInput, isGenerating }: AndroidLockscreenProps) {
  const [viewMode, setViewMode] = useState<"lockscreen" | "drawer">("lockscreen");
  
  // Current date formatting for display
  const today = new Date();
  const formatTime = () => {
    return today.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };
  
  const formatDateLong = () => {
    return today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  };

  const textLength = payload?.texto_notificacao?.length || 0;
  const isOverlimit = textLength > 120;
  
  return (
    <div id="android-simulator-card" className="bg-white rounded-3xl border border-[#f5dedb] shadow-xl overflow-hidden flex flex-col h-full min-h-[580px]">
      {/* Simulator view controls */}
      <div className="p-4 border-b border-[#fbecfa] bg-[#fff9f9] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-clara-pink-500" />
          <span className="font-display font-semibold text-[#543b35] text-sm">Sua Notificação no Celular</span>
        </div>
        
        <div className="flex bg-[#f1e6e4] p-1 rounded-lg gap-1">
          <button
            id="view-lockscreen-btn"
            onClick={() => setViewMode("lockscreen")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              viewMode === "lockscreen"
                ? "bg-white text-clara-pink-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Lockscreen
          </button>
          <button
            id="view-drawer-btn"
            onClick={() => setViewMode("drawer")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
              viewMode === "drawer"
                ? "bg-white text-clara-pink-600 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ListCollapse className="w-3.5 h-3.5" />
            Notification Tray
          </button>
        </div>
      </div>

      {/* Main smartphone visual wrapper */}
      <div className="flex-1 p-6 flex flex-col justify-center items-center bg-radial from-[#fffcfb] to-[#faf1ee]">
        {/* Curved Device Frame */}
        <div className="relative w-full max-w-[310px] aspect-[9/18.5] bg-[#120f0e] rounded-[44px] p-2.5 shadow-2xl border-4 border-[#322c2b] ring-8 ring-[#1e1918]/20 flex flex-col overflow-hidden">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-2xl z-40 flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-[#0a0a0a] rounded-full border border-gray-900 absolute right-3"></div>
          </div>

          {/* Screen Content */}
          <div 
            className={`flex-1 rounded-[34px] p-4 flex flex-col relative overflow-hidden transition-all duration-700 ${
              viewMode === "lockscreen" 
                ? "bg-cover bg-center bg-[#ea9b93] bg-linear-to-b from-[#e7929a] via-[#f7cbd1] to-[#eedfdb]" // soft sunset female health theme
                : "bg-neutral-900 text-white"
            }`}
          >
            {/* Soft background glow on lockscreen */}
            {viewMode === "lockscreen" && (
              <div className="absolute inset-0 bg-[#e792a9]/10 backdrop-blur-[2px]"></div>
            )}

            {/* Android Status Bar */}
            <div className="flex justify-between items-center text-xs px-2 z-20 relative font-medium overflow-hidden">
              <span className={viewMode === "lockscreen" ? "text-rose-950" : "text-gray-300"}>{formatTime()}</span>
              <div className={`flex items-center gap-1.5 ${viewMode === "lockscreen" ? "text-rose-950" : "text-gray-300"}`}>
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-[10px] scale-90">LTE</span>
                <Battery className="w-4 h-4 scale-y-95" />
              </div>
            </div>

            {/* Lockscreen clock and widgets */}
            <AnimatePresence mode="wait">
              {viewMode === "lockscreen" ? (
                <motion.div 
                  key="lock-info"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 text-center z-10 select-none cursor-default"
                >
                  <h1 className="text-4xl font-display font-light text-rose-950 leading-tight tracking-tight">
                    {formatTime()}
                  </h1>
                  <p className="text-[10px] uppercase tracking-widest text-[#7c4d43] font-medium mt-1">
                    {formatDateLong()}
                  </p>
                  <p className="text-[9px] text-[#8e5a52]/80 font-medium bg-white/20 px-2 py-0.5 rounded-full inline-block mt-2 backdrop-blur-xs">
                    🧘🏾‍♀️ Clara Predição Ativa
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="drawer-info"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 flex items-center justify-between border-b border-white/10 pb-2 mb-2 z-10"
                >
                  <span className="text-[11px] font-semibold text-gray-400">Notificações Recentes</span>
                  <span className="text-[10px] text-clara-pink-200 cursor-pointer hover:underline">Limpar tudo</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notification Slot Container */}
            <div className="flex-1 flex flex-col justify-start pt-6 z-10 min-h-0 relative">
              <AnimatePresence mode="popLayout">
                {isGenerating ? (
                  <motion.div 
                    key="generating-spinner"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`p-4 rounded-2xl shadow-md border ${
                      viewMode === "lockscreen"
                        ? "bg-white/85 text-gray-800 border-white/50 backdrop-blur-md"
                        : "bg-[#1f1e1e] border-neutral-800 text-gray-200"
                    } flex flex-col items-center justify-center text-center gap-3`}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-clara-pink-100 border-t-clara-pink-600 animate-spin"></div>
                      <Sparkles className="w-3.5 h-3.5 text-clara-pink-500 absolute animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-clara-pink-600 animate-pulse">Clara está escrevendo...</p>
                      <p className="text-[10px] text-gray-500 mt-1">Sintonizando com a biologia de {scenarioInput.nome || "usuária"}</p>
                    </div>
                  </motion.div>
                ) : payload ? (
                  <motion.div
                    key="active-notification"
                    initial={{ opacity: 0, y: 30, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className={`w-full p-3.5 rounded-[22px] shadow-lg border relative flex flex-col gap-1.5 transition-all outline-hidden ${
                      viewMode === "lockscreen"
                        ? "bg-white/92 border-white/80 backdrop-blur-md text-gray-950"
                        : "bg-[#2c2b2b] border-[#363535] text-white"
                    }`}
                  >
                    {/* App icon & label row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-linear-to-tr from-[#f43f5e] to-[#fb923c] flex items-center justify-center shadow-xs">
                          <span className="text-[10px] text-white font-display font-black">C</span>
                        </div>
                        <span className={`text-[10px] font-bold tracking-tight ${viewMode === "lockscreen" ? "text-gray-700" : "text-gray-300"}`}>
                          CLARA • AGORA
                        </span>
                      </div>
                    </div>

                    {/* Notification content title and body */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <h4 className="text-[11px] font-bold">
                          {scenarioInput.objetivo === "engravidar" ? "Janela Fértil e Biologia ✨" : "Saúde e Bem-Estar 🌸"}
                        </h4>
                      </div>
                      <p className={`text-[10.5px] leading-relaxed font-normal whitespace-pre-wrap ${viewMode === "lockscreen" ? "text-gray-800" : "text-gray-200"}`}>
                        {payload.texto_notificacao}
                      </p>
                    </div>

                    {/* Subtle action chip */}
                    <div className={`mt-0.5 pt-1.5 border-t flex justify-end gap-2 items-center ${viewMode === "lockscreen" ? "border-gray-100" : "border-neutral-800"}`}>
                      <span className="text-[9px] font-bold text-clara-pink-600 cursor-pointer hover:underline flex items-center gap-0.5">
                        <MessageSquare className="w-2.5 h-2.5" /> Responder
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state-notif"
                    className={`p-5 rounded-2xl border border-dashed border-[#f5dedb] text-center flex flex-col items-center justify-center py-10 ${
                      viewMode === "lockscreen" ? "bg-white/40 backdrop-blur-xs" : "bg-neutral-900/50"
                    }`}
                  >
                    <Bell className="w-8 h-8 text-clara-pink-200 animate-bounce mb-2" />
                    <span className={`text-[11px] font-medium leading-normal ${viewMode === "lockscreen" ? "text-rose-950" : "text-gray-400"}`}>
                      Nenhuma notificação simulada ainda
                    </span>
                    <span className={`text-[9px] mt-1 max-w-[150px] ${viewMode === "lockscreen" ? "text-rose-900/60" : "text-gray-500"}`}>
                      Atualize seu perfil ou sintomas e clique em sintonizar para receber o alerta!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom device footer swipe line */}
            <div className={`w-28 h-1 bg-current mx-auto mt-auto rounded-full ${viewMode === "lockscreen" ? "text-rose-950/40" : "text-neutral-700"}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
