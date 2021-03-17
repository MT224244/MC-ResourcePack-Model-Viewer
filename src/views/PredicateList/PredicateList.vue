<template>
    <div class="full-width full-height">
        <q-splitter unit="px" :value="250" disable class="full-height">
            <template #before>
                <div class="column no-wrap full-height q-py-md">
                    <div
                        class="full-width text-caption text-weight-bold q-px-sm"
                        style="overflow-wrap: anywhere;"
                    >{{ modelId }}</div>
                    <div class="q-mt-md">
                        <SearchBox v-model="searchText" @input="search"/>
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
                        :items="predicates"
                        @item-click="multiModelCanvas_onItemClick"
                    />
                </div>
            </template>
        </q-splitter>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import { SearchBox } from '@/components/SearchBox';
import { EdgeIconBtn } from '@/components/EdgeIconBtn';
import { MultiModelCanvas } from '@/components/MultiModelCanvas';

@Component({
    components: {
        SearchBox,
        EdgeIconBtn,
        MultiModelCanvas
    }
})
export default class PredicateList extends Vue {
    private allPredicates: PredicateData[] = [];
    private predicates: PredicateData[] = [];

    private modelId = '';

    private searchText = '';

    public mounted() {
        const { id, modelData } = this.$route.query;

        if (typeof id === 'string') {
            this.modelId = id;
        }

        if (typeof modelData === 'string') {
            const { overrides }: ModelData = JSON.parse(modelData);

            if (overrides) {
                for (const override of overrides) {
                    const array: PredicateData['predicates'] = [];
                    for (const key of Object.keys(override.predicate) as ModelOverridePredicate[]) {
                        array.push({
                            name: key,
                            value: override.predicate[key]
                        });
                    }
                    this.allPredicates.push({
                        predicates: array,
                        modelId: override.model
                    });
                }

                this.predicates = this.allPredicates;
            }
        }
    }

    private search() {
        this.predicates = [];
        process.nextTick(() => {
            this.predicates = this.allPredicates.filter(x => {
                return x.modelId.includes(this.searchText || '');
            });
        });
    }

    private multiModelCanvas_onItemClick(id: string) {
        this.$router.push(`modelview?id=${id}`);
    }

    private btnReturn_onClick() {
        this.$router.back();
    }
}
</script>
