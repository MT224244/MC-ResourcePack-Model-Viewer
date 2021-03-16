<template>
    <div class="full-width full-height row">
        <q-list class="full-width full-height">
            <q-virtual-scroll
                :items="items"
                :virtual-scroll-item-size="100"
                :virtual-scroll-slice-size="1"
                class="full-height"
            >
                <template v-slot="{ item, index }">
                    <ModelElement
                        v-if="item.modelId"
                        :ref="`item${index}`"
                        :key="index"
                        :id="item.modelId"
                        :predicateData="item"
                        @click="(id, modelData) => $emit('item-click', id, modelData)"
                    />
                    <ModelElement
                        v-else
                        :ref="`item${index}`"
                        :key="index"
                        :id="item"
                        @click="(id, modelData) => $emit('item-click', id, modelData)"
                    />
                </template>
            </q-virtual-scroll>
        </q-list>
        <canvas ref="canvas" class="absolute full-width full-height no-pointer-events"/>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import * as THREE from 'three';

import { ModelElement } from '@/components/MultiModelCanvas/ModelElement';

@Component({
    components: {
        ModelElement
    }
})
export default class MultiModelCanvas extends Vue {
    @Prop({ type: Array, required: true })
    private readonly items!: (string | PredicateData)[];

    @Ref('canvas')
    private canvas!: HTMLCanvasElement;

    private renderer: THREE.WebGLRenderer | null = null;

    public mounted() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.animationFrame();
    }

    public destroyed() {
        if (!this.renderer) return;

        this.renderer.dispose();
        this.renderer = null;
    }

    private animationFrame() {
        if (!this.renderer) return;
        if (this.items.length <= 0) {
            this.renderer.clear();
            requestAnimationFrame(this.animationFrame.bind(this));
            return;
        }

        this.canvasResize();

        this.renderer.setScissorTest(false);
        this.renderer.clear();

        this.renderer.setScissorTest(true);

        for (const key of Object.keys(this.$refs)) {
            if (!key.startsWith('item')) continue;

            const modelElement = this.$refs[key] as ModelElement | undefined;
            if (!modelElement) continue;

            const scene = modelElement.scene;
            if (!scene) continue;

            const camera: THREE.PerspectiveCamera = scene.userData.camera;
            const element: HTMLDivElement = scene.userData.element;
            const rect = element.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();

            if (rect.bottom < 0 || rect.top > (this.canvas.height + this.canvas.offsetTop + 25)) {
                continue;
            }

            const width = rect.right - rect.left;
            const height = rect.bottom - rect.top;
            const left = rect.left - canvasRect.left;
            const bottom = (this.canvas.height + this.canvas.offsetTop + 25) - rect.bottom;

            this.renderer.setViewport(left, bottom, width, height);
            this.renderer.setScissor(left, bottom, width, height);

            this.renderer.render(scene, camera);
        }

        requestAnimationFrame(this.animationFrame.bind(this));
    }

    private canvasResize() {
        if (!this.renderer) return;

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.renderer.setSize(width, height);
        }
    }
}
</script>
