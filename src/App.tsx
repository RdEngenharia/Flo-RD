import React, { useState, useEffect } from "react";
import { UserScenario, ClaraResponsePayload, SavedNotification } from "./types";
import AndroidLockscreen from "./components/AndroidLockscreen";
import KotlinCodeGuide from "./components/KotlinCodeGuide";
import HistoryLogs from "./components/HistoryLogs";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import {
  setDoc,
  getDoc,
  getDocs,
  doc,
  collection,
  deleteDoc,
  query,
  orderBy,
  getDocFromServer
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType, activeConfig } from "./firebase";
import { 
  Sparkles, 
  Settings, 
  HelpCircle, 
  Baby, 
  Heart, 
  History, 
  Clipboard, 
  Copy, 
  Check, 
  AlertCircle, 
  Send,
  Droplets,
  Flower2,
  Info,
  ShieldCheck,
  Code2,
  Lock,
  UserCheck,
  Mail,
  KeyRound,
  LogOut,
  Sliders,
  Database,
  Terminal,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Inline preset options in case the fetch fails, ensuring resilience
const DEFAULT_PRESETS: UserScenario[] = [
  {
    nome: "Mariana",
    objetivo: "engravidar",
    status_do_dia: "Janela Fértil",
    historico_infeccao: false,
    label: "👶 Mariana (Engravidar • Janela Fértil)"
  },
  {
    nome: "Camila",
    objetivo: "engravidar",
    status_do_dia: "Dia da Ovulação (Pico)",
    historico_infeccao: false,
    label: "❤️ Camila (Engravidar • Pico da Ovulação)"
  },
  {
    nome: "Carolina",
    objetivo: "acompanhar",
    status_do_dia: "Pré-Menstrual",
    historico_infeccao: true,
    label: "🌸 Carolina (Infecções Recorrentes • Fase Pré-Menstrual)"
  },
  {
    id: "scen-4",
    nome: "Juliana",
    objetivo: "acompanhar",
    status_do_dia: "Pós-Menstrual",
    historico_infeccao: true,
    label: "✨ Juliana (Infecções Recorrentes • Fase Pós-Menstrual)"
  },
  {
    nome: "Beatriz",
    objetivo: "acompanhar",
    status_do_dia: "Falta 3 Dias para o Período",
    historico_infeccao: false,
    label: "☕ Beatriz (Apenas Acompanhar • Falta 3 Dias para Período)"
  },
  {
    nome: "Lorena",
    objetivo: "acompanhar",
    status_do_dia: "Fase Lútea (Falta 1 Dia)",
    historico_infeccao: false,
    label: "🍫 Lorena (Apenas Acompanhar • Falta 1 Dia para Período)"
  }
];

const PHASE_SUGGESTIONS = [
  "Janela Fértil",
  "Dia da Ovulação (Pico)",
  "Pré-Menstrual",
  "Pós-Menstrual",
  "Menstruando (Fase Menstrual)",
  "Fase Folicular",
  "Fase Lútea"
];

export default function App() {
  // Input states
  const [nome, setNome] = useState("Mariana");
  const [objetivo, setObjetivo] = useState<"engravidar" | "acompanhar">("engravidar");
  const [statusDoDia, setStatusDoDia] = useState("Janela Fértil");
  const [customStatus, setCustomStatus] = useState("");
  const [isCustomStatus, setIsCustomStatus] = useState(false);
  const [historicoInfeccao, setHistoricoInfeccao] = useState(false);

  // App state
  const [presets, setPresets] = useState<UserScenario[]>(DEFAULT_PRESETS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiResult, setApiResult] = useState<ClaraResponsePayload | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // History logs
  const [logs, setLogs] = useState<SavedNotification[]>([]);
  const [copiedJSON, setCopiedJSON] = useState(false);

  // Firebase Authentication States
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Rule offline fallback detection
  const projectID = activeConfig.projectId;

  // Validate server-test connection on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Clara Security: Dynamic connection test success.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Clara Security: The client appears to be offline.", error);
        }
      }
    }
    testConnection();
  }, []);

  // Monitor Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        // Authenticated users pull from Firestore secure records
        fetchLatestUserProfile(currentUser);
        fetchHistoryLogs(currentUser.uid);
      } else {
        // Reset logs of previous user
        setLogs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch registered user profile
  const fetchLatestUserProfile = async (currentUser: User) => {
    const docRef = doc(db, "users", currentUser.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNome(data.nome || "");
        setObjetivo((data.objetivo as "engravidar" | "acompanhar") || "engravidar");
        setHistoricoInfeccao(!!data.historico_infeccao);
        
        const cycle = data.status_do_dia || "Janela Fértil";
        if (PHASE_SUGGESTIONS.includes(cycle)) {
          setStatusDoDia(cycle);
          setIsCustomStatus(false);
        } else {
          setStatusDoDia("custom");
          setCustomStatus(cycle);
          setIsCustomStatus(true);
        }
        setAuthSuccessMessage(`Perfil de ${data.nome || "usuária"} carregado do banco Firestore! ✨`);
        setTimeout(() => setAuthSuccessMessage(null), 4000);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
    }
  };

  // Fetch logs of user notifications
  const fetchHistoryLogs = async (uid: string) => {
    const pathForRead = `users/${uid}/notifications`;
    try {
      const q = query(collection(db, "users", uid, "notifications"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const loadedLogs: SavedNotification[] = [];
      snapshot.forEach((snapDoc) => {
        const data = snapDoc.data();
        loadedLogs.push({
          id: snapDoc.id,
          timestamp: data.timestamp,
          input: {
            nome: data.nome,
            objetivo: data.objetivo as "engravidar" | "acompanhar",
            status_do_dia: data.status_do_dia,
            historico_infeccao: data.historico_infeccao
          },
          output: {
            verificar_permissao_android: data.verificar_permissao_android,
            canal_notificacao_id: data.canal_notificacao_id,
            texto_notificacao: data.texto_notificacao
          },
          isFallback: !!data.isFallback
        });
      });
      setLogs(loadedLogs);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, pathForRead);
    }
  };

  // Load backend scenarios configurations
  useEffect(() => {
    fetch("/api/scenarios")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPresets(data);
        }
      })
      .catch((err) => {
        console.warn("Clara UI: Failed to fetch preset scenarios, using default presets.", err);
      });
  }, []);

  // Update selection based on Preset click
  const handleApplyPreset = (preset: UserScenario) => {
    setNome(preset.nome);
    setObjetivo(preset.objetivo);
    setHistoricoInfeccao(preset.historico_infeccao);
    
    // Check if status is custom or in suggestions
    if (PHASE_SUGGESTIONS.includes(preset.status_do_dia)) {
      setStatusDoDia(preset.status_do_dia);
      setIsCustomStatus(false);
    } else {
      setStatusDoDia("custom");
      setCustomStatus(preset.status_do_dia);
      setIsCustomStatus(true);
    }
  };

  // Register user in Firebase Authentication
  const handleAuthRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMessage(null);
    if (!authEmail || !authPassword) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      const newUser = userCredential.user;
      
      // Bootstrap basic profile in Firestore securely
      const pathForWrite = `users/${newUser.uid}`;
      try {
        await setDoc(doc(db, "users", newUser.uid), {
          userId: newUser.uid,
          nome: nome,
          objetivo: objetivo,
          status_do_dia: isCustomStatus ? customStatus : statusDoDia,
          historico_infeccao: historicoInfeccao
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, pathForWrite);
      }
      
      setAuthSuccessMessage("Conta cadastrada e logada no Firebase com sucesso! 🛡️");
      setAuthEmail("");
      setAuthPassword("");
    } catch (err: any) {
      console.error(err);
      setAuthError(translateAuthError(err.code || err.message));
    }
  };

  // Sign in user in Firebase Authentication
  const handleAuthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMessage(null);
    if (!authEmail || !authPassword) return;

    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setAuthSuccessMessage("Conexão efetuada com sucesso! Recuperando seu perfil de saúde...");
      setAuthEmail("");
      setAuthPassword("");
    } catch (err: any) {
      console.error(err);
      setAuthError(translateAuthError(err.code || err.message));
    }
  };

  // Sign out user
  const handleAuthLogout = async () => {
    setAuthError(null);
    setAuthSuccessMessage(null);
    try {
      await signOut(auth);
      setAuthSuccessMessage("Você saiu com segurança da sua conta.");
      setTimeout(() => setAuthSuccessMessage(null), 3000);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Save current frontstate parameters as user profile
  const handleSaveUserProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    setAuthError(null);
    setAuthSuccessMessage(null);

    const activeStatus = isCustomStatus ? (customStatus.trim() || "Fase Geral") : statusDoDia;
    const pathForWrite = `users/${user.uid}`;
    
    try {
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        nome: nome.trim(),
        objetivo: objetivo,
        status_do_dia: activeStatus,
        historico_infeccao: historicoInfeccao
      });
      setAuthSuccessMessage("Perfil de ciclo salvo com sucesso no Firestore! 🌸💾");
      setTimeout(() => setAuthSuccessMessage(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, pathForWrite);
    } finally {
      setProfileSaving(false);
    }
  };

  // Translate basic auth error codes to pt-BR
  const translateAuthError = (code: string) => {
    if (code.includes("auth/email-already-in-use")) return "Este e-mail já está sendo utilizado por outro usuário.";
    if (code.includes("auth/weak-password")) return "A senha digitada é muito fraca (mínimo de 6 caracteres).";
    if (code.includes("auth/invalid-email")) return "Formato de e-mail inválido.";
    if (code.includes("auth/user-not-found") || code.includes("auth/wrong-password") || code.includes("auth/invalid-credential")) {
      return "Credenciais de acesso incorretas. Verifique seu e-mail/senha ou crie uma conta caso seja seu primeiro acesso.";
    }
    return code;
  };

  // Generate predicting push notification from Clara (API call)
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setIsGenerating(true);
    setApiError(null);

    const activeStatus = isCustomStatus ? (customStatus.trim() || "Fase Geral") : statusDoDia;

    const payload: UserScenario = {
      nome: nome.trim(),
      objetivo,
      status_do_dia: activeStatus,
      historico_infeccao: historicoInfeccao
    };

    try {
      const response = await fetch("/api/generate-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro na API (${response.status})`);
      }

      const result = await response.json();
      
      if (result.data) {
        setApiResult(result.data);
        setIsFallbackMode(!!result.fallback);
        
        const newLogId = `log-${Date.now()}`;
        const newLog: SavedNotification = {
          id: newLogId,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          input: { ...payload },
          output: result.data,
          isFallback: !!result.fallback
        };

        // If authenticated on Firebase flow, write log dynamically to collection
        if (user) {
          const pathForWrite = `users/${user.uid}/notifications/${newLogId}`;
          try {
            await setDoc(doc(db, "users", user.uid, "notifications", newLogId), {
              id: newLogId,
              userId: user.uid,
              timestamp: newLog.timestamp,
              nome: payload.nome,
              objetivo: payload.objetivo,
              status_do_dia: payload.status_do_dia,
              historico_infeccao: payload.historico_infeccao,
              texto_notificacao: result.data.texto_notificacao,
              canal_notificacao_id: result.data.canal_notificacao_id,
              verificar_permissao_android: result.data.verificar_permissao_android,
              isFallback: !!result.fallback
            });
            // Reload logs in real-time
            fetchHistoryLogs(user.uid);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, pathForWrite);
          }
        } else {
          // If guest, store in local states
          setLogs(prev => [newLog, ...prev]);
        }
      } else {
        throw new Error("Formato de resposta inválido do motor");
      }
    } catch (err: any) {
      console.error("Clara UI: Error calling generate endpoint", err);
      setApiError(err.message || "Erro desconhecido");
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear log logs dynamically
  const handleClearHistory = async () => {
    if (user) {
      const pathForDelete = `users/${user.uid}/notifications`;
      try {
        const q = query(collection(db, "users", user.uid, "notifications"));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map((docSnap) => 
          deleteDoc(doc(db, "users", user.uid, "notifications", docSnap.id))
        );
        await Promise.all(deletePromises);
        setLogs([]);
        setAuthSuccessMessage("Histórico deletado no Firestore com sucesso! ✨");
        setTimeout(() => setAuthSuccessMessage(null), 3000);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, pathForDelete);
      }
    } else {
      setLogs([]);
    }
  };

  // Copy raw JSON to clipboard
  const handleCopyJSON = () => {
    if (!apiResult) return;
    const jsonStr = JSON.stringify(apiResult, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  // Restore previous data from a history log
  const handleRestoreLog = (log: SavedNotification) => {
    setNome(log.input.nome);
    setObjetivo(log.input.objetivo);
    setHistoricoInfeccao(log.input.historico_infeccao);
    
    if (PHASE_SUGGESTIONS.includes(log.input.status_do_dia)) {
      setStatusDoDia(log.input.status_do_dia);
      setIsCustomStatus(false);
    } else {
      setStatusDoDia("custom");
      setCustomStatus(log.input.status_do_dia);
      setIsCustomStatus(true);
    }
    
    setApiResult(log.output);
    setIsFallbackMode(log.isFallback);
  };



  const getCleanJSONString = () => {
    if (!apiResult) return "{}";
    return JSON.stringify(apiResult, null, 2);
  };

  return (
    <div className="min-h-screen bg-[#faf4f2] text-[#2c2321] transition-all flex flex-col font-sans selection:bg-clara-pink-100 selection:text-clara-pink-600">
      
      {/* Elegante Top Header bar */}
      <header id="app-header" className="bg-white border-b border-[#f3e1dd] z-30 sticky top-0 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-clara-pink-500 to-clara-peach-500 flex items-center justify-center shadow-md shadow-clara-pink-500/10 animate-pulse">
              <Flower2 className="w-5.5 h-5.5 text-white animate-float" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg tracking-tight text-[#3c2a26]">Clara Saúde</h1>
                <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90">
                  Nuvem Protegida ☁️
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">Sua assistente integrada de hormonização e saúde biológica</p>
            </div>
          </div>

          {/* Key Status Indicators */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              {/* Cloud Status Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                user 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                  : "bg-amber-50 border-amber-100 text-amber-700"
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{user ? `Protegido: ${user.email}` : "Modo Visitante (Local)"}</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col gap-8">
        
        {/* Intro Alert: Explaining the scope & tone rules carefully */}
        <div id="intro-alert" className="bg-white rounded-3xl p-5 border border-[#eedadb] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-3.5 items-start">
            <div className="p-3.5 rounded-2xl bg-[#fff5f6] text-clara-pink-600 shrink-0">
              <Sparkles className="w-5 h-5 animate-spin duration-3000" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-[#543b35] text-sm md:text-base">
                Sua Assistente de Saúde e Ciclos Hormonais
              </h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-4xl">
                Bem-vinda à Clara Saúde. Faça login em sua conta individual segura para salvar suas metas, registrar sintomas e acompanhar alertas preditivos hormonais gerados sob medida para o seu corpo.
              </p>
            </div>
          </div>
          
          <div className="flex bg-[#fff9f9] border border-[#fce4e5] p-2 rounded-xl text-[11px] text-[#935e58] shrink-0 font-medium font-mono">
            Sintonização Hormonal Segura
          </div>
        </div>

        {/* Quick status message alerts */}
        <AnimatePresence>
          {authSuccessMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>{authSuccessMessage}</span>
            </motion.div>
          )}
          {authError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 animate-bounce" />
              <span>{authError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE: Inputs / Presets (7 cols on lg) */}
          <section className="lg:col-span-7 flex flex-col gap-6" id="input-control-section">
            
            {/* AUTHENTICATION PORTAL (Login & Password input form) */}
            <div id="auth-portal-card" className="bg-white rounded-3xl border border-[#f5dedb] shadow-xs p-6 flex flex-col gap-5 relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffeff1]/50 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start border-b border-[#fdf3f0] pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-clara-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-[#543b35] text-sm">Sua Conta Clara (Firebase Auth)</h3>
                    <p className="text-[11px] text-gray-400">Sincronize perfil e histórico em múltiplos dispositivos</p>
                  </div>
                </div>

                {user && (
                  <button
                    onClick={handleAuthLogout}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg transition-all border border-rose-100 hover:bg-rose-100"
                  >
                    <LogOut className="w-3 h-3" />
                    Sair da Conta
                  </button>
                )}
              </div>

              {authLoading ? (
                <div className="py-6 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-6 h-6 border-2 border-clara-pink-100 border-t-clara-pink-600 animate-spin rounded-full"></div>
                  <span className="text-xs text-gray-400 font-medium">Verificando segurança do Firebase...</span>
                </div>
              ) : !user ? (
                <div className="flex flex-col gap-4">
                  <div className="bg-[#fffefe] p-3 rounded-2xl border border-[#fff0ee] shadow-2xs">
                    <p className="text-[11px] text-[#8e6863] leading-relaxed">
                      💡 <strong>Acesso Unificado:</strong> Digite seu e-mail e a senha desejada para entrar ou cadastrar-se na hora. Suas previsões e dados hormonais serão salvos exclusivamente e não poderão ser lidos por outros usuários.
                    </p>
                  </div>

                  <form onSubmit={isRegistering ? handleAuthRegister : handleAuthLogin} className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Email input */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[#8e6863] flex items-center gap-1">
                          <Mail className="w-3 h-3" /> E-mail da Usuária
                        </label>
                        <input
                          type="email"
                          required
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="exemplo@saude.com"
                          className="bg-[#faf5f3] px-3 py-2 rounded-xl text-xs font-medium border border-transparent focus:bg-white focus:border-clara-pink-300 outline-hidden transition-all text-gray-800"
                        />
                      </div>

                      {/* Password input */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[#8e6863] flex items-center gap-1">
                          <KeyRound className="w-3 h-3" /> Senha (min. 6 dígitos)
                        </label>
                        <input
                          type="password"
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Sua senha secreta"
                          className="bg-[#faf5f3] px-3 py-2 rounded-xl text-xs font-medium border border-transparent focus:bg-white focus:border-clara-pink-300 outline-hidden transition-all text-gray-800"
                        />
                      </div>

                    </div>

                    {/* Action buttons slider */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                      <button
                        type="submit"
                        className="w-full sm:w-auto flex-1 bg-clara-pink-600 hover:bg-clara-pink-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-colors"
                      >
                        {isRegistering ? "Confirmar Meu Cadastro 🌸" : "Entrar c/ Login e Senha 🔐"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistering(!isRegistering);
                          setAuthError(null);
                        }}
                        className="text-[11px] font-bold text-clara-pink-600 hover:underline px-3 py-2 shrink-0"
                      >
                        {isRegistering ? "Já tenho conta: Fazer Login" : "Criar uma Nova Conta Grátis"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="bg-[#f0f9ff] border border-[#e0f2fe] p-3.5 rounded-2xl flex items-start gap-2.5">
                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-900">Sessão Ativa Segura</p>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Você está autenticada no Firebase com o login: <code className="bg-white/70 px-1 py-0.5 rounded text-[10px] font-bold select-all">{user.email}</code>
                      </p>
                    </div>
                  </div>



                  {/* Profile data persistent sync actions */}
                  <div className="flex gap-2 border-t border-[#fdf3f0] pt-3">
                    <button
                      type="button"
                      disabled={profileSaving}
                      onClick={handleSaveUserProfile}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-[11px] transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-55"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      {profileSaving ? "Gravando dados..." : "Salvar Configurações de Ciclo no Perfil Firestore 💾"}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Custom Input Form */}
            <form onSubmit={handleGenerate} className="bg-white rounded-3xl border border-[#f5dedb] shadow-xs p-6 flex flex-col gap-5">
              
              <div className="flex items-center gap-1.5 pb-3 border-b border-[#fdf3f0]">
                <Settings className="w-5 h-5 text-gray-400" />
                <h3 className="font-display font-semibold text-[#543b35] text-base">Meu Perfil e Sintomas de Hoje</h3>
              </div>

              {/* Grid Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-name-input" className="text-xs font-bold text-[#5c4945] flex items-center gap-1">
                    Nome da Usuária
                  </label>
                  <input
                    id="user-name-input"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-[#faf5f3] px-3.5 py-2 rounded-xl text-xs font-medium border border-transparent focus:bg-white focus:border-clara-pink-300 outline-hidden transition-all text-gray-800"
                    placeholder="Ex: Mariana, Carolina"
                  />
                </div>

                {/* Objective Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5c4945]">Objetivo Principal</label>
                  <div className="flex bg-[#faf5f3] p-1 rounded-xl border border-transparent">
                    <button
                      id="opt-engravidar"
                      type="button"
                      onClick={() => setObjetivo("engravidar")}
                      className={`flex-1 py-1 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        objetivo === "engravidar"
                          ? "bg-white text-clara-pink-600 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <Baby className="w-3.5 h-3.5" />
                      Engravidar
                    </button>
                    <button
                      id="opt-acompanhar"
                      type="button"
                      onClick={() => setObjetivo("acompanhar")}
                      className={`flex-1 py-1 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        objetivo === "acompanhar"
                          ? "bg-white text-clara-pink-600 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Acompanhar
                    </button>
                  </div>
                </div>

                {/* Status selector / customized cycle status */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="status-select" className="text-xs font-bold text-[#5c4945] flex items-center gap-1">
                      Fase do Ciclo / Status do Dia
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomStatus(!isCustomStatus);
                        if (!isCustomStatus) {
                          setStatusDoDia("custom");
                        } else {
                          setStatusDoDia(PHASE_SUGGESTIONS[0]);
                        }
                      }}
                      className="text-[10px] font-bold text-clara-pink-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      {isCustomStatus ? "Voltar para lista padrão" : "Digitar Fase Customizada ✍️"}
                    </button>
                  </div>

                  {!isCustomStatus ? (
                    <select
                      id="status-select"
                      value={statusDoDia}
                      onChange={(e) => setStatusDoDia(e.target.value)}
                      className="bg-[#faf5f3] px-3.5 py-2 rounded-xl text-xs font-medium border border-transparent focus:bg-white focus:border-clara-pink-300 outline-hidden transition-all text-gray-700"
                    >
                      {PHASE_SUGGESTIONS.map((phase) => (
                        <option key={phase} value={phase}>{phase}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        id="custom-status-input"
                        type="text"
                        required
                        value={customStatus}
                        onChange={(e) => setCustomStatus(e.target.value)}
                        className="flex-1 bg-[#faf5f3] px-3.5 py-2 rounded-xl text-xs font-medium border border-transparent focus:bg-white focus:border-clara-pink-300 outline-hidden transition-all text-gray-800"
                        placeholder="Ex: Menstruação atrasada em 2 dias, Faltam 3 Dias, TPM intensa"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">Define a sintonização hormonal que servirá de insumo para o tom e a regra de negócio do alerta push.</p>
                </div>

                {/* Infection Propensity Checkbox / Switcher */}
                <div className="sm:col-span-2 border-t border-[#fdf3f0] pt-4 mt-1">
                  <label className="relative flex items-start gap-3 cursor-pointer select-none">
                    <input
                      id="infection-checkbox"
                      type="checkbox"
                      checked={historicoInfeccao}
                      onChange={(e) => setHistoricoInfeccao(e.target.checked)}
                      className="w-4 h-4 rounded-md text-clara-pink-500 border-gray-300 focus:ring-clara-pink-300 focus:ring-offset-0 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#3c2a26] flex items-center gap-1.5">
                        Histórico de Propensão a Infecções (Candidíase/Vaginose)
                        <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.2 rounded-full font-semibold">
                          Fator Imunitário
                        </span>
                      </span>
                      <p className="text-[10.5px] text-gray-400 mt-1 leading-normal">
                        Se ativo, Clara ativará comportamentos imunitários preventivos para as fases Pré e Pós-menstrual. Ela lembrará de hábitos de saúde física (água, ventilação) com sensibilidade sutil, sem sugerir remédios.
                      </p>
                    </div>
                  </label>
                </div>

              </div>

              {/* Action Button Trigger */}
              <button
                id="generate-clara-btn"
                type="submit"
                disabled={isGenerating}
                className={`w-full py-4 rounded-2xl font-display font-semibold transition-all relative overflow-hidden flex items-center justify-center gap-2 border shadow-lg ${
                  isGenerating 
                    ? "bg-[#faf5f3] border-[#f3e2df] text-gray-400 cursor-not-allowed" 
                    : "bg-linear-to-tr from-[#f43f5e] to-[#fb923c] text-white hover:shadow-clara-pink-200 border-transparent active:scale-98"
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-clara-pink-600 animate-spin"></div>
                    <span>Clara IA está sintonizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 animate-pulse text-white" />
                    <span>Sintonizar Meu Ciclo e Receber Alerta 🌸</span>
                  </>
                )}
              </button>

              {/* Live instructions warning */}
              {apiError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 items-center text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Erro ao conectar no motor: {apiError}. Continuando com regras de simulação offline.</span>
                </div>
              )}
            </form>

            {/* Kotlin code details container removed for user clean view */}
          </section>

          {/* RIGHT SIDE: Simulated Android Device, Response Inspector, History logs (5 cols on lg) */}
          <section className="lg:col-span-5 flex flex-col gap-6" id="device-output-section">
            
            {/* The smartphone visual screen */}
            <AndroidLockscreen 
              payload={apiResult} 
              scenarioInput={{
                nome,
                objetivo,
                status_do_dia: isCustomStatus ? (customStatus.trim() || "Fase Geral") : statusDoDia,
                historico_infeccao: historicoInfeccao
              }} 
              isGenerating={isGenerating} 
            />

            {/* Local History logs panel */}
            <HistoryLogs 
              logs={logs} 
              onClear={handleClearHistory} 
              onRestore={handleRestoreLog} 
              viewMode="user"
            />

          </section>

        </div>

      </main>

      {/* Footer credits and details */}
      <footer className="mt-auto bg-white border-t border-[#f5ded9]/60 px-6 py-6 text-center text-xs text-gray-400 font-medium font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 Clara Inc. Direcionado ao desenvolvimento de alta performance para Saúde Feminina.</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-600 transition-colors">Segurança HIPAA</span>
            <span>•</span>
            <span className="hover:text-gray-600 transition-colors">LGPD Compatível</span>
            <span>•</span>
            <span className="hover:text-gray-600 transition-colors font-mono">Conectado: "{projectID}"</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
