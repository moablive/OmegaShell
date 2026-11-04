<script setup lang="ts">
import InstallBanner from '@/components/InstallBanner.vue';
</script>

<template>
  <main class="fundo">
    <RouterView />
  </main>
  <!-- Oferta de instalar o PWA (a mesma do painel dos artistas, apps/artist). Mora aqui, na tela de entrar: o terminal
       em si é a página do ttyd, que não passa por este app Vue. -->
  <InstallBanner />
</template>
