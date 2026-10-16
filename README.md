# Nota Mil — corretor de redação ENEM

TanStack Start + Tailwind 4, pronto para a Vercel. Login com Supabase, assinatura semanal
pela Cakto e correção por IA (Gemini).

## Como o pagamento funciona

1. O aluno cria conta e clica em **Assinar**. O app gera um token opaco e abre o link de
   pagamento da Cakto com `?callback=<token>`.
2. Depois de pagar, a Cakto avisa o app por webhook (`/api/cakto-webhook`), e o app libera o acesso.
3. O acesso vale 7 dias (+12 h de folga) a partir de cada pagamento aprovado. A renovação semanal
   chega como novo aviso e empurra o vencimento. Se o aluno cancelar ou atrasar, o acesso
   simplesmente termina no vencimento. Reembolso e chargeback tiram o acesso na hora.
4. O app descobre qual aluno pagou pelo token (`callback`); se ele não vier, pelo id da assinatura
   e, por último, pelo e-mail. **Por isso o aluno deve usar, no pagamento, o mesmo e-mail da conta.**

## Como colocar no ar (nesta ordem)

### 1. Supabase (projeto novo)

SQL Editor: rode `supabase/migrations/0001_nota_mil.sql` e DEPOIS `0002_cakto.sql`.
Authentication → Email: desligue "Confirm email" para o cadastro entrar direto.
Project Settings → API: copie URL, chave anon/publishable e service_role.

### 2. Gemini

Crie a chave em aistudio.google.com e confira o nome do modelo (`GEMINI_MODEL`).

### 3. Cakto

1. **Produto:** crie um produto do tipo **Assinatura recorrente**, com a oferta no preço
   semanal. Configure a recorrência de **7 dias** (período de recorrência) e confira quais meios de
   pagamento a Cakto aceita para assinatura.
2. **Importante, para não cobrar depois do fim:** a Cakto não tem data final fixa nas ofertas que
   li. Ou limite a quantidade de cobranças da oferta, ou **cancele as assinaturas ativas no painel
   depois de 15/11**. O app para de liberar acesso nessa data, mas a Cakto continuaria cobrando.
3. **Link de pagamento:** copie o link da oferta (`https://pay.cakto.com.br/...`) para
   `CAKTO_CHECKOUT_URL`.
4. **Webhook:** Integrações → Webhooks → criar. URL: `https://SEU-DOMINIO/api/cakto-webhook`.
   Selecione o produto (obrigatório) e estes eventos: `purchase_approved`, `subscription_created`,
   `subscription_renewed`, `subscription_renewal_refused`, `subscription_paused`,
   `subscription_resumed`, `subscription_late`, `subscription_late_recovered`,
   `subscription_canceled`, `refund`, `chargeback`. Copie o **secret** para `CAKTO_WEBHOOK_SECRET`.
5. **Teste:** use "Testar Webhook" na Cakto só para ver a conexão (o evento de teste é um exemplo
   fixo e não liga a nenhum aluno). Depois faça uma compra real de teste e confira o histórico de
   eventos da Cakto: tudo deve estar com status 200.
6. **Página de obrigado:** se quiser, aponte para o endereço do site. O app confere o pagamento
   sozinho quando o aluno volta.

> A Cakto não reenvia o aviso sozinha se o app responder com erro. Se algum aparecer com falha no
> Histórico de Eventos, use "Reenviar Evento".

### 4. Vercel (plano Pro, o app é comercial)

Importe o repositório. Install Command: `npm install --legacy-peer-deps`.
Cadastre as variáveis de `.env.example` e faça o deploy.

## Regras (variáveis de ambiente)

- `PRECO_SEMANAL`: só aparece na tela. O preço real é o da oferta na Cakto: mantenha igual.
- `DATA_FIM`: último dia (padrão 2026-11-15).
- Limite de 15 correções por usuário a cada 24 horas (`limiteDiario` em `src/lib/config.server.ts`).
- As abas "O que pode cair" e "Treinar" são gratuitas; só a correção exige assinatura.

## Comandos

`npm install --legacy-peer-deps` · `npm run dev` · `npm run build` · `npm test` · `npm run lint`

## Fora do projeto

- `public/favicon.ico`: copie o seu para `public/`.
- Os componentes shadcn de `src/components/ui/` não foram incluídos porque nenhuma tela os usa.
