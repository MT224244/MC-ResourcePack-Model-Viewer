import Vue from 'vue';

import router from '@/router';
import '@/plugins/quasar';

import { App } from '@/layouts/App';

Vue.config.productionTip = false;

new Vue({
    router,
    render: h => h(App)
}).$mount('#app');
