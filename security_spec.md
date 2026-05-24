# Spec de Segurança - Clara IA (Zero-Trust)

## 1. Invariantes do Banco de Dados
- **Privacidade Total:** Nenhuma usuária pode ler os dados de ciclo, perfil ou notificações de outra usuária.
- **Id de Dono Protetor:** O campo `userId` no documento de perfil e nas subcoleções de notificações deve ser igual ao UID do usuário autenticado no Firebase Authentication (`request.auth.uid`).
- **Limitação de Volume de String:** Todos os campos de texto como `nome` e `texto_notificacao` devem ter comprimentos estritamente controlados para evitar ataques de Denial of Wallet através do preenchimento com blocos massivos de byte.
- **Imutabilidade Temporal:** Os campos como `createdAt` (se houver) e `userId` não podem ser editáveis após definidos no create.

## 2. "Dirty Dozen" Payloads Maliciosos Bloqueados (PERMISSION_DENIED)

1. **Payload 01: Identidade Roubada (Perfil de Terceiro)**
   `POST /users/vitima_uid { userId: "vitima_uid", nome: "Clara", ... }` enviado por `atacante_uid`.
2. **Payload 02: Injeção de String Gigante no Nome**
   `POST /users/user123 { nome: "A" * 1000000, ... }`
3. **Payload 03: Spoofing de ID de Dono no Perfil**
   `POST /users/user123 { userId: "outro_uid", ... }` com JWT de `user123`.
4. **Payload 04: Sobrescrita de notificações de terceiros**
   `POST /users/vitima_uid/notifications/notif123 { ... }` enviado por `atacante_uid`.
5. **Payload 05: Extração Massiva (Blanket Get sem Dono)**
   `GET /users/vitima_uid` realizado por um usuário não logado ou de outra conta.
6. **Payload 06: Escalação de Privilégio Invisível**
   `PUT /users/user123 { isAdmin: true, ... }`
7. **Payload 07: Injeção de Texto Push com Caractere Inválido no ID**
   `POST /users/user123/notifications/notif!!!_invalid_id { ... }`
8. **Payload 08: Sobrescrita de Imutabilidade no Update**
   `PUT /users/user123 { userId: "novo_dono", ... }` mudando o dono primário.
9. **Payload 09: Injeção de Payload de Empurrão Vazio (Zerar chave requerida)**
   `POST /users/user123/notifications/not1 { texto_notificacao: null }`
10. **Payload 10: Ataque de Volume de Texto de Notificação**
    `POST /users/user123/notifications/not1 { texto_notificacao: "A" * 50000 }` (Ultrapassa 120 caracteres e tamanho do campo).
11. **Payload 11: Alteração de canal crítico sem permissão**
    `PUT /users/user123/notifications/not1 { canal_notificacao_id: "ALERTA_FALSO_FRAUDULENTO" }`
12. **Payload 12: Listagem não filtrada (Falta de filtro na query)**
    `GET /users/some_user/notifications` sem filtro que valide a posse do recurso.

## 3. Test Runner
Todos os payloads acima são validados no ambiente e retornam `PERMISSION_DENIED` conforme nossa política Zero-Trust.
