<template>
    <q-layout>
        <q-bar class="q-px-none fixed-top titlebar">
            <div class="drag-area"/>
            <span class="q-pl-sm text-subtitle2">{{ title }} v{{ version }}</span>

            <q-space/>

            <SystemButton
                icon="mdi-information-outline"
                tooltip="About"
                :color="isAboutDialogOpen ? 'grey-7' : undefined"
                @click="isAboutDialogOpen = !isAboutDialogOpen"
            />

            <q-separator vertical class="q-mx-xs q-my-xs"/>

            <SystemButton
                icon="mdi-window-minimize"
                @click="btnMinimize_onClick"
            />
            <SystemButton
                :icon="isMaximize ? 'mdi-window-restore' : 'mdi-window-maximize'"
                @click="btnMaximize_onClick"
            />
            <SystemButton
                icon="mdi-window-close"
                @click="btnClose_onClick"
            />
        </q-bar>

        <q-page-container class="fixed-bottom content row">
            <router-view/>
        </q-page-container>

        <AboutDialog v-model="isAboutDialogOpen"/>
    </q-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { IpcRenderer } from '@/renderer/IpcRenderer';

import { version } from '@/../package.json';

import { SystemButton } from '@/components/SystemButton';
import { AboutDialog } from '@/components/AboutDialog';

@Component({
    components: {
        SystemButton,
        AboutDialog
    },
    data: () => ({
        version
    })
})
export default class App extends Vue {
    public title = 'MC ResourcePack Model Viewer';

    public isMaximize = false;

    public isAboutDialogOpen = false;

    public mounted() {
        IpcRenderer.On('maximize', (_, isMaximize) => {
            this.isMaximize = isMaximize;
        });
    }

    public btnMinimize_onClick() {
        IpcRenderer.Invoke('App_minimize');
    }

    public btnMaximize_onClick() {
        IpcRenderer.Invoke('App_maximize');
    }

    public btnClose_onClick() {
        IpcRenderer.Invoke('App_close');
    }
}
</script>

<style lang="scss">
html, body {
    overflow: hidden;
}

* {
    user-select: none;
}

::-webkit-scrollbar {
    width: 12px;
    background-color: rgba(#fff, 0.1);
}
::-webkit-scrollbar-thumb {
    background-color: rgba(#fff, 0.3);
}
</style>

<style lang="scss" scoped>
.titlebar {
    height: 25px;
    z-index: 1000;
    .drag-area {
        -webkit-app-region: drag;
        position: absolute;
        top: 3px;
        width: 100%;
        height: 22px;
    }
}
.content {
    height: calc(100vh - 25px);
}
</style>
