<template>
    <div>
        <canvas ref="canvas" style="background-color: lightgrey"/>
        <div class="column q-ml-md q-mt-md">
            <img
                v-for="tex of texturePaths"
                :key="tex"
                :src="tex"
                width="128"
                height="128"
                style="image-rendering: pixelated"
            >
        </div>
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

    public texturePaths: string[] = [];

    public async mounted() {
        const rpLoader = new ResourcePackLoader('<ResourcePack path>');
        const modelLoader = new ModelLoader(rpLoader);

        const stats = Stats();
        stats.dom.style.top = '35px';
        stats.dom.style.left = '10px';
        this.$el.appendChild(stats.dom);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas,
            alpha: true,
            preserveDrawingBuffer: true
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(500, 500);

        const scene = new THREE.Scene();

        // const camera = new THREE.OrthographicCamera(-15, 15, 15, -15);
        const camera = new THREE.PerspectiveCamera(45, 1, 1, 2000);
        const controls = new OrbitControls(camera, this.canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minDistance = 10;
        controls.maxDistance = 100;
        controls.update();

        camera.position.z = 50;

        camera.lookAt(0, 0, 0);

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

        const model = modelLoader.LoadModel('item/stone');
        origin.add(model);

        scene.add(new THREE.AmbientLight(0xffffff, 1));

        const render = () => {
            controls.update();

            stats.begin();
            renderer.render(scene, camera);
            stats.end();
            stats.update();

            requestAnimationFrame(render);
        };
        render();
    }
}
</script>

<style lang="scss" scoped>
</style>
