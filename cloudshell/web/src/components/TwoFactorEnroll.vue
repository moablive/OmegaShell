<script setup lang="ts">
import { onMounted, ref } from 'vue';
import QRCode from 'qrcode';
import GoogleAuthAviso from './GoogleAuthAviso.vue';
import { hub, traduzir } from '@/sessao';
import type { TwoFactorSetupData } from '@/lib/hubAuthClient';

/**
 * Enrolamento de 2FA dentro do próprio CloudShell (modelo do TodoAPP): o QR é
 * desenhado no navegador a partir da URI otpauth:// e o passe nunca vai para a
 * URL de outra origem.
 */
const props = defineProps<{ setupToken: string }>();
const emit = defineEmits<{ (e: 'concluido'): void }>();

const dados = ref<TwoFactorSetupData | null>(null);
const qrDataUrl = ref('');
const codigo = ref('');
const backupCodes = ref<string[] | null>(null);
const carregando = ref(false);
const copiado = ref(false);
const erro = ref('');

onMounted(async () => {
  carregando.value = true;
  try {
    dados.value = await hub.twoFactor.setup(props.setupToken);
    // Falhar o QR não pode travar o enrolamento: a chave manual resolve.
    try {
      qrDataUrl.value = await QRCode.toDataURL(dados.value.otpauthUri, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'H', // o ícone do app cobre o centro
        color: { dark: '#121215', light: '#ffffff' },
      });
    } catch {
      qrDataUrl.value = '';
    }
  } catch (e) {
    erro.value = traduzir(e);
  } finally {
    carregando.value = false;
  }
});

async function confirmar() {
  if (carregando.value) return;
  carregando.value = true;
  erro.value = '';
  try {
    // A ativação emite sessão nova e o kit já a grava.
    const r = await hub.twoFactor.verifySetup(codigo.value.trim(), props.setupToken);
    backupCodes.value = r.backupCodes;
  } catch (e) {
    erro.value = traduzir(e);
  } finally {
    carregando.value = false;
  }
}

function copiar() {
  if (!backupCodes.value) return;
  void navigator.clipboard.writeText(backupCodes.value.join('\n'));
  copiado.value = true;
}
</script>

<template>
  <div class="cartao">
    <!-- Códigos de recuperação: única vez que aparecem. -->
    <template v-if="backupCodes">
      <div class="topo">
        <h1>Verificação ativada</h1>
      </div>
      <div class="alerta">
        <strong>Guarde estes códigos agora.</strong>
        Eles não voltam a ser exibidos e são a sua única entrada se você perder o celular. Cada um serve uma vez só.
      </div>
      <ul class="codigos">
        <li v-for="c in backupCodes" :key="c">{{ c }}</li>
      </ul>
      <form @submit.prevent>
        <button type="button" class="secundario" @click="copiar">{{ copiado ? 'Copiado' : 'Copiar todos' }}</button>
        <button type="button" @click="emit('concluido')">Abrir o terminal</button>
        <p class="nota">Suas outras sessões foram encerradas.</p>
      </form>
    </template>

    <template v-else>
      <div class="topo">
        <h1>Verificação em duas etapas</h1>
        <p>Obrigatória nesta conta. Tenha o celular à mão.</p>
      </div>

      <div v-if="carregando && !dados" class="girando"></div>

      <template v-else-if="dados">
        <GoogleAuthAviso :emissor="dados.issuer" />

        <div v-if="qrDataUrl" class="qr">
          <img :src="qrDataUrl" class="codigo-qr" alt="QR Code para escanear com o Google Authenticator" />
          <img src="/favicon-192.png" class="icone" alt="" />
        </div>

        <div class="caixa">
          <small>Conta no Google Authenticator</small>
          <div><strong>{{ dados.issuer }}</strong> · {{ dados.label }}</div>
          <small style="margin-top: 8px">Chave</small>
          <code>{{ dados.secret }}</code>
          <div><a :href="dados.otpauthUri">Estou no celular — abrir no Google Authenticator</a></div>
        </div>

        <form @submit.prevent="confirmar">
          <input
            v-model="codigo"
            class="codigo"
            type="text"
            required
            autocomplete="one-time-code"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
          />
          <p v-if="erro" class="erro">{{ erro }}</p>
          <button type="submit" :disabled="carregando || codigo.trim().length !== 6">
            {{ carregando ? 'Ativando…' : 'Ativar' }}
          </button>
        </form>
      </template>

      <p v-else-if="erro" class="erro">{{ erro }}</p>
    </template>
  </div>
</template>
