<template>
    <div class="full-width full-height">
        <q-splitter unit="px" :value="250" disable class="full-height">
            <template #before>
                <div class="full-height">
                    <q-btn label="モデルビュー" to="modelview"/>
                    <q-btn label="戻る" to="/"/>
                    <SearchBox v-model="searchText" @input="search"/>
                </div>
            </template>
            <template #after>
                <div class="full-height">
                    <MultiModelCanvas
                        :model-ids="modelIds"
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
import { MultiModelCanvas } from '@/components/MultiModelCanvas';

@Component({
    components: {
        SearchBox,
        MultiModelCanvas
    }
})
export default class ModelList extends Vue {
    private allModelIds: string[] = [];
    private modelIds: string[] = [];

    private searchText = '';

    public mounted() {
        this.allModelIds = Global.ResourcePackLoader.GetItemModelIds();
        this.modelIds = this.allModelIds;
    }

    private search() {
        this.modelIds = [];
        process.nextTick(() => {
            this.modelIds = this.allModelIds.filter(x => {
                return x.includes(this.searchText || '');
            });
        });
    }

    private multiModelCanvas_onItemClick(id: string) {
        Global.SelectedModelId = id;
        this.$router.push('modelview');
    }
}
</script>
