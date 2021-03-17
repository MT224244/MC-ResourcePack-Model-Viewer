<template>
    <div class="full-width full-height">
        <q-splitter unit="px" :value="250" disable class="full-height">
            <template #before>
                <div class="column no-wrap full-height q-py-md">
                    <div
                        class="full-width text-caption text-weight-bold q-px-sm"
                        style="overflow-wrap: anywhere;"
                    >{{ modelId }}</div>
                    <div class="row items-center justify-between q-mt-md q-pl-md q-pr-sm">
                        <span>平行投影</span>
                        <q-toggle v-model="isOrthoMode"/>
                    </div>
                    <q-space/>
                    <EdgeIconBtn
                        flat
                        square
                        label="戻る"
                        icon="mdi-chevron-left"
                        @click="btnReturn_onClick"
                    />
                </div>
            </template>
            <template #after>
                <ModelCanvas
                    :orthographic-mode="isOrthoMode"
                    class="no-scroll"
                    v-model="modelId"
                />
            </template>
        </q-splitter>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { EdgeIconBtn } from '@/components/EdgeIconBtn';
import { ModelCanvas } from '@/components/ModelCanvas';

@Component({
    components: {
        EdgeIconBtn,
        ModelCanvas
    }
})
export default class ModelView extends Vue {
    private modelId = '';

    private isOrthoMode = false;

    public mounted() {
        const { id } = this.$route.query;

        if (typeof id === 'string') {
            this.modelId = id;
        }
    }

    private btnReturn_onClick() {
        this.$router.back();
    }
}
</script>
