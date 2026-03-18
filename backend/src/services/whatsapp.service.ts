import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  type ConnectionState,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import fs from 'fs';
import { Boom } from '@hapi/boom';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { WhatsAppStatus } from '../types';

// ─── Tipos Internos ──────────────────────────────────────────────────────────

type WASocket = ReturnType<typeof makeWASocket>;

// ─── Estado da Conexão (Singleton) ───────────────────────────────────────────

let sock: WASocket | null = null;
let isConnected = false;
let qrDataUrl: string | null = null;  // QR code como imagem base64
let initializing = false;             // Evita reconexões simultâneas

// ─── Utilitário ───────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Inicialização ────────────────────────────────────────────────────────────

/**
 * Inicializa o socket WhatsApp via Baileys.
 * Deve ser chamado uma vez na inicialização do servidor.
 * Reconecta automaticamente em caso de queda (exceto logout explícito).
 */
export async function initialize(): Promise<void> {
  if (initializing) return;
  initializing = true;

  try {
    // Garante que o diretório de sessão existe
    if (!fs.existsSync(env.AUTH_SESSION_DIR)) {
      fs.mkdirSync(env.AUTH_SESSION_DIR, { recursive: true });
    }

    // Carrega (ou cria) as credenciais de autenticação persistidas em disco
    const { state, saveCreds } = await useMultiFileAuthState(env.AUTH_SESSION_DIR);

    // Busca a versao mais recente suportada do protocolo Web para reduzir falhas de conexao
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info({ version, isLatest }, 'Versao do protocolo Baileys carregada');

    // Cria o socket WhatsApp
    // O QR sera exposto via connection.update (campo qr) e convertido para imagem base64
    sock = makeWASocket({
      auth: state,
      version,
      browser: Browsers.windows('Desktop'),
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });

    // Persiste as credenciais sempre que forem atualizadas pelo Baileys
    sock.ev.on('creds.update', saveCreds);

    // Monitora mudanças de estado da conexão
    sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      // Novo QR code disponível — converte para imagem e salva em memória
      if (qr) {
        try {
          qrDataUrl = await QRCode.toDataURL(qr, { scale: 8, margin: 2 });
          isConnected = false;
          logger.info('Novo QR code gerado. Aguardando escaneamento pelo usuário...');
        } catch (err) {
          logger.error({ err }, 'Falha ao converter QR code para imagem');
        }
      }

      if (connection === 'open') {
        isConnected = true;
        qrDataUrl = null; // Limpa o QR após autenticação bem-sucedida
        initializing = false;
        logger.info('✅ WhatsApp conectado com sucesso!');
      }

      if (connection === 'close') {
        isConnected = false;
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;

        logger.warn({ statusCode, loggedOut }, 'Conexão WhatsApp encerrada');

        if (loggedOut) {
          // Remove credenciais salvas para forçar novo QR code
          logger.info('Sessão encerrada pelo usuário. Removendo credenciais...');
          fs.rmSync(env.AUTH_SESSION_DIR, { recursive: true, force: true });
        }

        // Reconecta após breve delay (inclusive após logout para exibir novo QR)
        initializing = false;
        await sleep(3000);
        initialize();
      }
    });

    logger.info('WhatsApp service iniciado. Aguardando QR code ou conexão existente...');
  } catch (err) {
    logger.error({ err }, 'Falha ao inicializar WhatsApp service');
    initializing = false;
    // Tenta novamente após 5 segundos
    await sleep(5000);
    initialize();
  }
}

// ─── API Pública ──────────────────────────────────────────────────────────────

/**
 * Retorna o estado atual da conexão WhatsApp.
 * - Se não conectado e há QR disponível: retorna { connected: false, qr: "data:image/png;base64,..." }
 * - Se conectado: retorna { connected: true }
 */
export function getStatus(): WhatsAppStatus {
  if (isConnected) {
    return { connected: true };
  }
  return {
    connected: false,
    qr: qrDataUrl ?? undefined,
  };
}

/**
 * Verifica se um número de telefone está cadastrado no WhatsApp.
 *
 * @param phone - Número com código de país, somente dígitos (ex: "5511999990001")
 * @returns true se o número existe no WhatsApp
 * @throws Error se o WhatsApp não estiver conectado
 */
export async function checkNumber(phone: string): Promise<boolean> {
  if (!sock || !isConnected) {
    throw new Error('WhatsApp não está conectado. Por favor, escaneie o QR code primeiro.');
  }

  try {
    // onWhatsApp retorna array; o primeiro elemento tem { exists: boolean, jid: string }
    const results = await sock.onWhatsApp(phone);
    const result = results?.[0];
    return result?.exists ?? false;
  } catch (err) {
    // Log apenas os últimos 4 dígitos para não expor números completos nos logs
    logger.error({ err, phone: `***${phone.slice(-4)}` }, 'Erro ao verificar número no WhatsApp');
    throw err;
  }
}

/**
 * Desconecta o socket WhatsApp (para shutdown gracioso do servidor).
 */
export async function disconnect(): Promise<void> {
  if (sock) {
    try {
      await sock.logout();
    } catch {
      // Ignora erros de logout durante shutdown
    }
    sock = null;
    isConnected = false;
    logger.info('WhatsApp desconectado.');
  }
}
