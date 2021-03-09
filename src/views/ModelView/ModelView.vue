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
                <div class="q-pa-sm">
                    <q-btn label="戻る" @click="btnReturn_onClick"/>
                </div>
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

import { Global } from '@/renderer/Global';
import { ModelLoader } from '@/renderer/ModelLoader';

@Component
export default class ModelView extends Vue {
    @Ref('canvas')
    private canvas!: HTMLCanvasElement;

    private renderer!: THREE.WebGLRenderer | null;
    private camera!: THREE.PerspectiveCamera;
    private controls!: OrbitControls;
    private scene!: THREE.Scene;

    private model!: THREE.Object3D;

    public async mounted() {
        const modelLoader = new ModelLoader(Global.ResourcePackLoader);

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

        this.scene = new THREE.Scene();

        const aspect = this.$el.clientWidth / this.$el.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 2000);
        // this.camera = new THREE.OrthographicCamera(-15, 15, 15, -15);
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.update();

        this.camera.position.z = 50;

        this.camera.lookAt(0, 0, 0);

        const group = new THREE.Group();
        group.position.set(0, 0, 0);
        this.scene.add(group);

        const grid = new THREE.GridHelper(16, 16);
        grid.position.set(0, -8, 0);
        group.add(grid);

        const geometry = new THREE.SphereGeometry(0.2);
        const material = new THREE.MeshStandardMaterial({ color: 'red' });
        const origin = new THREE.Mesh(geometry, material);
        origin.position.set(-8, -8, -8);
        group.add(origin);

        this.model = modelLoader.LoadModel('block/stone');
        origin.add(this.model);

        this.scene.add(new THREE.AmbientLight(0xffffff, 1));

        const render = () => {
            if (!this.renderer) return;

            this.controls.update();

            stats.begin();
            this.renderer.render(this.scene, this.camera);
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

    private btnReturn_onClick() {
        try {
            if (!this.renderer) return;

            this.controls.dispose();
            this.recursiveDispose(this.scene.children);
            this.renderer.dispose();

            this.renderer = null;
        }
        finally {
            this.$router.replace('/modellist');
        }
    }

    private recursiveDispose(objects: (THREE.Object3D | THREE.Mesh)[]) {
        if (objects.length < 1) return;

        for (const obj of objects) {
            if (obj.children) {
                this.recursiveDispose(obj.children);
            }

            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();

                if (obj.material instanceof Array) {
                    for (const mat of obj.material) {
                        mat.dispose();
                    }
                }
                else {
                    obj.material.dispose();
                }
            }
        }
    }
}
</script>
