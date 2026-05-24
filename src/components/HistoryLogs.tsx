import React from "react";
import { SavedNotification } from "../types";
import { History, Trash2, Calendar, Shield, ExternalLink, RefreshCw } from "lucide-react";

interface HistoryLogsProps {
  logs: SavedNotification[];
  onClear: () => void;
  onRestore: (log: SavedNotification) => void;
  viewMode?: "user" | "dev";
}

export default function HistoryLogs({ logs, onClear, onRestore, viewMode = "user" }: HistoryLogsProps) {
  return (
    <div id="history-logs-card" className="bg-white rounded-3xl border border-[#f5dedb] shadow-xs p-6 select-text">
      <div className="flex justify-between items-center mb-4 border-b border-[#faf0ee] pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
            <History className="w-5 h-5 text-clara-pink-600" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-[#543b35] text-base">Histórico de Prognósticos</h3>
            <p className="text-xs text-gray-400">Notificações geradas nesta sessão ({logs.length})</p>
          </div>
        </div>
        
        {logs.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 transition-colors px-2 py-1 rounded-md hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center border border-dashed border-[#faeae8] rounded-2xl bg-[#fffdfd]">
          <History className="w-9 h-9 text-rose-200 mb-2" />
          <p className="text-xs font-semibold text-[#8e7471]">Histórico Vazio</p>
          <p className="text-[10px] text-gray-400 mt-0.5 max-w-[200px]">Suas recomendações e previsões enviadas pela Clara ficarão salvas aqui para acompanhamento diário do seu ciclo.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto scrollbar pr-1">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className="p-3.5 rounded-2xl border border-[#fae7e4] bg-[#fffbfb] flex flex-col gap-2 hover:border-clara-pink-200 transition-all hover:bg-white"
            >
              {/* Header inside log item */}
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[#543b35]">{log.input.nome}</span>
                  <span className="text-[10px] bg-clara-pink-50 text-clara-pink-600 px-1.5 py-0.5 rounded-full font-medium capitalize">
                    {log.input.objetivo === "engravidar" ? "👶 Engravidar" : "🗓️ Acompanhar"}
                  </span>
                  <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full font-normal">
                    {log.input.status_do_dia}
                  </span>
                </div>
                <span className="text-[9px] text-gray-400 font-mono">
                  {log.timestamp}
                </span>
              </div>

              {/* Saved message text */}
              <p className="text-xs text-gray-700 italic border-l-2 border-clara-pink-100 pl-2 leading-relaxed">
                "{log.output.texto_notificacao}"
              </p>

              {/* Indicators */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-dashed border-[#faeae7] mt-1">
                <div className="flex items-center gap-2">
                  {viewMode === "dev" ? (
                    <>
                      <span className="flex items-center gap-0.5">
                        <Shield className="w-3 h-3 text-emerald-500" /> android=ok
                      </span>
                      <span>{log.output.texto_notificacao.length} chars</span>
                      {log.isFallback && (
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1 rounded bg-slate-100 scale-95 uppercase">
                          Simulado
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" /> Alerta Push Sincronizado
                    </span>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => onRestore(log)}
                  className="text-clara-pink-600 hover:text-clara-pink-700 hover:underline flex items-center gap-0.5 font-semibold text-[10px]"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Reaplicar dados
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
