<template>
    <q-btn
        :disable="disable"
        :flat="flat"
        :style="{
            borderRadius: square && 0
        }"
        @click="click"
    >
        <q-icon v-if="icon" :name="icon" class="absolute icon-left"/>
        <span>{{ label }}</span>
        <q-icon v-if="iconRight" :name="iconRight" class="absolute icon-right"/>
    </q-btn>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { QBtn } from 'quasar';

@Component
export default class EdgeIconBtn extends QBtn {
    @Prop({ type: Boolean, required: false, default: undefined })
    public disable?: boolean;

    @Prop({ type: Boolean, required: false, default: undefined })
    public flat?: boolean;

    @Prop({ type: String, required: false, default: undefined })
    public label?: string;

    @Prop({ type: String, required: false, default: undefined })
    public icon?: string;

    @Prop({ type: String, required: false, default: undefined })
    public iconRight?: string;

    @Prop({ type: Boolean, required: false, default: undefined })
    public square?: boolean;
}
</script>

<style lang="scss" scoped>
.icon-left {
    left: 12px;
}
.icon-right {
    right: 12px;
}
</style>
