import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini client or handle gracefully
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Clara Engine: Gemini API initialized successfully.");
  } catch (err) {
    console.error("Clara Engine: Failed to initialize Gemini API", err);
  }
} else {
  console.log("Clara Engine: No GEMINI_API_KEY found or it has placeholder value. Running in fallback/deterministic rule mode.");
}

// Scenarios database (prefilled lists)
const MOCK_SCENARIOS = [
  {
    id: "scen-1",
    nome: "Mariana",
    objetivo: "engravidar",
    status_do_dia: "Janela Fértil",
    historico_infeccao: false,
    label: "👶 Mariana (Engravidar • Janela Fértil)"
  },
  {
    id: "scen-2",
    nome: "Camila",
    objetivo: "engravidar",
    status_do_dia: "Dia da Ovulação (Pico)",
    historico_infeccao: false,
    label: "❤️ Camila (Engravidar • Pico da Ovulação)"
  },
  {
    id: "scen-3",
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
    id: "scen-5",
    nome: "Beatriz",
    objetivo: "acompanhar",
    status_do_dia: "Menstruando (Falta 3 Dias para o Período)",
    historico_infeccao: false,
    label: "☕ Beatriz (Apenas Acompanhar • Falta 3 Dias para Período)"
  },
  {
    id: "scen-6",
    nome: "Lorena",
    objetivo: "acompanhar",
    status_do_dia: "Fase Lútea (Falta 1 Dia)",
    historico_infeccao: false,
    label: "🍫 Lorena (Apenas Acompanhar • Falta 1 Dia para Período)"
  }
];

// Fallback deterministic notification generator in case there is no API key
function getDeterministicNotification(nome: string, objetivo: string, status_do_dia: string, historico_infeccao: boolean) {
  const statusStr = status_do_dia.toLowerCase();
  
  if (objetivo === "engravidar") {
    if (statusStr.includes("ovulação") || statusStr.includes("ovulacao") || statusStr.includes("pico")) {
      return {
        verificar_permissao_android: true,
        canal_notificacao_id: "ALERTA_SAUDE_FALANTE",
        texto_notificacao: `Ei ${nome}, hoje é seu dia de pico fértil (ovulação)! Momento perfeito para o namoro focado. ❤️`
      };
    } else {
      return {
        verificar_permissao_android: true,
        canal_notificacao_id: "ALERTA_SAUDE_FALANTE",
        texto_notificacao: `Sua janela fértil começou, ${nome}! Dias incríveis para tentar o seu positivo. ✨👶`
      };
    }
  }
  
  if (historico_infeccao) {
    if (statusStr.includes("pré") || statusStr.includes("pre") || statusStr.includes("pós") || statusStr.includes("pos")) {
      const messages = [
        `Oi ${nome}! A imunidade muda nessa fase do ciclo. Lembre-se de usar roupas leves e beber bastante água hoje, viu? 💧🌸`,
        `Fique atenta aos sinais do seu corpo hoje, ${nome}. O equilíbrio da flora vaginal é tudo! Se cuida. ✨`
      ];
      const selectMsg = statusStr.includes("pré") || statusStr.includes("pre") ? messages[0] : messages[1];
      return {
        verificar_permissao_android: true,
        canal_notificacao_id: "ALERTA_SAUDE_FALANTE",
        texto_notificacao: selectMsg
      };
    }
  }
  
  if (statusStr.includes("falta 3") || statusStr.includes("3 dias") || statusStr.includes("pré-menstrual") || statusStr.includes("pre-menstrual")) {
    return {
      verificar_permissao_android: true,
      canal_notificacao_id: "ALERTA_SAUDE_FALANTE",
      texto_notificacao: `Seu período chega em 3 dias, ${nome}. Que tal diminuir o ritmo e se dar um chocolate hoje? 🌸☕`
    };
  } else if (statusStr.includes("falta 1") || statusStr.includes("1 dia")) {
    return {
      verificar_permissao_android: true,
      canal_notificacao_id: "ALERTA_SAUDE_FALANTE",
      texto_notificacao: `Quase lá, ${nome}. Seu período deve iniciar amanhã. Reserve um tempinho extra de carinho para você hoje! ✨☕`
    };
  }
  
  return {
    verificar_permissao_android: true,
    canal_notificacao_id: "ALERTA_SAUDE_FALANTE",
    texto_notificacao: `Olá ${nome}! Fique atenta aos sinais do seu corpo hoje. O equilíbrio do ciclo é tudo! Se cuida. 🌸✨`
  };
}

// API Routes
app.get("/api/scenarios", (req, res) => {
  res.json(MOCK_SCENARIOS);
});

