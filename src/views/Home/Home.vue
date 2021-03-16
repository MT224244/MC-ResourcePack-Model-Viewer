<template>
    <div
        class="full-width full-height"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
    >
        <q-splitter unit="px" :value="350" disable class="full-height">
            <template #before>
                <ResourcePackList class="full-width full-height" v-model="selectedPack"/>
            </template>
            <template #after>
                <q-btn
                    label="モデル一覧へ"
                    icon-right="mdi-arrow-right-thick"
                    @click="btnNext_onClick"
                />
                <div>{{ selectedPack }}</div>
            </template>
        </q-splitter>
        <div class="absolute-full flex justify-center items-center drag-overlay">
            <q-icon size="50px" name="mdi-plus"/>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { ResourcePackLoader } from '@/renderer/ResourcePackLoader';
import { ResourcePack } from '@/renderer/ResourcePack';

import { ResourcePackList } from '@/components/ResourcePackList';

@Component({
    components: {
        ResourcePackList
    }
})
export default class Home extends Vue {
    private selectedPack: ResourcePack | null = null;

    private btnNext_onClick() {
        this.$router.push('modellist');
    }

    private onDragOver(ev: DragEvent) {
        ev.stopPropagation();
        ev.preventDefault();

        this.$el.classList.add('hover');
    }

    private onDragLeave(ev: DragEvent) {
        ev.stopPropagation();
        ev.preventDefault();

        if (ev.target === ev.currentTarget) {
            this.$el.classList.remove('hover');
        }
    }

    private onDrop(ev: DragEvent) {
        ev.stopPropagation();
        ev.preventDefault();

        this.$el.classList.remove('hover');

        if (ev.dataTransfer) {
            for (const file of ev.dataTransfer.files) {
                ResourcePackLoader.AddResourcePack(file.path);
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.drag-overlay {
    background-color: rgba(#fff, 0.2);
    opacity: 0;
    pointer-events: none;
    z-index: 10000;
}
.hover {
    ::v-deep * {
        pointer-events: none;
    }
    .drag-overlay {
        opacity: 1;
    }
}
</style>
