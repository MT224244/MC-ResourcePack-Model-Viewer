<template>
    <div
        class="full-width full-height"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
    >
        <q-splitter unit="px" :value="350" disable class="full-height">
            <template #before>
                <div class="q-mt-xs text-center">リソースパック一覧</div>
                <q-separator class="q-my-xs q-mx-sm"/>
                <div style="height: calc(100% - 34px - 45px)">
                    <q-list class="full-height">
                        <q-virtual-scroll
                            :items="resourcePacks"
                            :virtual-scroll-item-size="48"
                            :virtual-scroll-slice-size="70"
                            class="full-height"
                        >
                            <template v-slot="{ item, index }">
                                <q-item
                                    v-if="!item.ErrorMessage"
                                    clickable
                                    v-ripple
                                    :key="index"
                                    class="q-py-xs q-px-md"
                                >
                                    <q-item-section avatar>
                                        <q-img width="64px" height="64px" :src="item.PackIcon">
                                            <q-page-sticky position="bottom-left" style="padding: 0;width: 20px;height:20px">
                                                <small>{{ item.PackFormat }}</small>
                                            </q-page-sticky>
                                        </q-img>
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label
                                            lines="1"
                                            class="non-selectable text-body1"
                                        >{{ item.PackName }}</q-item-label>
                                        <q-item-label
                                            caption
                                            lines="1"
                                            class="non-selectable"
                                        >{{ item.PackDescription }}</q-item-label>
                                    </q-item-section>
                                </q-item>
                                <q-item
                                    v-else
                                    clickable
                                    v-ripple
                                    :key="index"
                                    class="q-py-xs q-px-md"
                                >
                                    <q-item-section avatar>
                                        <q-icon size="64px" color="red" name="mdi-alert-circle-outline"/>
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label
                                            lines="1"
                                            class="non-selectable text-body1"
                                        >{{ item.PackName }}</q-item-label>
                                        <q-item-label
                                            caption
                                            lines="1"
                                            class="non-selectable"
                                        >{{ item.ErrorMessage }}</q-item-label>
                                    </q-item-section>
                                </q-item>
                            </template>
                        </q-virtual-scroll>
                    </q-list>
                </div>
                <q-separator class="q-mt-xs q-mx-sm"/>
                <div class="row justify-center q-py-xs" style="height: 40px">
                    <q-btn flat size="sm" label="フォルダ" icon="mdi-plus"/>
                    <q-btn flat size="sm" label="Zip" icon="mdi-plus"/>
                    <q-separator vertical class="q-mx-xs"/>
                    <q-btn flat size="sm" icon="mdi-chevron-up"/>
                    <q-btn flat size="sm" icon="mdi-chevron-down"/>
                    <q-btn flat size="sm" icon="mdi-close" color="red"/>
                </div>
            </template>
            <template #after>
                <q-btn label="モデルリスト" @click="btnNext_onClick"/>
            </template>
        </q-splitter>
        <div class="absolute-full flex justify-center items-center drag-overlay">
            <q-icon size="50px" name="mdi-plus"/>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Global } from '@/renderer/Global';
import { ResourcePack } from '@/renderer/ResourcePack';

@Component
export default class Home extends Vue {
    private resourcePacks: ResourcePack[] = [];

    public mounted() {
        this.resourcePacks = Global.ResourcePackLoader.ResourcePacks;
    }

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
                Global.ResourcePackLoader.AddResourcePack(file.path);
            }

            this.resourcePacks = Global.ResourcePackLoader.ResourcePacks;
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
