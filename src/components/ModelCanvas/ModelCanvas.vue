<template>
    <div class="full-width full-height">
        <canvas ref="canvas" style="background: lightgrey"/>
        <q-resize-observer @resize="onResize"/>
    </div>
</template>

<script lang="ts">
import { Component, Ref, Watch, Prop, PropSync, Vue } from 'vue-property-decorator';
import { CustomOrbitControls } from '@/renderer/CustomOrbitControls';
import * as THREE from 'three';

import { Global } from '@/renderer/Global';
import { IModel } from '@/renderer/IModel';
import { ModelLoader } from '@/renderer/ModelLoader';

@Component
export default class ModelCanvas extends Vue {
    @PropSync('value')
    private modelName!: string;

    @Prop({ type: Boolean, default: false })
    private orthographicMode!: boolean;

    @Ref('canvas')
    private canvas!: HTMLCanvasElement;

    private renderer: THREE.WebGLRenderer | null = null;
    private scene!: THREE.Scene;

    private perspectiveCamera!: THREE.PerspectiveCamera;
    private orthographicCamera!: THREE.OrthographicCamera;
    private controls!: CustomOrbitControls;

    private modelLoader!: ModelLoader;
    private model: IModel | null = null;

    public mounted() {
        this.modelLoader = new ModelLoader(Global.ResourcePackLoader);

        // WebGLレンダラー作成
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.$el.clientWidth, this.$el.clientHeight);

        // シーン作成
        this.scene = new THREE.Scene();

        // 透視投影カメラ
        const aspect = this.$el.clientWidth / this.$el.clientHeight;
        this.perspectiveCamera = new THREE.PerspectiveCamera(45, aspect, 1, 2000);
        this.perspectiveCamera.position.z = 50;

        // 平行投影カメラ
        const frustumLR = this.$el.clientWidth / 30;
        const frustumTB = this.$el.clientHeight / 30;
        this.orthographicCamera = new THREE.OrthographicCamera(-frustumLR, frustumLR, frustumTB, -frustumTB, 1, 2000);
        this.orthographicCamera.position.z = 50;

        // カメラコントロール
        this.controls = new CustomOrbitControls(this.perspectiveCamera, this.orthographicCamera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.update();

        // 全てのオブジェクトの親
        const rootGroup = new THREE.Group();
        rootGroup.position.set(-8, -8, -8);
        this.scene.add(rootGroup);

        // グリッド
        const grid = new THREE.GridHelper(16, 16);
        grid.position.set(8, 0, 8);
        rootGroup.add(grid);

        // モデルの原点
        const geometry = new THREE.SphereGeometry(0.2);
        const material = new THREE.MeshStandardMaterial({ color: 'red' });
        const origin = new THREE.Mesh(geometry, material);
        rootGroup.add(origin);

        // ライト
        rootGroup.add(new THREE.AmbientLight(0xffffff, 1));

        this.animationFrame();
    }

    /**
     * できるだけ全部破棄する
     */
    public destroyed() {
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

    @Watch('modelName')
    private modelName_watch() {
        if (this.model) {
            this.model.Dispose();
            this.scene.children[0].remove(this.model);
            this.model = null;
        }

        try {
            this.model = this.modelLoader.LoadModel(this.modelName);
            this.scene.children[0].add(this.model);
        }
        catch {}
    }

    @Watch('orthographicMode')
    private orthographicMode_watch() {
        if (this.orthographicMode) {
            this.controls.ChangeCamera('orthographic');
        }
        else {
            this.controls.ChangeCamera('perspective');
        }
        this.controls.update();
    }

    private animationFrame() {
        if (!this.renderer) return;

        this.controls.update();

        this.renderer.render(this.scene, this.controls.object);

        requestAnimationFrame(this.animationFrame.bind(this));
    }

    private onResize(size: { width: number, height: number }) {
        if (!this.renderer) return;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(size.width, size.height);

        this.perspectiveCamera.aspect = size.width / size.height;
        this.perspectiveCamera.updateProjectionMatrix();

        const frustumLR = this.$el.clientWidth / 30;
        const frustumTB = this.$el.clientHeight / 30;
        this.orthographicCamera.left = -frustumLR;
        this.orthographicCamera.right = frustumLR;
        this.orthographicCamera.top = frustumTB;
        this.orthographicCamera.bottom = -frustumTB;
        this.orthographicCamera.updateProjectionMatrix();
    }
}
</script>
