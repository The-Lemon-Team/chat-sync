import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { register } from 'vue-advanced-chat';
import App from './App.vue';
import './style.css';

register();

createApp(App).use(createPinia()).mount('#app');
