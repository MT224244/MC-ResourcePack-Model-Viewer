<template>
    <div class="resourcepack-list">
        <div class="q-pt-xs text-center">リソースパック一覧</div>
        <q-separator class="q-my-xs q-mx-sm"/>
        <div class="list-wrapper">
            <q-list class="full-height">
                <q-virtual-scroll
                    :items="resourcePacks"
                    :virtual-scroll-item-size="48"
                    :virtual-scroll-slice-size="70"
                    class="full-height"
                >
                    <template v-slot="{ item, index }">
                        <q-item
                            clickable
                            v-ripple
                            :key="index"
                            :active="selectedPack === item"
                            class="q-py-xs q-px-md"
                            @click="emitInput(item)"
                        >
                            <q-item-section avatar>
                                <q-img v-if="!item.ErrorMessage" width="64px" height="64px" :src="item.PackIcon">
                                    <q-page-sticky position="bottom-left" class="pack-format">
                                        <small>{{ item.PackFormat }}</small>
                                    </q-page-sticky>
                                </q-img>
                                <q-icon v-else size="64px" color="red" name="mdi-alert-circle-outline"/>
                            </q-item-section>
                            <q-item-section>
                                <q-item-label
                                    lines="1"
                                    class="non-selectable text-body1"
                                >{{ item.PackName }}</q-item-label>
                                <q-item-label
                                    v-if="!item.ErrorMessage"
                                    caption
                                    lines="1"
                                    class="non-selectable"
                                >{{ item.PackDescription }}</q-item-label>
                                <q-item-label
                                    v-else
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
        <div class="row justify-center q-py-xs buttons">
            <q-btn
                flat
                size="sm"
                label="フォルダ"
                icon="mdi-plus"
                @click="btnAddFolder_onClick"
            />
            <q-btn
                flat
                size="sm"
                label="Zip"
                icon="mdi-plus"
                @click="btnAddZip_onClick"
            />

            <q-separator vertical class="q-mx-xs"/>

            <q-btn
                flat
                size="sm"
                icon="mdi-chevron-up"
                :disable="!selectedPack || selectedIdx <= 0"
                @click="btnMoveUp_onClick"
            />
            <q-btn
                flat
                size="sm"
                icon="mdi-chevron-down"
                :disable="!selectedPack || selectedIdx >= resourcePacks.length - 1"
                @click="btnMoveDown_onClick"
            />
            <q-btn
                flat
                size="sm"
                icon="mdi-delete-outline"
                color="red-5"
                :disable="!selectedPack"
                @click="btnRemove_onClick"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, PropSync, Emit, Vue } from 'vue-property-decorator';

import { IpcRenderer } from '@/renderer/IpcRenderer';
import { ResourcePackLoader } from '@/renderer/ResourcePackLoader';
import { ResourcePack } from '@/renderer/ResourcePack';

@Component
export default class ResourcePackList extends Vue {
    @PropSync('value', { type: Object, default: null })
    private readonly selectedPack!: ResourcePack | null;

    private resourcePacks: ResourcePack[] = [];

    private get selectedIdx() {
        return this.resourcePacks.findIndex(x => x === this.selectedPack);
    }

    public mounted() {
        // 配列の参照自体を渡してるので変更が連動する
        this.resourcePacks = ResourcePackLoader.ResourcePacks;
    }

    @Emit('input')
    private emitInput(pack: ResourcePack | null) {
        return pack;
    }

    private btnAddFolder_onClick() {
        IpcRenderer.Invoke('ResourcePackList_open-dirpicker').then(paths => {
            if (!paths) return;

            for (const dirPath of paths) {
                ResourcePackLoader.AddResourcePack(dirPath);
            }
        });
    }

    private btnAddZip_onClick() {
        IpcRenderer.Invoke('ResourcePackList_open-filepicker').then(paths => {
            if (!paths) return;

            for (const filePath of paths) {
                ResourcePackLoader.AddResourcePack(filePath);
            }
        });
    }

    private btnMoveUp_onClick() {
        if (!this.selectedPack) return;
        const idx = this.selectedIdx;

        const pack = this.resourcePacks.splice(idx, 1)[0];
        this.resourcePacks.splice(idx - 1, 0, pack);
    }

    private btnMoveDown_onClick() {
        if (!this.selectedPack) return;
        const idx = this.selectedIdx;

        const pack = this.resourcePacks.splice(idx, 1)[0];
        this.resourcePacks.splice(idx + 1, 0, pack);
    }

    private btnRemove_onClick() {
        if (!this.selectedPack) return;
        let idx = this.selectedIdx;

        ResourcePackLoader.RemoveResourcePack(this.selectedPack.PackPath);

        if (this.resourcePacks.length > 0) {
            if (idx === 0) {
                idx = 0;
            }
            else if (idx > this.resourcePacks.length - 1) {
                idx = this.resourcePacks.length - 1;
            }

            this.emitInput(this.resourcePacks[idx]);
        }
        else {
            this.emitInput(null);
        }
    }
}
</script>

<style lang="scss" scoped>
.list-wrapper {
    height: calc(100% - 34px - 45px);
    .q-item--active {
        color: #fff;
        background-color: rgba(#fff, 0.1);
    }
    .pack-format {
        width: 20px;
        height:20px;
        padding: 0;
    }
}
.buttons {
    height: 40px;
}
</style>
