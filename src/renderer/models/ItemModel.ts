import * as THREE from 'three';

import { ResourcePackLoader } from '@/renderer/ResourcePackLoader';

import vertexShader from '@/renderer/shaders/Vec4ColorShader.vert';
import fragmentShader from '@/renderer/shaders/Vec4ColorShader.frag';

export class ItemModel extends THREE.Object3D {
    private rpLoader: ResourcePackLoader;

    public constructor(rpLoader: ResourcePackLoader, modelData: ModelData) {
        super();

        this.rpLoader = rpLoader;

        if (modelData.textures) {
            this.getTextures(modelData.textures).then(textures => {
                for (const texName of Object.keys(textures)) {
                    if (!texName.startsWith('layer')) continue;

                    const img = textures[texName];

                    const colorData = this.getColorData(img);

                    // 大きい方に合わせて引き伸ばされて必ず正方形になる
                    const texSize = Math.max(img.width, img.height);

                    const bufGeom = this.createGeometry(colorData, texSize);
                    const mat = new THREE.RawShaderMaterial({
                        vertexShader,
                        fragmentShader,
                        transparent: true
                    });
                    const mesh = new THREE.Mesh(bufGeom, mat);
                    this.add(mesh);
                }
            });
        }
    }

    private async getTextures(textures: Exclude<ModelData['textures'], undefined>) {
        const result: { [key: string]: HTMLImageElement } = {};

        for (const texName of Object.keys(textures)) {
            const texData = await this.rpLoader.GetTexture(textures[texName]);

            result[texName] = texData.texture.image;
        }

        return result;
    }

    /**
     * 画像から色情報の配列を取得する
     * @param img 画像
     * @returns 色データ
     */
    private getColorData(img: HTMLImageElement) {
        // 大きい方に合わせて引き伸ばされて必ず正方形になる
        const size = Math.max(img.width, img.height);

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        // 上下反転
        ctx.translate(size / 2, size / 2);
        ctx.scale(1, -1);
        ctx.translate(-size / 2, -size / 2);

        // 画像の比率に関わらず正方形にして貼り付ける
        ctx.drawImage(img, 0, 0, size, size);

        // 色情報はVec4で配列に入ってるらしい
        return ctx.getImageData(0, 0, size, size).data;
    }

    /**
     * ジオメトリを作成する
     * @param colorData 色データ
     * @param texSize テクスチャサイズ
     */
    private createGeometry(colorData: Uint8ClampedArray, texSize: number) {
        // Minecraftのアイテムは16x16の範囲に収まるように表示される
        const pixelSize = 16 / texSize;

        const z = 7.5;

        const posAttrArray = [];
        const colorAttrArray = [];

        for (const y of [...Array(texSize).keys()]) {
            for (const x of [...Array(texSize).keys()]) {
                const idx = ((y * texSize) + x) * 4;

                // シェーダーは 0.0 ~ 1.0 じゃないといけないっぽい
                const r = colorData[idx + 0] / 255;
                const g = colorData[idx + 1] / 255;
                const b = colorData[idx + 2] / 255;
                const a = colorData[idx + 3] / 255;

                // 完全に透明なら生成しない
                if (a > 0) {
                    // 奥行きだけは画像サイズに関係なく1
                    const x0 = (x + 0) * pixelSize;
                    const x1 = (x + 1) * pixelSize;
                    const y0 = (y + 0) * pixelSize;
                    const y1 = (y + 1) * pixelSize;
                    const z0 = (z + 0);
                    const z1 = (z + 1);

                    // 上下左右のピクセルのアルファ値
                    const up = colorData[(((y + 1) * texSize) + x) * 4 + 3];
                    const down = colorData[(((y - 1) * texSize) + x) * 4 + 3];
                    const left = colorData[((y * texSize) + (x - 1)) * 4 + 3];
                    const right = colorData[((y * texSize) + (x + 1)) * 4 + 3];

                    // up
                    if (y === texSize - 1 || up === 0) {
                        posAttrArray.push(
                            x1, y1, z0,
                            x0, y1, z0,
                            x0, y1, z1,
                            x0, y1, z1,
                            x1, y1, z1,
                            x1, y1, z0
                        );
                        colorAttrArray.push(
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
                        posAttrArray.push(
                            x1, y0, z1,
                            x0, y0, z1,
                            x0, y0, z0,
                            x0, y0, z0,
                            x1, y0, z0,
                            x1, y0, z1
                        );
                        colorAttrArray.push(
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
                        posAttrArray.push(
                            x0, y0, z0,
                            x0, y0, z1,
                            x0, y1, z1,
                            x0, y1, z1,
                            x0, y1, z0,
                            x0, y0, z0
                        );
                        colorAttrArray.push(
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a
                        );
                    }

                    // right
                    if (x === texSize - 1 || right === 0) {
                        posAttrArray.push(
                            x1, y0, z1,
                            x1, y0, z0,
                            x1, y1, z0,
                            x1, y1, z0,
                            x1, y1, z1,
                            x1, y0, z1
                        );
                        colorAttrArray.push(
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a,
                            r, g, b, a
                        );
                    }

                    // 前後は必須
                    posAttrArray.push(
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
                    colorAttrArray.push(
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

        const bufGeom = new THREE.BufferGeometry();
        bufGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posAttrArray), 3));
        bufGeom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colorAttrArray), 4));

        return bufGeom;
    }
}
