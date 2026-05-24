import React, { useState } from "react";
import { Check, Copy, Code2, Terminal, HelpCircle, ShieldAlert } from "lucide-react";

export default function KotlinCodeGuide() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"impl" | "permission" | "channel">("impl");

  const kotlinRegisterChannelCode = `// 1. Criar o canal de notificação com ID ALERTA_SAUDE_FALANTE
fun createClaraNotificationChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channelId = "ALERTA_SAUDE_FALANTE"
        val name = "Canal Clara Saúde Feminina"
        val descriptionText = "Notificações de inteligência preventiva e alertas de ovulação/TPM"
        val importance = NotificationManager.IMPORTANCE_HIGH
        
        val channel = NotificationChannel(channelId, name, importance).apply {
            description = descriptionText
            enableLights(true)
            lightColor = Color.RED
            enableVibration(true)
        }
        
        val notificationManager: NotificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.createNotificationChannel(channel)
    }
}`;

  const kotlinPermissionCode = `// 2. Verificar e solicitar permissão POST_NOTIFICATIONS (Android 13+ / API 33+)
fun checkAndRequestNotificationPermission(activity: Activity) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (ContextCompat.checkSelfPermission(
                activity,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            // Solicitar permissão dinamicamente
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                REQUISITO_PERMISSAO_NOTIFICACAO_CODE
            )
        }
    }
}`;

  const kotlinTriggerNotificationCode = `// 3. Estruturar o disparo com base nos metadados da Clara IA
fun triggerNotification(context: Context, jsonPayload: String) {
    // Exemplo de parse rápido contendo as diretrizes
    val obj = JSONObject(jsonPayload)
    val verificarPermissao = obj.getBoolean("verificar_permissao_android")
    val canalId = obj.getString("canal_notificacao_id") // "ALERTA_SAUDE_FALANTE"
    val texto = obj.getString("texto_notificacao") // Frase personalizada de até 120 caracteres

    // Verificar dinamicamente antes do disparo (Requisito Android moderno)
    if (verificarPermissao && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) 
            != PackageManager.PERMISSION_GRANTED) {
            Log.w("ClaraSDK", "Disparo bloqueado: Falta permissão POST_NOTIFICATIONS.")
            return
        }
    }

    // Montar o builder e disparar
    val intent = Intent(context, MainActivity::class.java)
    val pendingIntent = PendingIntent.getActivity(
        context, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )

    val builder = NotificationCompat.Builder(context, canalId)
        .setSmallIcon(R.drawable.ic_clara_bloom) // Ícone customizado estilo Flor
        .setContentTitle("Clara Saúde ✨")
        .setContentText(texto)
        .setStyle(NotificationCompat.BigTextStyle().bigText(texto))
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setContentIntent(pendingIntent)
        .setAutoCancel(true)

    with(NotificationManagerCompat.from(context)) {
        notify(System.currentTimeMillis().toInt(), builder.build())
    }
}`;

  const getCodeToDisplay = () => {
    switch (activeTab) {
      case "impl":
        return kotlinTriggerNotificationCode;
      case "permission":
        return kotlinPermissionCode;
      case "channel":
        return kotlinRegisterChannelCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeToDisplay());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="android-studio-guide-card" className="bg-white rounded-3xl border border-[#f5dedb] shadow-xs p-6 select-text">
      
      {/* Module Title */}
      <div className="flex items-center gap-2 mb-4 border-b border-[#faf0ee] pb-4">
        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
          <Terminal className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-[#543b35] text-base">Integração Android Studio (Kotlin)</h3>
          <p className="text-xs text-gray-400">Códigos prontos para gerenciar canais e permissões no Android 14+</p>
        </div>
      </div>

      <p className="text-xs text-[#6e5854] mb-4 leading-relaxed">
        Abaixo, copie as implementações necessárias para registrar o canal <code className="bg-[#fff3f2] text-clara-pink-600 px-1 py-0.5 rounded text-[11px] font-semibold">ALERTA_SAUDE_FALANTE</code>, validar permissões em segundo plano e disparar as notificações preditivas da Clara no app Nativo.
      </p>

      {/* Control Tabs */}
      <div className="flex bg-[#fffcfb] border border-[#fbecfa] p-1 rounded-xl mb-4 gap-1">
        <button
          onClick={() => setActiveTab("channel")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "channel"
              ? "bg-[#fff2f3] text-clara-pink-600 shadow-xs"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          1. Registrar Canal
        </button>
        <button
          onClick={() => setActiveTab("permission")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "permission"
              ? "bg-[#fff2f3] text-clara-pink-600 shadow-xs"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          2. Checar Permissão
        </button>
        <button
          onClick={() => setActiveTab("impl")}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "impl"
              ? "bg-[#fff2f3] text-clara-pink-600 shadow-xs"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          3. Disparo Push (JSON)
        </button>
      </div>

      {/* Code Window */}
      <div className="relative rounded-2xl bg-neutral-950 text-neutral-200 overflow-hidden font-mono text-xs border border-neutral-800">
        <div className="flex justify-between items-center bg-neutral-900 px-4 py-2 border-b border-neutral-800">
          <span className="text-[10px] text-gray-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            {activeTab === "channel" ? "NotificationChannel.kt" : activeTab === "permission" ? "PermissionsHelper.kt" : "NotificationSender.kt"}
          </span>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition-colors bg-neutral-800 px-3 py-1 rounded-md text-[10px] items-center gap-1 flex active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copiar Código
              </>
            )}
          </button>
        </div>
        
        <pre className="p-4 overflow-x-auto select-all max-h-[300px] leading-relaxed text-gray-300 whitespace-pre scrollbar">
          <code>{getCodeToDisplay()}</code>
        </pre>
      </div>

      {/* Modern Notice on POST_NOTIFICATIONS */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-2.5 items-start">
        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-blue-800 leading-normal">
          <strong className="font-bold">Aviso Técnico Android 14:</strong> Desde o Android 13, se o app tentar exibir push na barra de tarefas sem que a permissão <code className="bg-blue-100 px-1 py-0.5 rounded text-[10px] font-bold">POST_NOTIFICATIONS</code> tenha sido concedida, o sistema descartará silenciosamente o alerta. O campo <code className="bg-blue-100 px-1 py-0.5 rounded text-[10px] font-bold">verificar_permissao_android: true</code> instrui seu Worker nativo a validar isso antes.
        </div>
      </div>

    </div>
  );
}
