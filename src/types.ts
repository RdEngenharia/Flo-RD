export interface UserScenario {
  id?: string;
  nome: string;
  objetivo: "engravidar" | "acompanhar";
  status_do_dia: string;
  historico_infeccao: boolean;
  label?: string;
}

export interface ClaraResponsePayload {
  verificar_permissao_android: boolean;
  canal_notificacao_id: string;
  texto_notificacao: string;
}

export interface ClaraAPIResponse {
  fallback: boolean;
  error?: string;
  data: ClaraResponsePayload;
}

export interface SavedNotification {
  id: string;
  timestamp: string;
  input: UserScenario;
  output: ClaraResponsePayload;
  isFallback: boolean;
}
