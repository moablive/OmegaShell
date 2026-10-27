import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// Os assets ficam em /entrar/ para não brigar com as rotas do ttyd (/, /token, /ws).
export default defineConfig({
  base: '/entrar/',
  // Ícones moram em /srv/pwa (servidos pelo nginx), não no bundle: caminho absoluto fica como está.
  plugins: [vue({ template: { transformAssetUrls: { includeAbsolute: false } } })],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
