import * as THREE from 'three';

import { IModel } from '@/renderer/IModel';
import { ResourcePackLoader } from '@/renderer/ResourcePackLoader';
import { TickTimer } from '@/renderer/TickTimer';

import vertexShader from '@/renderer/shaders/ItemModelShader.vert';
import fragmentShader from '@/renderer/shaders/ItemModelShader.frag';

const defaultAnimation: DefaultAnimation = {
    interpolate: false,
    frametime: 1
};

const posAttrArray: number[][] = [];
const colorAttrArray: number[][] = [];

export class ItemModel extends THREE.Object3D implements IModel {
    private rpLoader: ResourcePackLoader;

    private timer: TickTimer;

    public constructor(rpLoader: ResourcePackLoader, modelData: ModelData) {
        super();

        this.timer = new TickTimer();

        this.rpLoader = rpLoader;

        if (modelData.textures) {
            this.getTextures(modelData.textures).then(textures => {
                for (const texName of Object.keys(textures)) {
                    if (!texName.startsWith('layer')) continue;

                    const { texture, animation } = textures[texName];
                    const img = (texture.image as HTMLImageElement).cloneNode(true) as HTMLImageElement;

                    // もう使わないので破棄
                    delete textures[texName];
                    texture.dispose();

                    const anm = this.resolveAnimation(img, animation);

                    const colorData = this.getColorData(img, anm);

                    const [bufGeom, posAttrs, colorAttrs] = this.createGeometry(colorData, anm.width, anm.height);
                    const mat = new THREE.RawShaderMaterial({
                        vertexShader,
                        fragmentShader,
                        uniforms: {
                            tick: { value: 0 }
                        },
                        glslVersion: THREE.GLSL3,
                        transparent: true
                    });
                    const mesh = new THREE.Mesh(bufGeom, mat);
                    this.add(mesh);

                    // アニメーションしない場合はここで終わり
                    if (anm.frames.length <= 1) continue;

                    const timerLoop = (idx: number) => {
                        bufGeom.setAttribute('position', posAttrs[idx]);
                        bufGeom.setAttribute('color', colorAttrs[idx]);
                        if (anm.interpolate) {
                            let nextIdx = idx + 1;
                            if (nextIdx > anm.frames.length - 1) nextIdx = 0;
                            const nextFrame = anm.frames[nextIdx] as Frame;

                            bufGeom.setAttribute('nextPosition', posAttrs[nextIdx]);
                            bufGeom.setAttribute('nextColor', colorAttrs[nextIdx]);

                            let tick = 0;
                            mat.uniforms.tick.value = 0;
                            const loop = () => {
                                tick++;
                                if (tick >= nextFrame.time) {
                                    this.timer.off('tick', loop);
                                    return;
                                }
                                mat.uniforms.tick.value = tick / nextFrame.time;
                            };
                            this.timer.on('tick', loop);
                        }
                    };

                    this.timer.Add(anm.frames as Frame[], timerLoop);
                    timerLoop(0);
                }
            });
        }

        this.timer.Start();
    }

    public Dispose() {
        this.timer.Dispose();

        // オブジェクトを破棄
        while (this.children.length > 0) {
            const mesh = this.children[0] as THREE.Mesh;

            (mesh.material as THREE.RawShaderMaterial).dispose();
            mesh.geometry.dispose();

            this.remove(mesh);
        }
    }

    /**
     * 全てのテクスチャを読み込む
     * @param textures テクスチャ情報
     * @returns テクスチャの連想配列
     */
    private async getTextures(textures: Exclude<ModelData['textures'], undefined>) {
        const result: { [key: string]: TextureData } = {};

        for (const texName of Object.keys(textures)) {
            const texData = await this.rpLoader.GetTexture(textures[texName]);

            result[texName] = texData;
        }

        return result;
    }

    /**
     * アニメーション情報を解決する
     * @param img 画像
     * @param animation アニメーション情報
     * @returns アニメーション情報
     */
    private resolveAnimation(img: HTMLImageElement, animation: TextureMcMeta['animation']) {
        let anm: Required<DefaultAnimation>;
        if (animation) {
            anm = Object.assign({ ...defaultAnimation }, animation) as Required<DefaultAnimation>;
            const texWidth: number = img.width;
            const texHeight: number = img.height;

            // width & height
            if (!anm.width && !anm.height) {
                const min = Math.min(texWidth, texHeight);
                anm.width = min;
                anm.height = min;
            }
            anm.width = anm.width || texWidth;
            anm.height = anm.height || texHeight;

            // frames
            if (!anm.frames) {
                const framesLen = (texWidth / anm.width) * (texHeight / anm.height);
                anm.frames = [...Array(framesLen).keys()]
                    .map(i => ({
                        index: i,
                        time: anm.frametime
                    }));
            }
            else {
                anm.frames = anm.frames.map(frame => {
                    if (typeof frame === 'number') {
                        return {
                            index: frame,
                            time: anm.frametime
                        };
                    }
                    else {
                        if (!frame.time) {
                            frame.time = anm.frametime;
                        }

                        return frame;
                    }
                });
            }
        }
        else {
            anm = defaultAnimation as Required<DefaultAnimation>;
            anm.width = Math.max(img.width, img.height);
            anm.height = anm.width;
            anm.frames = [
                { index: 0, time: defaultAnimation.frametime }
            ];
        }

        return anm;
    }

