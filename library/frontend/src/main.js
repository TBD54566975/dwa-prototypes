import './index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia';
import { MessageStoreLevel } from '../../common/src/message-store-level';
import App from './App.vue'

const messageStore = new MessageStoreLevel()
await messageStore.open();

createApp(App)
  .use(createPinia())
  .provide('messageStore', messageStore)
  .mount('#app')
