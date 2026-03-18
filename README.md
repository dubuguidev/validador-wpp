<<<<<<< HEAD
# WhatsApp Number Validator

Sistema full-stack para validar numeros de WhatsApp em lote a partir de um arquivo Excel.

## Stack
- Backend: Node.js + TypeScript + Express
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Validacao WhatsApp: Baileys (`@whiskeysockets/baileys`)

## Funcionalidades
- Upload de Excel (`.xlsx` ou `.xls`) com numeros na coluna A.
- Validacao assíncrona dos numeros no WhatsApp.
- Progresso em tempo real.
- Resultado separado entre validos e nao encontrados.
- Download de relatorio em Excel (`.xlsx`) e CSV (`.csv`).

## Estrutura

```text
backend/
  src/
frontend/
  src/
```

## Requisitos
- Node.js 20+
- npm 10+
- WhatsApp disponivel no celular para escanear QR

## 1) Rodar Backend (desenvolvimento)

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend sobe em `http://localhost:3001`.

## 2) Rodar Frontend (desenvolvimento)

```bash
cd frontend
npm install
npm run dev
```

Frontend sobe em `http://localhost:5173`.

## 3) Fluxo de uso
1. Abra o frontend no navegador.
2. Escaneie o QR code do WhatsApp.
3. Envie o Excel com os numeros na coluna A.
4. Acompanhe o progresso da validacao.
5. Baixe o relatorio em Excel ou CSV.

## Formato esperado do Excel
- Primeira planilha do arquivo.
- Numeros na coluna A.
- Aceita com ou sem simbolos (ex: `+55 (11) 99999-0000`); o backend normaliza para apenas digitos.

## Endpoints da API
- `GET /health`
- `GET /api/whatsapp/status`
- `POST /api/upload` (multipart, campo `file`)
- `GET /api/jobs/:id/status`
- `GET /api/jobs/:id/results`
- `GET /api/jobs/:id/download?format=xlsx|csv`

## Build para producao

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Seguranca e boas praticas
- `helmet` para headers de seguranca.
- CORS restrito por `CORS_ORIGIN`.
- Upload limitado a Excel e maximo de 10 MB.
- Delay entre consultas WhatsApp para reduzir risco de bloqueio.
- Sessao do WhatsApp persistida em `backend/auth_sessions`.

## Observacao importante
O Baileys nao e API oficial da Meta.

