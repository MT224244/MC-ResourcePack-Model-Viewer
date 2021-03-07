import * as THREE from 'three';

import { ResourcePackLoader } from '@/renderer/ResourcePackLoader';
import { TickTimer } from '@/renderer/TickTimer';
import { generateErrTex } from '@/renderer/generateErrTex';

interface DefaultAnimation extends Exclude<TextureMcMeta['animation'], undefined> {
    interpolate: boolean;
    frametime: number;
}

const defaultAnimation: DefaultAnimation = {
    interpolate: false,
    frametime: 1
};

export class BlockModel extends THREE.Object3D {
    private rpLoader: ResourcePackLoader;
    private modelData: ModelData;
    private textures: { [key: string]: TextureData; } = {};

    private errTexture!: THREE.Texture;

    private timer: TickTimer;

    public constructor(rpLoader: ResourcePackLoader, modelData: ModelData) {
        super();

        this.timer = new TickTimer();

        this.rpLoader = rpLoader;
        this.modelData = modelData;

        this.loadTextures().then(() => {
            if (modelData.elements) {
                for (const element of modelData.elements) {
                    this.add(this.createCube(element));
                    this.timer.Start();
                }
            }
        });
    }

    private async loadTextures() {
        if (this.modelData.textures) {
            for (const texName of Object.keys(this.modelData.textures)) {
                const texData = await this.rpLoader.GetTexture(this.modelData.textures[texName]);

                this.textures[texName] = texData;
            }
        }

        this.errTexture = await generateErrTex();
    }

    private getTexData(name: string) {
        return this.textures[name] || {
            texture: this.errTexture
        };
    }

