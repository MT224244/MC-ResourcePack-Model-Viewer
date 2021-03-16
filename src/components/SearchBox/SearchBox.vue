<template>
    <q-input
        dense
        filled
        square
        clearable
        label="検索"
        v-model="searchText"
        @input="emitInput"
    >
        <template #prepend>
            <q-icon name="mdi-magnify"/>
        </template>
    </q-input>
</template>

<script lang="ts">
import { Component, PropSync, Emit, Vue } from 'vue-property-decorator';

@Component
export default class SearchBox extends Vue {
    @PropSync('value')
    public searchText!: string;

    @Emit('input')
    public emitInput(value: string) {
        return value;
    }
}
</script>
