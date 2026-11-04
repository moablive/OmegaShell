<script setup lang="ts">
import { useInstalarPwa } from '@/lib/useInstalarPwa';

// Oferta de instalação do PWA, no mesmo formato do aviso de nova versão.
// No Chrome do Android e do desktop é um clique; no iPhone e no iPad — Chrome
// inclusive — vira passo a passo, porque o WebKit não deixa a página abrir o
// diálogo de instalação. O porquê está em useInstalarPwa.
const { podeInstalar, modo, passos, rotulo, instalando, instalar, dispensar } = useInstalarPwa();
</script>

<template>
  <Transition name="install-banner">
    <div v-if="podeInstalar" class="install-banner" role="region" aria-label="Instalar aplicativo">
      <div class="linha">
        <span class="ponto"></span>
        <div class="texto">
          <p class="titulo">Instalar o aplicativo</p>
          <p class="descricao">
            {{
              modo === 'prompt'
                ? 'Abre em janela própria, com ícone na tela de início e sem a barra do navegador.'
                : `No iPhone e no iPad a instalação é pelo menu do ${rotulo}:`
            }}
          </p>
          <ol v-if="modo === 'ios'" class="passos">
            <li v-for="(passo, i) in passos" :key="i">{{ passo }}</li>
          </ol>
        </div>
      </div>

      <div class="acoes">
        <button type="button" class="btn-depois" :disabled="instalando" @click="dispensar">
          {{ modo === 'ios' ? 'Entendi' : 'Agora não' }}
        </button>
        <button
          v-if="modo === 'prompt'"
          type="button"
          class="btn-agora"
          :disabled="instalando"
          @click="instalar"
        >
          {{ instalando ? 'Instalando…' : 'Instalar' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.install-banner {
  /* Cores do tema deste app — é a única parte que muda entre as quatro cópias. */
  --ib-fundo: var(--cartao);
  --ib-texto: var(--texto);
  --ib-suave: var(--apagado);
  --ib-borda: var(--borda);
  --ib-marca: var(--acento);
  --ib-marca-texto: #14141f;

  position: fixed;
  /* Um degrau abaixo do aviso de versão: se os dois aparecerem, atualizar vem
     na frente de instalar. */
  z-index: 9999;
  left: 12px;
  right: 12px;
  top: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--ib-fundo);
  color: var(--ib-texto);
  border: 1px solid var(--ib-borda);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
}

@media (min-width: 640px) {
  .install-banner {
    left: auto;
    width: 330px;
  }
}

.linha {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.ponto {
  margin-top: 6px;
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--ib-marca);
}

.texto { min-width: 0; }

.titulo {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
}

.descricao {
  margin: 2px 0 0;
  font-size: 0.78rem;
  line-height: 1.35;
  color: var(--ib-suave);
}

.passos {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--ib-texto);
}

.acoes {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.acoes button {
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.acoes button:disabled { opacity: 0.6; cursor: wait; }

.btn-depois {
  background: transparent;
  color: var(--ib-suave);
}
.btn-depois:hover:not(:disabled) { background: var(--ib-borda); color: var(--ib-texto); }

.btn-agora {
  background: var(--ib-marca);
  color: var(--ib-marca-texto);
}
.btn-agora:hover:not(:disabled) { filter: brightness(1.1); }

.install-banner-enter-active,
.install-banner-leave-active { transition: opacity 0.25s, transform 0.25s; }
.install-banner-enter-from,
.install-banner-leave-to { opacity: 0; transform: translateY(-12px); }
</style>
