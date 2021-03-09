import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

import { Home } from '@/views/Home';
import { ModelList } from '@/views/ModelList';
import { ModelView } from '@/views/ModelView';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/modellist',
        name: 'ModelList',
        component: ModelList
    },
    {
        path: '/modelview',
        name: 'ModelView',
        component: ModelView
    }
];

const router = new VueRouter({
    mode: 'hash',
    base: process.env.BASE_URL,
    routes
});

export default router;
