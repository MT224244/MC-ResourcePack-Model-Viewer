<template>
    <div class="full-width full-height">
        <q-splitter unit="px" :value="250" disable class="full-height">
            <template #before>
                <div class="column full-height q-py-md">
                    <div>
                        <SearchBox v-model="searchText" @input="search"/>
                        <q-list dense class="q-mt-md modeltype-list">
                            <q-item
                                clickable
                                :active="selectedModelType === 'block'"
                                @click="changeModelType('block')"
                            >
                                <q-item-section>
                                    <q-item-label class="text-center">ブロック</q-item-label>
                                </q-item-section>
                            </q-item>
                            <q-item
                                clickable
                                :active="selectedModelType === 'item'"
                                @click="changeModelType('item')"
                            >
                                <q-item-section>
                                    <q-item-label class="text-center">アイテム</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
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
                <div class="full-height">
                    <MultiModelCanvas
                        :items="modelIds"
                        @item-click="multiModelCanvas_onItemClick"
                    />
                </div>
            </template>
        </q-splitter>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { Global } from '@/renderer/Global';

import { SearchBox } from '@/components/SearchBox';
import { EdgeIconBtn } from '@/components/EdgeIconBtn';
import { MultiModelCanvas } from '@/components/MultiModelCanvas';

type ModelType =
    | 'block'
    | 'item';

@Component({
    components: {
        SearchBox,
        EdgeIconBtn,
        MultiModelCanvas
    }
})
export default class ModelList extends Vue {
    private allModelIds: string[] = [];
    private modelIds: string[] = [];

    private searchText = '';

    private selectedModelType: ModelType = 'block';

    public mounted() {
        this.allModelIds = Global.ResourcePackLoader.GetBlockModelIds();
        this.modelIds = this.allModelIds;
    }

    private changeModelType(modelType: ModelType) {
        if (modelType === 'block') {
            this.allModelIds = Global.ResourcePackLoader.GetBlockModelIds();
        }
        else if (modelType === 'item') {
            this.allModelIds = Global.ResourcePackLoader.GetItemModelIds();
        }

        this.selectedModelType = modelType;
        this.search();
    }

    private search() {
        this.modelIds = [];
        process.nextTick(() => {
            this.modelIds = this.allModelIds.filter(x => {
                return x.includes(this.searchText || '');
            });
        });
    }

    private multiModelCanvas_onItemClick(id: string, modelData: ModelData) {
        if (modelData.overrides) {
            this.$router.push(`predicatelist?id=${id}&modelData=${JSON.stringify(modelData)}`);
        }
        else {
            this.$router.push(`modelview?id=${id}`);
        }
    }

    private btnReturn_onClick() {
        this.$router.back();
    }
}
</script>

<style lang="scss" scoped>
.modeltype-list {
    .q-item--active {
        color: #fff;
        background-color: rgba(#fff, 0.1);
    }
}
</style>
