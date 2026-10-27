/**
 * Gateway de sessão do CloudShell — a única porta para o ttyd.
 *
 * O nginx consulta GET /verificar (auth_request) antes de qualquer pedido ao
 * terminal, inclusive o WebSocket. Como o WebSocket não leva Authorization, a
 * sessão do LoginHUB vira um cookie httpOnly aqui:
 *
 *   POST /sessao   Bearer <JWT do hub>  → confere e grava o cookie
 *   GET  /verificar (cookie)            → 204 ou 401
 *   POST /sair                          → apaga o cookie
 *
 * A conferência é a do auth-kit: verifyHubToken (assinatura, tenant, recusa os
 * passes de etapa única — o 2FA não se pula) + piso de revogação do hub.
 * Escuta só em 127.0.0.1: quem fala com ele é o nginx do próprio container.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import {
  HubAuthError,
  criarVerificadorDeRevogacao,
  verifyHubToken,
  type HubSession,
} from './hubAuthServer.js';

const PORTA = 7690;
const COOKIE = 'cs_sessao';

const hubConfig = { secret: process.env.JWT_SECRET, appId: process.env.LOGINHUB_APP_ID };
// TTL curto (padrão do kit é 60 s): este app dá shell, então sessão revogada no hub
// deve cair rápido. Se o hub não responder, o kit falha aberto por design.
const revogacao = criarVerificadorDeRevogacao({
  baseUrl: process.env.LOGINHUB_API_URL ?? 'http://server_loginhub_backend:3000/api',
  ttlMs: 15_000,
});

function responder(res: ServerResponse, status: number, corpo?: object, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
  res.end(corpo ? JSON.stringify(corpo) : undefined);
}

function cookieDoRequest(req: IncomingMessage): string | null {
  for (const parte of (req.headers.cookie ?? '').split(';')) {
    const [nome, ...valor] = parte.trim().split('=');
    if (nome === COOKIE) return valor.join('=') || null;
  }
  return null;
}

function bearer(req: IncomingMessage): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? '');
  return m ? m[1] : null;
}

interface Conta {
  sessao: HubSession;
  /** Id da conta no hub — vira ?arg= do ttyd, por isso só dígitos. */
  sub: string;
  /** E-mail para header e log; '-' se não for ASCII imprimível (sem quebra de linha). */
  email: string;
}

/** Sessão válida, não revogada e com formatos seguros; senão lança HubAuthError. */
async function conferir(token: string): Promise<Conta> {
  const sessao = verifyHubToken(token, hubConfig);
  if (await revogacao.revogada(token, sessao)) {
    throw new HubAuthError(401, 'SESSAO_REVOGADA', 'Sessão revogada no LoginHUB.');
  }
  const sub = String(sessao.sub);
  if (!/^[0-9]{1,12}$/.test(sub)) {
    throw new HubAuthError(401, 'SUB_INVALIDO', 'Conta do hub com id fora do formato numérico.');
  }
  const email = /^[\x21-\x7e]{1,254}$/.test(sessao.email ?? '') ? (sessao.email as string) : '-';
  return { sessao, sub, email };
}

function falha(res: ServerResponse, err: unknown) {
  const e = err as HubAuthError;
  if (e?.name !== 'HubAuthError') console.error('[cloudshell-gateway]', err);
  responder(res, e?.status ?? 401, { error: e?.code ?? 'unauthorized' });
}

const servidor = createServer(async (req, res) => {
  const rota = (req.url ?? '').split('?')[0];
  try {
    if (req.method === 'GET' && rota === '/verificar') {
      const token = cookieDoRequest(req);
      if (!token) return responder(res, 401, { error: 'unauthorized' });
      let conta: Conta;
      try {
        conta = await conferir(token);
      } catch (err) {
        // Para o nginx, qualquer recusa (inclusive config ausente) é 401: a pessoa
        // volta para /entrar em vez de ver um 500. O motivo fica no log.
        const e = err as HubAuthError;
        if (e?.status === 500 || e?.name !== 'HubAuthError') console.error('[cloudshell-gateway]', err);
        return responder(res, 401, { error: e?.code ?? 'unauthorized' });
      }
      // Marca posta pelo nginx só no location = /ws: cada terminal aberto.
      if (req.headers['x-cloudshell-terminal'] === '1') {
        // Header do cliente: só vale com forma de IP (mesma regra do log do nginx).
        const cf = req.headers['cf-connecting-ip'];
        const ip = typeof cf === 'string' && /^[0-9a-fA-F:.]{3,45}$/.test(cf) ? cf : '-';
        console.log(`[cloudshell-gateway] terminal aberto: conta_hub=${conta.sub} ${conta.email} ip=${ip}`);
      }
      return responder(res, 204, undefined, { 'X-CloudShell-Usuario': conta.email, 'X-CloudShell-Sub': conta.sub });
    }

    if (req.method === 'POST' && rota === '/sessao') {
      const token = bearer(req);
      if (!token) return responder(res, 401, { error: 'unauthorized' });
      // Mesma conferência do /verificar: o que não passaria lá é recusado aqui, com o
      // código na tela de login, em vez de virar um laço de redirect.
      const conta = await conferir(token);
      const maxAge = Math.max(0, (conta.sessao.exp ?? 0) - Math.floor(Date.now() / 1000));
      console.log(`[cloudshell-gateway] sessão aberta: conta_hub=${conta.sub} ${conta.email}`);
      return responder(res, 204, undefined, {
        'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`,
      });
    }

    if (req.method === 'POST' && rota === '/sair') {
      return responder(res, 204, undefined, {
        'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
      });
    }

    responder(res, 404, { error: 'not_found' });
  } catch (err) {
    falha(res, err);
  }
});

servidor.listen(PORTA, '127.0.0.1', () => {
  console.log(`[cloudshell-gateway] 127.0.0.1:${PORTA}, app_id ${hubConfig.appId || '(AUSENTE — tudo recusado)'}`);
});
