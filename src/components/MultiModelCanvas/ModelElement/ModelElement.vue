<template>
    <q-item
        clickable
        v-ripple
        class="q-py-xs q-px-md"
        :class="!isSupported && 'text-red'"
        :disable="!isSupported"
        @click="$emit('click', id, modelData)"
    >
        <q-item-section avatar>
            <div ref="element" class="element"></div>
        </q-item-section>
        <q-item-section>
            <q-item-label
                lines="1"
                class="non-selectable text-body1"
            >{{ id }}</q-item-label>
            <q-item-label
                lines="1"
                class="non-selectable text-caption text-grey"
            >ModelType: {{ type }}</q-item-label>
            <q-item-label
                v-if="predicateData"
                lines="1"
                class="non-selectable text-caption text-grey"
            >
                {{ predicateData.predicates.map(x => `${x.name}: ${x.value}`).join(', ') }}
            </q-item-label>
            <q-item-label
                v-else-if="overridesCount > 0"
                lines="1"
                class="non-selectable text-caption text-grey"
            >Overrides: {{ overridesCount }}</q-item-label>
        </q-item-section>
    </q-item>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import * as THREE from 'three';

import { Global } from '@/renderer/Global';
import { IModel } from '@/renderer/IModel';
import { ModelLoader } from '@/renderer/ModelLoader';

type ModelType =
    | 'Block'
    | 'Item'
    | 'Entity'
    | 'Unknown';

@Component
export default class ModelElement extends Vue {
    public scene: THREE.Scene | null = null;

    @Prop({ type: String, required: true })
    private readonly id!: string;

    @Prop({ type: Object, required: false, default: undefined })
    private readonly predicateData?: PredicateData;

    @Ref('element')
    private element!: HTMLDivElement;

    private modelData: ModelData | null = null;

    private type: ModelType = 'Unknown';

    private overridesCount = 0;

    private get isSupported() {
        if (this.type === 'Block') return true;
        else if (this.type === 'Item') return true;
        else return false;
    }

    public mounted() {
        this.scene = new THREE.Scene();

        const modelLoader = new ModelLoader(Global.ResourcePackLoader);

        try {
            this.modelData = modelLoader.LoadModelData(this.id);
            const model = modelLoader.LoadModel(this.modelData);
            model.position.set(-8, -8, -8);
            this.scene.add(model);

            if (this.modelData.parent) {
                if (this.modelData.parent === 'builtin/generated') {
                    this.type = 'Item';
                }
                else if (this.modelData.parent === 'builtin/entity') {
                    this.type = 'Entity';
                }
                else {
                    this.type = 'Unknown';
                }
            }
            else {
                this.type = 'Block';
            }

            if (this.modelData.overrides) {
                this.overridesCount = this.modelData.overrides.length;
            }

            const light = new THREE.AmbientLight('white');
            this.scene.add(light);

            if (this.modelData.display && this.modelData.display.gui) {
                const { rotation, translation, scale } = this.modelData.display.gui;

                // rotation
                if (rotation) {
                    this.scene.rotateX(THREE.MathUtils.degToRad(rotation[0]));
                    this.scene.rotateY(THREE.MathUtils.degToRad(rotation[1]));
                    this.scene.rotateZ(THREE.MathUtils.degToRad(rotation[2]));
                }

                // translation
                if (translation) {
                    model.position.x += translation[0];
                    model.position.y += translation[1];
                    model.position.z += translation[2];
                }

                // scale
                if (scale) {
                    model.scale.set(scale[0], scale[1], scale[2]);
                    model.position.x *= scale[0];
                    model.position.y *= scale[1];
                    model.position.z *= scale[2];
                }
            }
            else {
                if (this.type === 'Block') {
                    this.scene.rotateX(THREE.MathUtils.degToRad(30));
                    this.scene.rotateY(THREE.MathUtils.degToRad(225));
                    this.scene.rotateZ(THREE.MathUtils.degToRad(0));

                    model.scale.set(0.625, 0.625, 0.625);
                    model.position.x *= 0.625;
                    model.position.y *= 0.625;
                    model.position.z *= 0.625;
                }
            }
        }
        catch {
            this.scene = null;
            return;
        }

        this.scene.userData.element = this.element;
        this.scene.userData.camera = new THREE.OrthographicCamera(-8, 8, 8, -8);
        this.scene.userData.camera.position.z = 50;
        this.scene.userData.camera.lookAt(0, 0, 0);
    }

    public destroyed() {
        if (!this.scene) return;

        delete this.scene.userData.element;
        delete this.scene.userData.camera;

        const model = this.scene.children[0] as IModel;
        model.Dispose();
        this.scene.remove(model);

        const light = this.scene.children[0] as THREE.AmbientLight;
        this.scene.remove(light);

        this.scene = null;
        this.modelData = null;
    }
}
</script>

<style lang="scss" scoped>
.element {
    width: 64px;
    height: 64px;
    background-color: grey;
}
</style>