app.post("/api/generate-notification", async (req, res) => {
  const { nome, objetivo, status_do_dia, historico_infeccao } = req.body;
  if (!nome) {
    return res.status(400).json({ error: "O campo 'nome' é obrigatório." });
  }

  const normalizedObjetivo = (objetivo || "").toLowerCase();
  
  console.log(`Clara Engine: Generating notification for ${nome} [Objetivo: ${normalizedObjetivo}, Status: ${status_do_dia}, Histórico Infecção: ${historico_infeccao}]`);

  // Let's decide if we use Gemini or fallback
  if (!ai) {
    console.log("Clara Engine: Running in offline deterministic rule mode due to missing API key.");
    const fallbackVal = getDeterministicNotification(nome, normalizedObjetivo, status_do_dia, !!historico_infeccao);
    return res.json({
      fallback: true,
      data: fallbackVal
    });
  }

  try {
    const prompt = `
Contexto:
Você é "Clara", a inteligência artificial predutiva e assistente de saúde feminina estilo Flo.
Sua função é gerar o conteúdo de NOTIFICAÇÕES PUSH personalizadas e estruturar os metadados de controle a partir dos dados do backend fornecidos.

[DADOS DA USUÁRIA ATUAL]
- Nome: ${nome}
- Objetivo: ${objetivo} (pode ser "engravidar" ou "acompanhar")
- Status do Dia / Fase do Ciclo: ${status_do_dia}
- Histórico de Propensão a Infecções (Candidíase/Vaginose): ${historico_infeccao ? "Sim" : "Não"}

[DIRETRIZES DE COMUNICAÇÃO DE CLARA]
1. Adote um tom de extrema cumplicidade, amizade íntima, cuidado genuíno, leveza e com um embasamento biológico sutil.
2. Use emojis de forma estratégica no início ou no fim do texto (ex: 🌸, 🗓️, 👶, ✨, 💧, ❤️).
3. REQUISITO CRUCIAL DE TAMANHO: O texto da mensagem dentro de "texto_notificacao" deve ter no MÁXIMO 120 caracteres em português. É vital não passar de 120 caracteres para evitar corte visual no celular Android.
4. Fale de biologia, fertilidade, corrimento benéfico e corpo da mulher com naturalidade impecável e livre de tabus.

[CENÁRIOS E REGRAS DE NEGÓCIO]
- Se objetivo é "engravidar":
  * Na Janela Fértil: Foco em otimismo, vibração positiva e biologia de chances. Exemplo: "Sua janela fértil começou! Dias incríveis para tentar o seu positivo. ✨👶"
  * No Dia da Ovulação (Pico): Alerta de alta fertilidade. Exemplo: "Hoje é o seu dia de pico fértil (ovulação)! Momento perfeito para o namoro focado. ❤️"
- Se a usuária tem histórico de propensão a infecções e está nas fases Pré ou Pós-Menstrual ou se o status envolve alterações hormonais/imunidade:
  * Gere notificações puramente preventivas de hábitos saudáveis (ex: beber água, roupas leves de algodão, evitar abafamento), mantendo o bem-estar visual, sem dar diagnósticos ou sugerir receitas de medicamentos.
  * Exemplo: "A imunidade muda nessa fase do ciclo. Lembre-se de usar roupas leves e beber bastante água hoje, viu? 💧🌸"
- Se o objetivo é "acompanhar" (TPM e menstruação):
  * Próximo da menstruação: Alertas de acolhimento acolhedor e carinhoso e aviso prévio. Exemplo: "Seu período chega em 3 dias. Que tal diminuir o ritmo e se dar um chocolate hoje? 🌸☕"

De acordo com as instruções acima, gere o JSON com as chaves exatas:
"verificar_permissao_android": true (booleano)
"canal_notificacao_id": "ALERTA_SAUDE_FALANTE" (string)
"texto_notificacao": "[sua frase personalizada com no máximo 120 caracteres]"
`;

    // Call Gemini API using the precise Type properties
    const generateOptions = {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verificar_permissao_android: { 
              type: Type.BOOLEAN, 
              description: "Deve mapear para true sempre." 
            },
            canal_notificacao_id: { 
              type: Type.STRING, 
              description: "ID do canal Android. Geralmente 'ALERTA_SAUDE_FALANTE'." 
            },
            texto_notificacao: { 
              type: Type.STRING, 
              description: "Texto da notificação push de no máximo 120 caracteres com tom intimista e emojis." 
            },
          },
          required: ["verificar_permissao_android", "canal_notificacao_id", "texto_notificacao"],
        }
      }
    };

    const response = await ai.models.generateContent(generateOptions);
    const jsonText = response.text || "{}";
    
    // Parse the result
    const notificationResult = JSON.parse(jsonText.trim());
    
    // Safety check for character count
    if (notificationResult.texto_notificacao && notificationResult.texto_notificacao.length > 120) {
      console.warn("Clara Engine: Notification text exceeded 120 chars. Truncating to ensure Android compat.");
      notificationResult.texto_notificacao = notificationResult.texto_notificacao.substring(0, 117) + "...";
    }

    res.json({
      fallback: false,
      data: notificationResult
    });
  } catch (error: any) {
    console.error("Clara Engine: Error generating via Gemini API. Triggering deterministic fallback.", error);
    const fallbackVal = getDeterministicNotification(nome, normalizedObjetivo, status_do_dia, !!historico_infeccao);
    res.json({
      fallback: true,
      error: error.message,
      data: fallbackVal
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clara Server is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
