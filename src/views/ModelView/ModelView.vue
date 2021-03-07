<template>
    <div class="full-width full-height">
        <canvas ref="canvas" style="background-color: unset"/>
        <q-drawer
            bordered
            side="left"
            :width="200"
            :breakpoint="0"
            :value="true"
        >
            <q-scroll-area class="fit">
                <div class="q-pa-sm"/>
            </q-scroll-area>
        </q-drawer>
        <q-resize-observer @resize="onResize"/>
    </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import * as THREE from 'three';

import { ResourcePackLoader } from '@/renderer/ResourcePackLoader';
import { ModelLoader } from '@/renderer/ModelLoader';

@Component
export default class Home extends Vue {
    @Ref('canvas')
    private canvas!: HTMLCanvasElement;

    private renderer!: THREE.WebGLRenderer;
    private camera!: THREE.PerspectiveCamera;

    public async mounted() {
        const rpLoader = new ResourcePackLoader('<ResourcePack Path>');
        const modelLoader = new ModelLoader(rpLoader);

        const stats = Stats();
        stats.dom.style.position = 'absolute';
        stats.dom.style.top = '0';
        stats.dom.style.left = 'unset';
        stats.dom.style.marginTop = '10px';
        stats.dom.style.marginLeft = '10px';
        this.$el.appendChild(stats.dom);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas,
            alpha: true,
            preserveDrawingBuffer: true
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.$el.clientWidth, this.$el.clientHeight);

        const scene = new THREE.Scene();

        const aspect = this.$el.clientWidth / this.$el.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 2000);
        // this.camera = new THREE.OrthographicCamera(-15, 15, 15, -15);
        const controls = new OrbitControls(this.camera, this.canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minDistance = 10;
        controls.maxDistance = 100;
        controls.update();

        this.camera.position.z = 50;

        this.camera.lookAt(0, 0, 0);

        const group = new THREE.Group();
        group.position.set(0, 0, 0);
        scene.add(group);

        const grid = new THREE.GridHelper(16, 16);
        grid.position.set(0, -8, 0);
        group.add(grid);

        const geometry = new THREE.SphereGeometry(0.2);
        const material = new THREE.MeshStandardMaterial({ color: 'red' });
        const origin = new THREE.Mesh(geometry, material);
        origin.position.set(-8, -8, -8);
        group.add(origin);

        const modelData = modelLoader.LoadModelData('item/stone');
        console.log(modelData.overrides);
        const model = modelLoader.LoadModel(modelData);
        origin.add(model);

        scene.add(new THREE.AmbientLight(0xffffff, 1));

        const render = () => {
            controls.update();

            stats.begin();
            this.renderer.render(scene, this.camera);
            stats.end();
            stats.update();

            requestAnimationFrame(render);
        };
        render();
    }

    private onResize(size: { width: number, height: number }) {
        if (!this.renderer) return;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(size.width, size.height);

        this.camera.aspect = size.width / size.height;
        this.camera.updateProjectionMatrix();
    }
}
</script>