    /**
     * モデルデータのelementからキューブを作ります
     * @param element モデルデータのelement
     * @returns キューブ
     */
    private createCube(element: ModelElement) {
        const { from, to, rotation, faces } = element;

        const wrapperObj = new THREE.Object3D();

        const size = {
            x: to[0] - from[0],
            y: to[1] - from[1],
            z: to[2] - from[2]
        };

        const pos = {
            x: from[0] + (size.x / 2),
            y: from[1] + (size.y / 2),
            z: from[2] + (size.z / 2)
        };

        const geom = new THREE.BoxGeometry(size.x, size.y, size.z);
        const geomCrossfade = new THREE.BoxGeometry(size.x, size.y, size.z);

        // Material
        const materials: (THREE.Material | undefined)[] = [];
        const materialsCrossfade: (THREE.Material | undefined)[] = [];
        if (faces) {
            for (const faceName of ['east', 'west', 'up', 'down', 'south', 'north'] as Direction[]) {
                const face = faces[faceName];

                if (face) {
                    const texName = face.texture.replace(/^#/, '');
                    const texData = this.getTexData(texName);

                    const mat = new THREE.MeshStandardMaterial({
                        map: texData.texture,
                        transparent: true,
                        alphaTest: 0.01
                    });
                    materials.push(mat);

                    const matCrossfade = mat.clone();
                    matCrossfade.opacity = 0;
                    materialsCrossfade.push(matCrossfade);

                    let uvStartIdx: number;
                    switch (faceName) {
                        case 'north': uvStartIdx = 20; break;
                        case 'south': uvStartIdx = 16; break;
                        case 'east': uvStartIdx = 0; break;
                        case 'west': uvStartIdx = 4; break;
                        case 'up': uvStartIdx = 8; break;
                        case 'down': uvStartIdx = 12; break;
                    }

                    if (!face.uv) {
                        face.uv = this.createUv(faceName, from, to);
                    }

                    this.animate(texData, face, uvStartIdx, geom, geomCrossfade, matCrossfade);
                }
                else {
                    materials.push(undefined);
                    materialsCrossfade.push(undefined);
                }
            }
        }

        const cube = new THREE.Mesh(geom, materials as THREE.Material[]);
        cube.position.set(pos.x, pos.y, pos.z);
        wrapperObj.add(cube);

        const cubeCrossfade = new THREE.Mesh(geomCrossfade, materialsCrossfade as THREE.Material[]);
        cubeCrossfade.position.set(pos.x, pos.y, pos.z);
        wrapperObj.add(cubeCrossfade);

        if (rotation) {
            this.rotateCube(rotation, wrapperObj, cube, cubeCrossfade);
        }

        return wrapperObj;
    }

    /**
     * キューブの位置からUVを作成します
     * @param faceName 面
     * @param from キューブ始点
     * @param to キューブ終点
     * @returns UV
     */
    private createUv(faceName: Direction, fromArray: Coordinate, toArray: Coordinate): ModelElementFaceUV {
        const from = {
            x: fromArray[0],
            y: fromArray[1],
            z: fromArray[2]
        };
        const to = {
            x: toArray[0],
            y: toArray[1],
            z: toArray[2]
        };

        let x1: number;
        let y1: number;
        let x2: number;
        let y2: number;

        if (faceName === 'up') {
            x1 = from.x;
            y1 = from.z;
            x2 = to.x;
            y2 = to.z;
        }
        else if (faceName === 'down') {
            x1 = from.x;
            y1 = -(to.z) + 16;
            x2 = to.x;
            y2 = -(from.z) + 16;
        }
        else if (faceName === 'east') {
            x1 = -(to.z) + 16;
            y1 = -(to.y) + 16;
            x2 = -(from.z) + 16;
            y2 = -(from.y) + 16;
        }
        else if (faceName === 'west') {
            x1 = from.z;
            y1 = -(to.y) + 16;
            x2 = to.z;
            y2 = -(from.y) + 16;
        }
        else if (faceName === 'north') {
            x1 = -(to.x) + 16;
            y1 = -(to.y) + 16;
            x2 = -(from.x) + 16;
            y2 = -(from.y) + 16;
        }
        else {
            x1 = from.x;
            y1 = -(to.y) + 16;
            x2 = to.x;
            y2 = -(from.y) + 16;
        }

        return [x1, y1, x2, y2];
    }

    private setUv(uvStartIdx: number, geometry: THREE.BoxGeometry, face: ModelElementFace) {
        if (!face.uv) return;

        const uv = {
            x1: face.uv[0] / 16,
            y1: -(face.uv[1] / 16) + 1,
            x2: face.uv[2] / 16,
            y2: -(face.uv[3] / 16) + 1
        };

        if (face.rotation) {
            if (face.rotation === 90) {
                geometry.attributes.uv.setXY(uvStartIdx + 0, uv.x1, uv.y2);
                geometry.attributes.uv.setXY(uvStartIdx + 1, uv.x1, uv.y1);
                geometry.attributes.uv.setXY(uvStartIdx + 2, uv.x2, uv.y2);
                geometry.attributes.uv.setXY(uvStartIdx + 3, uv.x2, uv.y1);
            }
            else if (face.rotation === 180) {
                geometry.attributes.uv.setXY(uvStartIdx + 0, uv.x1, uv.y1);
                geometry.attributes.uv.setXY(uvStartIdx + 1, uv.x2, uv.y1);
                geometry.attributes.uv.setXY(uvStartIdx + 2, uv.x1, uv.y2);
                geometry.attributes.uv.setXY(uvStartIdx + 3, uv.x2, uv.y2);
            }
            else {
                geometry.attributes.uv.setXY(uvStartIdx + 0, uv.x2, uv.y1);
                geometry.attributes.uv.setXY(uvStartIdx + 1, uv.x2, uv.y2);
                geometry.attributes.uv.setXY(uvStartIdx + 2, uv.x1, uv.y1);
                geometry.attributes.uv.setXY(uvStartIdx + 3, uv.x1, uv.y2);
            }
        }
        else {
            geometry.attributes.uv.setXY(uvStartIdx + 0, uv.x1, uv.y1);
            geometry.attributes.uv.setXY(uvStartIdx + 1, uv.x2, uv.y1);
            geometry.attributes.uv.setXY(uvStartIdx + 2, uv.x1, uv.y2);
            geometry.attributes.uv.setXY(uvStartIdx + 3, uv.x2, uv.y2);
        }
    }

    private rotateCube(rotation: ModelElementRotation, wrapperObj: THREE.Object3D, cube: THREE.Mesh, cubeCrossfade: THREE.Mesh) {
        const origin = {
            x: rotation.origin[0],
            y: rotation.origin[1],
            z: rotation.origin[2]
        };
        wrapperObj.position.x += origin.x;
        wrapperObj.position.y += origin.y;
        wrapperObj.position.z += origin.z;

        cube.position.x -= origin.x;
        cube.position.y -= origin.y;
        cube.position.z -= origin.z;
        cubeCrossfade.position.x -= origin.x;
        cubeCrossfade.position.y -= origin.y;
        cubeCrossfade.position.z -= origin.z;

        let factor: number;
        if (rotation.angle === -22.5 || rotation.angle === 22.5) {
            // 16x8の長方形の対角線を求める
            factor = Math.sqrt(16 ** 2 + 8 ** 2) / 16;
        }
        else {
            // 16x16の正方形の対角線を求める
            factor = Math.sqrt(16 ** 2 * 2) / 16;
        }

        if (rotation.axis === 'x') {
            wrapperObj.rotateX(THREE.MathUtils.degToRad(rotation.angle));
            if (rotation.rescale) {
                cube.geometry.scale(1, factor, factor);
                cube.position.y *= factor;
                cube.position.z *= factor;
                cubeCrossfade.geometry.scale(1, factor, factor);
                cubeCrossfade.position.y *= factor;
                cubeCrossfade.position.z *= factor;
            }
        }
        else if (rotation.axis === 'y') {
            wrapperObj.rotateY(THREE.MathUtils.degToRad(rotation.angle));
            if (rotation.rescale) {
                cube.geometry.scale(factor, 1, factor);
                cube.position.x *= factor;
                cube.position.z *= factor;
                cubeCrossfade.geometry.scale(factor, 1, factor);
                cubeCrossfade.position.x *= factor;
                cubeCrossfade.position.z *= factor;
            }
        }
        else if (rotation.axis === 'z') {
            wrapperObj.rotateZ(THREE.MathUtils.degToRad(rotation.angle));
            if (rotation.rescale) {
                cube.geometry.scale(factor, factor, 1);
                cube.position.x *= factor;
                cube.position.y *= factor;
                cubeCrossfade.geometry.scale(factor, factor, 1);
                cubeCrossfade.position.x *= factor;
                cubeCrossfade.position.y *= factor;
            }
        }
    }

    private animate(texData: TextureData, face: ModelElementFace, uvStartIdx: number, geom: THREE.BoxGeometry, geomCrossfade: THREE.BoxGeometry, matCrossfade: THREE.Material) {
        if (!face.uv) return;

        if (texData.animation) {
            const anm: DefaultAnimation = Object.assign({ ...defaultAnimation }, texData.animation);
            const texWidth: number = texData.texture.image.width;
            const texHeight: number = texData.texture.image.height;

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

            const originUv = face.uv;

            const calcUv = (frame: Frame) => {
                if (!anm.width || !anm.height) return;

                const rowLen = texWidth / anm.width;
                const colLen = texHeight / anm.height;

                const rowIdx = frame.index % rowLen;
                const colIdx = Math.floor(frame.index / rowLen);

                const uv = [...originUv] as ModelElementFaceUV;

                uv[0] = (originUv[0] / rowLen) + (rowIdx * (anm.width / texWidth) * 16);
                uv[1] = (originUv[1] / colLen) + (colIdx * (anm.height / texHeight) * 16);
                uv[2] = (originUv[2] / rowLen) + (rowIdx * (anm.width / texWidth) * 16);
                uv[3] = (originUv[3] / colLen) + (colIdx * (anm.height / texHeight) * 16);

                return uv;
            };

            const timerLoop = (idx: number) => {
                if (!anm.width || !anm.height || !anm.frames) return;

                const frame = anm.frames[idx] as Frame;

                face.uv = calcUv(frame);

                this.setUv(uvStartIdx, geom, face);

                if (anm.interpolate) {
                    let nextIdx = idx + 1;
                    if (nextIdx > anm.frames.length - 1) nextIdx = 0;
                    const nextFrame = anm.frames[nextIdx] as Frame;
                    face.uv = calcUv(nextFrame);

                    matCrossfade.opacity = 0;
                    let count = 0;
                    const loop = () => {
                        count++;
                        if (count >= nextFrame.time) {
                            this.timer.off('tick', loop);
                            return;
                        }

                        matCrossfade.opacity += 1 / nextFrame.time;
                    };
                    this.timer.on('tick', loop);
                }

                this.setUv(uvStartIdx, geomCrossfade, face);

                geom.attributes.uv.needsUpdate = true;
                geomCrossfade.attributes.uv.needsUpdate = true;
            };

            this.timer.Add(anm.frames as Frame[], timerLoop);
            timerLoop(0);
        }
        else {
            this.setUv(uvStartIdx, geom, face);
            this.setUv(uvStartIdx, geomCrossfade, face);
        }
    }
}
