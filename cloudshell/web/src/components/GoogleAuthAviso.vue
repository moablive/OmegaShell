<script setup lang="ts">
// Indicativo visual de "escaneie com o Google Authenticator".
//
// Antes a tela dizia "Google Authenticator, Authy, 1Password ou Microsoft
// Authenticator" em texto corrido e a pessoa parava no QR sem saber com o que
// ler. Agora um app só é o caminho indicado, com ícone, passos e loja; os
// outros continuam funcionando e são citados no rodapé.
//
// Cópia do mesmo componente do LoginHUB (features/twoFactor/GoogleAuthenticator.tsx),
// repetida em cada app da suíte: mesmo texto, mesmos links. Mudou aqui, mude lá.
//
// `modo="cadastro"` vai acima do QR; `modo="codigo"` vai na tela do login que
// pede os 6 dígitos. `emissor` é o nome que o hub pôs no QR — o título da
// entrada no celular —, então a tela manda procurar exatamente por ele.
withDefaults(defineProps<{
  modo?: 'cadastro' | 'codigo';
  emissor?: string;
  cor?: string;
}>(), {
  modo: 'cadastro',
  emissor: '',
  cor: '#b388ff',
});

const PLAY = 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2';
const APPSTORE = 'https://apps.apple.com/app/google-authenticator/id388497605';
</script>

<template>
  <div class="ga" :class="`ga--${modo}`" :style="{ '--ga-cor': cor }">
    <div class="ga-topo">
      <!-- Ícone desenhado aqui (as cores do Google), sem imagem remota. -->
      <svg class="ga-icone" viewBox="0 0 48 48" aria-hidden="true">
        <rect width="48" height="48" rx="11" fill="#fff" />
        <path d="M24 8a16 16 0 0 1 13.86 8L31 20a8 8 0 0 0-7-4z" fill="#EA4335" />
        <path d="M37.86 16a16 16 0 0 1 0 16L31 28a8 8 0 0 0 0-8z" fill="#FBBC05" />
        <path d="M37.86 32A16 16 0 0 1 24 40v-8a8 8 0 0 0 7-4z" fill="#34A853" />
        <path d="M24 40a16 16 0 0 1 0-32v8a8 8 0 0 0 0 16z" fill="#4285F4" />
        <rect x="24" y="21.5" width="16" height="5" rx="2.5" fill="#4285F4" />
        <circle cx="24" cy="24" r="4" fill="#fff" />
      </svg>

      <div v-if="modo === 'cadastro'">
        <p class="ga-chamada">Escaneie com</p>
        <p class="ga-nome">Google Authenticator</p>
      </div>
      <p v-else class="ga-linha">
        Abra o <strong>Google Authenticator</strong> e digite o código de 6 dígitos
        <template v-if="emissor"> de <strong>{{ emissor }}</strong></template><template v-else> desta conta</template>.
      </p>
    </div>

    <template v-if="modo === 'cadastro'">
      <ol class="ga-passos">
        <li><b>1.</b> Abra o Google Authenticator no celular.</li>
        <li><b>2.</b> Toque em <strong>+</strong> e depois em <strong>Ler código QR</strong>.</li>
        <li><b>3.</b> Digite abaixo os 6 dígitos que aparecem em <strong>{{ emissor || 'nome do aplicativo' }}</strong>.</li>
      </ol>
      <p class="ga-lojas">
        Ainda não tem?
        <a :href="PLAY" target="_blank" rel="noreferrer">Android</a>
        ·
        <a :href="APPSTORE" target="_blank" rel="noreferrer">iPhone</a>
      </p>
      <p class="ga-outros">Authy, 1Password e Microsoft Authenticator também funcionam.</p>
    </template>
  </div>
</template>

<style scoped>
/* Cores por transparência sobre `currentColor`: o mesmo bloco serve em tela
   clara e escura sem saber qual é. Só a cor da marca vem de fora. */
.ga {
  border: 2px solid color-mix(in srgb, var(--ga-cor) 55%, transparent);
  background: color-mix(in srgb, var(--ga-cor) 9%, transparent);
  border-radius: 14px;
  padding: 14px 16px;
  text-align: left;
  line-height: 1.45;
}
.ga--codigo { border-width: 1px; padding: 10px 12px; }
.ga-topo { display: flex; align-items: center; gap: 12px; }
.ga-icone { width: 40px; height: 40px; flex-shrink: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,.25)); }
.ga--codigo .ga-icone { width: 32px; height: 32px; }
.ga-chamada {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ga-cor);
}
.ga-nome { margin: 0; font-size: 1.05rem; font-weight: 700; }
.ga-linha { margin: 0; font-size: 0.85rem; }
.ga-passos { margin: 12px 0 0; padding: 0; list-style: none; font-size: 0.85rem; }
.ga-passos li { margin-top: 3px; }
.ga-passos b { color: var(--ga-cor); }
.ga-lojas { margin: 10px 0 0; font-size: 0.78rem; opacity: 0.85; }
.ga-lojas a { color: var(--ga-cor); font-weight: 700; text-decoration: none; }
.ga-lojas a:hover { text-decoration: underline; }
.ga-outros { margin: 4px 0 0; font-size: 0.72rem; opacity: 0.6; }
</style>
