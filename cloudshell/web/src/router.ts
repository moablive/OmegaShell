import { createRouter, createWebHistory } from 'vue-router';
import { sair } from './sessao';

// O terminal (/) não é rota daqui: é o ttyd, atrás do auth_request do nginx.
// Esta SPA só atende quem ainda não tem sessão.
export const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    { path: '/entrar', component: () => import('./views/EntrarView.vue') },
    // <platform_url>/setup-password?token=… — magic link do convite do LoginHUB.
    { path: '/setup-password', component: () => import('./views/SetupPasswordView.vue') },
    // Encerra a sessão do terminal (cookie do gateway + token do kit).
    { path: '/sair', component: { render: () => null }, beforeEnter: async () => { await sair(); return '/entrar'; } },
    { path: '/:resto(.*)*', redirect: '/entrar' },
  ],
});
