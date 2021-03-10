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
import { IModel } from '@/renderer/IModel';
import { ModelLoader } from '@/renderer/ModelLoader';

@Component
export default class ModelView extends Vue {
    @Ref('canvas')
    private canvas!: HTMLCanvasElement;

    private renderer!: THREE.WebGLRenderer | null;
    private camera!: THREE.PerspectiveCamera;
    private controls!: OrbitControls;
    private scene!: THREE.Scene;

    private model: IModel | null = null;

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

        const rootGroup = new THREE.Group();
        rootGroup.position.set(-8, -8, -8);
        this.scene.add(rootGroup);

        const grid = new THREE.GridHelper(16, 16);
        grid.position.set(8, 0, 8);
        rootGroup.add(grid);

        const geometry = new THREE.SphereGeometry(0.2);
        const material = new THREE.MeshStandardMaterial({ color: 'red' });
        const origin = new THREE.Mesh(geometry, material);
        rootGroup.add(origin);

        this.model = modelLoader.LoadModel('block/stone');
        rootGroup.add(this.model);

        rootGroup.add(new THREE.AmbientLight(0xffffff, 1));

        const render = () => {
            if (!this.renderer) return;

            this.controls.update();

            stats.begin();
            this.renderer.render(this.scene, this.camera);
            stats.end();

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
            const rootGroup: THREE.Group | null = this.scene.children[0] as THREE.Group;

            if (this.model) {
                this.model.Dispose();
                rootGroup.remove(this.model);
            }

            while (rootGroup.children.length > 0) {
                const obj = rootGroup.children[0] as IModel | THREE.Object3D;

                if (obj instanceof THREE.Mesh) {
                    // origin
                    (obj.material as THREE.MeshStandardMaterial).dispose();
                    obj.geometry.dispose();
                }
                else if (obj instanceof THREE.GridHelper) {
                    // grid
                    (obj.material as THREE.LineBasicMaterial).dispose();
                    obj.geometry.dispose();
                }

                rootGroup.remove(obj);
            }

            this.scene.remove(rootGroup);

            this.renderer.dispose();
            this.renderer = null;
        }
        finally {
            this.$router.replace('/modellist');
        }
    }
}
</script>
