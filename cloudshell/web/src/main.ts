import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './estilo.css';

createApp(App).use(router).mount('#app');

if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js');
