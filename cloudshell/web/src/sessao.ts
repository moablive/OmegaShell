import { createHubAuth } from './lib/hubAuthClient';

const LOGINHUB_API = import.meta.env.VITE_LOGINHUB_API_URL || 'https://loginhub.example.com/api';
/** Sem o app_id o hub responde 409 AMBIGUOUS_EMAIL para e-mail repetido entre apps. */
const APP_ID = import.meta.env.VITE_LOGINHUB_APP_ID as string | undefined;

/** Nome do app no hub: é o emissor que aparece no Google Authenticator. */
export const NOME_NO_HUB = 'CloudShell';

export const hub = createHubAuth({ baseUrl: LOGINHUB_API, appId: APP_ID, tokenKey: 'cloudshell_token' });

/**
 * Entrega a sessão do hub ao gateway, que confere (verifyHubToken + piso de
 * revogação) e devolve o cookie httpOnly que o nginx exige antes do ttyd.
 * O WebSocket do terminal não carrega header Authorization — por isso cookie.
 */
async function entregar(token: string): Promise<{ ok: true } | { ok: false; codigo: string }> {
  const res = await fetch('/_cs/sessao', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'same-origin',
  });
  if (res.ok) return { ok: true };
  const corpo = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: false, codigo: corpo.error ?? `HTTP_${res.status}` };
}

const RECUSA_DE_SESSAO = /^(SESSAO_REVOGADA|TOKEN_\w+|SUB_INVALIDO|unauthorized|HTTP_401)$/;

/**
 * Abre o terminal com a sessão que o kit tem; tenta um refresh se ela venceu.
 * Devolve true (abriu e já está navegando) ou o código da recusa, para a tela mostrar
 * o motivo — sem ele, quem passou senha + 2FA perde a sessão sem saber por quê.
 */
export async function abrirTerminal(): Promise<true | string> {
  let token = hub.getToken();
  if (!token) return 'SEM_SESSAO';

  let r = await entregar(token);
  if (!r.ok && r.codigo === 'TOKEN_EXPIRADO') {
    token = await hub.refresh();
    if (token) r = await entregar(token);
  }
  if (!r.ok) {
    // Só recusa da sessão derruba o login do kit; erro de config/servidor (CONFIG_AUSENTE,
    // HTTP_5xx) mantém o token para a próxima tentativa.
    if (RECUSA_DE_SESSAO.test(r.codigo)) hub.logout();
    return r.codigo;
  }
  window.location.replace('/');
  return true;
}

/** Texto da recusa do gateway, com o código entre parênteses. */
export function recusa(codigo: string): string {
  if (codigo === 'CONFIG_AUSENTE') return 'O CloudShell ainda não está configurado no LoginHUB (CONFIG_AUSENTE).';
  if (codigo === 'SESSAO_REVOGADA') return 'Sessão revogada no LoginHUB. Entre de novo (SESSAO_REVOGADA).';
  return `Sessão recusada pelo CloudShell (${codigo}).`;
}

/** Sai do terminal: apaga o cookie do gateway e a sessão do kit. */
export async function sair(): Promise<void> {
  await fetch('/_cs/sair', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
  hub.logout();
}

export function traduzir(e: unknown): string {
  const cod = (e as { code?: string })?.code;
  if (cod === 'CODIGO_INVALIDO') return 'Código inválido. Confira o relógio do celular e tente o próximo.';
  if (cod === 'CHALLENGE_INVALIDO') return 'A janela de verificação expirou. Entre de novo.';
  if (cod === 'TOKEN_EXPIRADO' || cod === 'TOKEN_NAO_E_SESSAO' || cod === 'TOKEN_INVALIDO')
    return 'A janela de configuração expirou. Entre de novo para gerar outro código.';
  if (cod === 'LINK_JA_UTILIZADO') return 'Este link já foi usado. Peça um novo ao administrador.';
  if (cod === 'ACAO_INVALIDA') return 'Link inválido ou expirado. Peça um novo ao administrador.';
  if (cod === 'MUITAS_TENTATIVAS') return (e as Error).message;
  if (cod === 'REDE') return 'Sem conexão com o servidor de login.';
  return (e as Error)?.message || 'Não foi possível concluir.';
}
