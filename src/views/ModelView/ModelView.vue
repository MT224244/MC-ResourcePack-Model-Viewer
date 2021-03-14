<template>
    <div class="full-width full-height">
        <ModelCanvas
            :orthographic-mode="isOrthoMode"
            v-model="modelId"
        />
        <q-drawer
            bordered
            side="left"
            :width="200"
            :breakpoint="0"
            :value="true"
        >
            <q-scroll-area class="fit">
                <div class="q-pa-sm">
                    <q-btn label="戻る" @click="btnReturn_onClick"/>
                    <q-btn label="平行投影モード" @click="btnOrthographicMode_onClick"/>
                    <small>{{ modelId }}</small>
                </div>
            </q-scroll-area>
        </q-drawer>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Global } from '@/renderer/Global';

import { ModelCanvas } from '@/components/ModelCanvas';

@Component({
    components: {
        ModelCanvas
    }
})
export default class ModelView extends Vue {
    private modelId = '';

    private isOrthoMode = false;

    public mounted() {
        this.modelId = Global.SelectedModelId || '';
    }

    private btnOrthographicMode_onClick() {
        this.isOrthoMode = !this.isOrthoMode;
    }

    private btnReturn_onClick() {
        this.$router.back();
    }
}
</script>
