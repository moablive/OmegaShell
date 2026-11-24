<script setup lang="ts">
import { onMounted, ref } from 'vue';
import GoogleAuthAviso from '@/components/GoogleAuthAviso.vue';
import TwoFactorEnroll from '@/components/TwoFactorEnroll.vue';
import { NOME_NO_HUB, abrirTerminal, concluirEntradaPeloCofre, hub, irAoCofreParaEntrar, recusa, traduzir } from '@/sessao';

/**
 * Login do CloudShell pelo LoginHUB, com os três desfechos do /auth/login:
 * sessão, desafio (pede o código do autenticador) ou enrolar (QR aqui mesmo).
 * Só depois do segundo fator existe sessão — e só com ela o gateway libera o ttyd.
 */
const email = ref('');
const senha = ref('');
const carregando = ref(true);
const erro = ref<string | null>(null);

const challengeToken = ref<string | null>(null);
const enrolarToken = ref<string | null>(null);
const codigo = ref('');
const usarBackup = ref(false);

onMounted(async () => {
  // Volta do cofre do LoginHUB: a assinatura veio no `#` e vira sessão antes de qualquer outra coisa.
  try {
    await concluirEntradaPeloCofre();
  } catch (e) {
    erro.value = traduzir(e);
  }
  // Sessão guardada (ou renovável) abre o terminal direto.
  try {
    const aberto = await abrirTerminal();
    if (aberto === true) return;
    // Sem sessão guardada é o caso normal; qualquer outra recusa tem motivo a mostrar.
    if (aberto !== 'SEM_SESSAO') erro.value = recusa(aberto);
  } catch {
    /* segue para o formulário */
  }
  carregando.value = false;
});

async function entrar() {
  if (carregando.value) return;
  carregando.value = true;
  erro.value = null;
  try {
    const r = await hub.login(email.value, senha.value);
    if (r.status === 'desafio') challengeToken.value = r.challengeToken;
    else if (r.status === 'enrolar') enrolarToken.value = r.setupToken;
    else {
      const aberto = await abrirTerminal();
      if (aberto === true) return;
      erro.value = recusa(aberto);
    }
  } catch (e) {
    erro.value = traduzir(e);
  } finally {
    senha.value = '';
    carregando.value = false;
  }
}

async function entrarPeloCofre() {
  if (carregando.value) return;
  carregando.value = true;
  erro.value = null;
  try {
    // A página sai do OmegaShell; `carregando` só volta se o cofre não abriu.
    await irAoCofreParaEntrar();
  } catch (e) {
    erro.value = traduzir(e);
    carregando.value = false;
  }
}

async function segundoFator() {
  if (carregando.value || !challengeToken.value) return;
  carregando.value = true;
  erro.value = null;
  try {
    if (usarBackup.value) await hub.twoFactor.verifyBackup(challengeToken.value, codigo.value.trim());
    else await hub.twoFactor.verify(challengeToken.value, codigo.value.trim());
    challengeToken.value = null;
    const aberto = await abrirTerminal();
    if (aberto === true) return;
    erro.value = recusa(aberto);
  } catch (e) {
    erro.value = traduzir(e);
  } finally {
    carregando.value = false;
  }
}

async function enrolado() {
  enrolarToken.value = null;
  const aberto = await abrirTerminal();
  if (aberto !== true) erro.value = recusa(aberto);
}
</script>

<template>
  <TwoFactorEnroll v-if="enrolarToken" :setup-token="enrolarToken" @concluido="enrolado" />

  <div v-else class="cartao">
    <div class="topo">
      <img src="/favicon-192.png" alt="Astral Wave" />
      <h1>OmegaShell</h1>
      <p>Terminal dos servidores da Astral Wave</p>
    </div>

    <div v-if="carregando && !challengeToken && !email" class="girando"></div>

    <form v-else-if="challengeToken" @submit.prevent="segundoFator">
      <p class="nota">
        {{ usarBackup ? 'Digite um dos códigos de recuperação que você guardou.' : 'Verificação em duas etapas' }}
      </p>
      <GoogleAuthAviso v-if="!usarBackup" modo="codigo" :emissor="NOME_NO_HUB" />
      <input
        v-model="codigo"
        class="codigo"
        type="text"
        required
        autofocus
        autocomplete="one-time-code"
        :inputmode="usarBackup ? 'text' : 'numeric'"
        :maxlength="usarBackup ? 11 : 6"
        :placeholder="usarBackup ? 'XXXXX-XXXXX' : '000000'"
      />
      <p v-if="erro" class="erro">{{ erro }}</p>
      <button type="submit" :disabled="carregando || !codigo">{{ carregando ? 'Verificando…' : 'Verificar' }}</button>
      <button type="button" class="link" @click="usarBackup = !usarBackup; codigo = ''; erro = null">
        {{ usarBackup ? 'Usar o aplicativo autenticador' : 'Perdi o acesso ao autenticador' }}
      </button>
    </form>

    <form v-else @submit.prevent="entrar">
      <input v-model="email" type="email" required autocomplete="username" placeholder="E-mail" />
      <input v-model="senha" type="password" required autocomplete="current-password" placeholder="Senha" />
      <p v-if="erro" class="erro">{{ erro }}</p>
      <button type="submit" :disabled="carregando">{{ carregando ? 'Entrando…' : 'Entrar' }}</button>
      <!-- Entrada pelo cofre do LoginHUB: o cofre abre com a digital do aparelho e assina a entrada. -->
      <button type="button" class="link" :disabled="carregando" @click="entrarPeloCofre">
        <!-- logo oficial do LoginHUB (apps/ui/public/favicon.svg do hub) -->
        <svg width="16" height="16" style="vertical-align: -3px; margin-right: 6px" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="120" fill="#2563EB"/><path fill="#fff" d="M256 64C256 64 416 96 416 224C416 339.6 348.6 428.6 256 448C163.4 428.6 96 339.6 96 224C96 96 256 64 256 64Z"/><circle cx="256" cy="200" r="30" fill="#2563EB"/><path fill="#2563EB" d="M256 240L230 320H282L256 240Z"/></svg>Entrar pelo cofre do LoginHUB
      </button>
      <p class="nota">Login da Astral Wave (LoginHUB) com verificação em duas etapas.</p>
    </form>
  </div>
</template>
