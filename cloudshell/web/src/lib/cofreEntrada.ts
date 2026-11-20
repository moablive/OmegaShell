/**
 * Entrada pelo cofre do LoginHUB (hub v1.6.0, rotas `/auth/cofre-entrada/*`).
 *
 * A chave de entrada da conta mora cifrada no cofre do LoginHUB. O app manda a
 * pessoa ao cofre, que abre com a digital do aparelho (Touch ID no Mac) e
 * assina um desafio de 5 minutos, de uso único. A volta traz a assinatura no
 * `#` da URL (o `#` não vai para servidor nenhum nem fica em log):
 *
 *   entrar    → `/entrar#cofre-passe=…&cofre-entrada=…&cofre-assinatura=…`
 *   cadastro  → `/#cofre-entrada=guardada`
 *
 * Os caminhos da volta são do hub (`CofreEntradaPage.vue`); a origem é o
 * `platform_url` do app cadastrado lá, nunca algo que venha no link.
 */

export interface CofreEntradaConfig {
  /** Base da API do hub, ex.: `https://loginhub.example.com/api`. */
  baseUrl: string;
  /** ID deste app no hub. */
  appId: string | number;
}

/** Sessão devolvida pelo hub: o mesmo formato do login com senha + código. */
export interface CofreEntradaSessao {
  token: string;
  expiresIn: number;
  usuario?: { id: string; nome: string; email: string; role?: string };
}

export interface EntradaCofre {
  id: string;
  nome: string;
  criado_em: string | null;
  ultimo_uso: string | null;
}

/**
 * `code`: `REDE` (sem conexão com o hub), `ENDERECO` (o hub mandou um endereço
 * que não é o do cofre) ou o que vier do hub (`ENTRADA_INVALIDA`,
 * `CHALLENGE_INVALIDO`, `PASSKEY_INDISPONIVEL`, ...).
 */
export class CofreEntradaError extends Error {
  constructor(public code: string, message: string, public status = 0) {
    super(message);
    this.name = 'CofreEntradaError';
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const lerHash = (): URLSearchParams => new URLSearchParams(window.location.hash.replace(/^#/, ''));

/** Tira o `#` da barra de endereço sem recarregar: a assinatura não fica no histórico. */
const limparHash = (): void => {
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
};

/** O `#` desta URL é a volta do cadastro (`cofre-entrada=guardada`)? */
export const hashDeEntradaGuardada = (hash: string): boolean =>
  new URLSearchParams(hash.replace(/^#/, '')).get('cofre-entrada') === 'guardada';

export function createCofreEntrada(config: CofreEntradaConfig) {
  const base = config.baseUrl.replace(/\/+$/, '');
  const appId = String(config.appId);
  const hostDoCofre = new URL(base).hostname;

  async function chamar<T>(metodo: string, caminho: string, corpo?: unknown, token?: string): Promise<T> {
    let resposta: Response;
    try {
      resposta = await fetch(`${base}/auth/cofre-entrada${caminho}`, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
      });
    } catch {
      throw new CofreEntradaError('REDE', 'Sem conexão com o servidor de login.');
    }
    const dados = (await resposta.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resposta.ok) {
      throw new CofreEntradaError(String(dados.error || 'ERRO'), String(dados.message || 'Não foi possível concluir.'), resposta.status);
    }
    return dados as T;
  }

  /** Só segue para o cofre do próprio hub: o endereço vem da API, aqui confere o host. */
  function irPara(url: unknown): void {
    let destino: URL;
    try {
      destino = new URL(String(url));
    } catch {
      throw new CofreEntradaError('ENDERECO', 'O servidor de login não devolveu o endereço do cofre.');
    }
    if (destino.protocol !== 'https:' || destino.hostname !== hostDoCofre) {
      throw new CofreEntradaError('ENDERECO', 'Endereço do cofre inesperado.');
    }
    window.location.assign(destino.toString());
  }

  return {
    /** Vai ao cofre para entrar. A página sai do app; a volta é em `/entrar`. */
    async irParaEntrar(): Promise<void> {
      irPara((await chamar<{ url: string }>('POST', '/login/opcoes', { app_id: appId })).url);
    },

    /** Vai ao cofre para guardar a entrada desta conta. `token` é a sessão completa. */
    async irParaGuardar(token: string): Promise<void> {
      irPara((await chamar<{ url: string }>('POST', '/registro/opcoes', {}, token)).url);
    },

    /**
     * Volta do cofre: se o `#` traz a assinatura, limpa o `#` e troca pela
     * sessão no hub. Devolve `null` quando não há nada para concluir.
     */
    async concluir(): Promise<CofreEntradaSessao | null> {
      const h = lerHash();
      const passe = h.get('cofre-passe');
      const entrada_id = h.get('cofre-entrada');
      const assinatura = h.get('cofre-assinatura');
      if (!passe || !entrada_id || !assinatura) return null;
      limparHash();
      if (!UUID.test(entrada_id)) throw new CofreEntradaError('ENTRADA_INVALIDA', 'O cofre não confirmou a entrada. Entre com e-mail e senha.');
      const sessao = await chamar<CofreEntradaSessao>('POST', '/login/verificar', { app_id: appId, passe, entrada_id, assinatura });
      // Mesma guarda do hubAuthClient: nunca devolver sessão sem token.
      if (typeof sessao.token !== 'string' || !sessao.token) throw new CofreEntradaError('ERRO', 'O servidor de login não devolveu a sessão.');
      return sessao;
    },

    /** Entradas pelo cofre desta conta. */
    listar: (token: string) => chamar<EntradaCofre[]>('GET', '', undefined, token),

    /** Tira uma entrada: aquele cofre deixa de entrar nesta conta. */
    async remover(token: string, id: string): Promise<void> {
      if (!UUID.test(id)) throw new CofreEntradaError('PASSKEY_NAO_ENCONTRADA', 'Entrada não encontrada.');
      await chamar('DELETE', `/${id}`, undefined, token);
    },
  };
}

export type CofreEntradaClient = ReturnType<typeof createCofreEntrada>;
