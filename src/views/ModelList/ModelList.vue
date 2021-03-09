<template>
    <div>
        <q-btn label="モデルビュー" to="modelview"/>
        <q-btn label="戻る" to="/"/>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class ModelList extends Vue {}
</script>
