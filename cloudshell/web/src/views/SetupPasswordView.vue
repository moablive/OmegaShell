<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TwoFactorEnroll from '@/components/TwoFactorEnroll.vue';
import { abrirTerminal, hub, recusa, traduzir } from '@/sessao';

/**
 * Primeiro acesso e reset de senha, a partir do magic link do LoginHUB
 * (<platform_url>/setup-password?token=…). Devolve os mesmos três desfechos do
 * login: conta que já tem autenticador cai em desafio, senão o reset seria
 * atalho para pular o 2FA.
 */
const route = useRoute();
const router = useRouter();

const token = computed(() => (route.query.token as string) || '');
const senha = ref('');
const confirmacao = ref('');
const erro = ref<string | null>(null);
const aviso = ref<string | null>(null);
const enviando = ref(false);
const enrolarToken = ref<string | null>(null);

async function salvar() {
  erro.value = null;
  if (senha.value.length < 6) { erro.value = 'A senha deve ter ao menos 6 caracteres.'; return; }
  if (senha.value !== confirmacao.value) { erro.value = 'As senhas não coincidem.'; return; }

  enviando.value = true;
  try {
    const r = await hub.setupPassword(token.value, senha.value);
    if (r.status === 'enrolar') { enrolarToken.value = r.setupToken; return; }
    if (r.status === 'desafio') {
      aviso.value = 'Senha definida. Entre novamente e confirme o código do Google Authenticator.';
      setTimeout(() => router.replace('/entrar'), 2500);
      return;
    }
    const aberto = await abrirTerminal();
    if (aberto !== true) erro.value = recusa(aberto);
  } catch (e) {
    erro.value = traduzir(e);
  } finally {
    enviando.value = false;
  }
}

async function enrolado() {
  // A senha e o 2FA já estão feitos: se o terminal recusar, o motivo aparece aqui
  // (o formulário volta com o erro) em vez de cair no login sem explicação.
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
      <h1>Defina sua senha</h1>
      <p>Primeiro acesso ao CloudShell.</p>
    </div>

    <form v-if="!token" @submit.prevent="router.replace('/entrar')">
      <p class="nota">Link inválido: falta o token. Abra o link do e-mail exatamente como veio ou peça um novo.</p>
      <button type="submit">Ir para o login</button>
    </form>

    <form v-else @submit.prevent="salvar">
      <input v-model="senha" type="password" required autocomplete="new-password" placeholder="Nova senha" />
      <input v-model="confirmacao" type="password" required autocomplete="new-password" placeholder="Confirme a nova senha" />
      <p v-if="erro" class="erro">{{ erro }}</p>
      <p v-if="aviso" class="aviso">{{ aviso }}</p>
      <p class="nota">Esta conta exige verificação em duas etapas: o próximo passo é escanear um QR code.</p>
      <button type="submit" :disabled="enviando">{{ enviando ? 'Salvando…' : 'Salvar senha e continuar' }}</button>
    </form>
  </div>
</template>