    /**
     * 画像から色情報の配列を取得する
     * @param img 画像
     * @param anm アニメーションデータ
     * @returns 色データ
     */
    private getColorData(img: HTMLImageElement, anm: Required<DefaultAnimation>) {
        const canvas = document.createElement('canvas');
        canvas.width = anm.width;
        canvas.height = anm.height;

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        // 上下反転
        ctx.translate(anm.width / 2, anm.height / 2);
        ctx.scale(1, -1);
        ctx.translate(-anm.width / 2, -anm.height / 2);

        const result: Uint8ClampedArray[] = [];
        for (const frame of anm.frames as Frame[]) {
            const rowLen = img.width / anm.width;

            const rowIdx = frame.index % rowLen;
            const colIdx = Math.floor(frame.index / rowLen);

            ctx.drawImage(img, -(anm.width * rowIdx), -(anm.height * colIdx));

            // 色情報はVec4で配列に入ってるらしい
            result.push(ctx.getImageData(0, 0, anm.width, anm.height).data);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        return result;
    }

    /**
     * ジオメトリを作成する
     * @param colorData 色データ
     * @param width 幅
     * @param height 高さ
     * @returns [ジオメトリ, 頂点, 色]
     */
    private createGeometry(colorData: Uint8ClampedArray[], width: number, height: number): [THREE.BufferGeometry, THREE.BufferAttribute[], THREE.BufferAttribute[]] {
        // Minecraftのアイテムは16x16の範囲に収まるように表示される
        const pixelWidth = 16 / width;
        const pixelHeight = 16 / height;

        const z = 7.5;

        for (const colorDataIdx of [...Array(colorData.length).keys()]) {
            posAttrArray.push([]);
            colorAttrArray.push([]);

            for (const y of [...Array(height).keys()]) {
                for (const x of [...Array(width).keys()]) {
                    const idx = ((y * width) + x) * 4;

                    // シェーダーは 0.0 ~ 1.0 じゃないといけないっぽい
                    const r = colorData[colorDataIdx][idx + 0] / 255;
                    const g = colorData[colorDataIdx][idx + 1] / 255;
                    const b = colorData[colorDataIdx][idx + 2] / 255;
                    const a = colorData[colorDataIdx][idx + 3] / 255;

                    // 完全に透明なら生成しない
                    if (a > 0) {
                        // 奥行きだけは画像サイズに関係なく1
                        const x0 = (x + 0) * pixelWidth;
                        const x1 = (x + 1) * pixelWidth;
                        const y0 = (y + 0) * pixelHeight;
                        const y1 = (y + 1) * pixelHeight;
                        const z0 = (z + 0);
                        const z1 = (z + 1);

                        // 上下左右のピクセルのアルファ値
                        const up = colorData[colorDataIdx][(((y + 1) * width) + x) * 4 + 3];
                        const down = colorData[colorDataIdx][(((y - 1) * width) + x) * 4 + 3];
                        const left = colorData[colorDataIdx][((y * width) + (x - 1)) * 4 + 3];
                        const right = colorData[colorDataIdx][((y * width) + (x + 1)) * 4 + 3];

                        // up
                        if (y === height - 1 || up === 0) {
                            posAttrArray[colorDataIdx].push(
                                x1, y1, z0,
                                x0, y1, z0,
                                x0, y1, z1,
                                x0, y1, z1,
                                x1, y1, z1,
                                x1, y1, z0
                            );
                            colorAttrArray[colorDataIdx].push(
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a
                            );
                        }

                        // down
                        if (y === 0 || down === 0) {
                            posAttrArray[colorDataIdx].push(
                                x1, y0, z1,
                                x0, y0, z1,
                                x0, y0, z0,
                                x0, y0, z0,
                                x1, y0, z0,
                                x1, y0, z1
                            );
                            colorAttrArray[colorDataIdx].push(
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a
                            );
                        }

                        // left
                        if (x === 0 || left === 0) {
                            posAttrArray[colorDataIdx].push(
                                x0, y0, z0,
                                x0, y0, z1,
                                x0, y1, z1,
                                x0, y1, z1,
                                x0, y1, z0,
                                x0, y0, z0
                            );
                            colorAttrArray[colorDataIdx].push(
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a
                            );
                        }

                        // right
                        if (x === width - 1 || right === 0) {
                            posAttrArray[colorDataIdx].push(
                                x1, y0, z1,
                                x1, y0, z0,
                                x1, y1, z0,
                                x1, y1, z0,
                                x1, y1, z1,
                                x1, y0, z1
                            );
                            colorAttrArray[colorDataIdx].push(
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a,
                                r, g, b, a
                            );
                        }

                        // 前後は必須
                        posAttrArray[colorDataIdx].push(
                            // front
                            x1, y0, z0,
                            x0, y0, z0,
                            x0, y1, z0,
                            x0, y1, z0,
                            x1, y1, z0,
                            x1, y0, z0,

                            // back
                            x0, y0, z1,
                            x1, y0, z1,
                            x1, y1, z1,
                            x1, y1, z1,
                            x0, y1, z1,
                            x0, y0, z1
                        );
                        colorAttrArray[colorDataIdx].push(
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,

                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a
                        );
                    }
                }
            }
        }

        const posAttrs = posAttrArray.map(x => new THREE.BufferAttribute(new Float32Array(x), 3));
        const colorAttrs = colorAttrArray.map(x => new THREE.BufferAttribute(new Float32Array(x), 4));

        const bufGeom = new THREE.BufferGeometry();
        bufGeom.setAttribute('position', posAttrs[0]);
        bufGeom.setAttribute('color', colorAttrs[0]);

        return [bufGeom, posAttrs, colorAttrs];
    }
}
