import { readFileSync } from 'fs';
import path from 'path';
import * as THREE from 'three';

import { generateErrTex } from '@/renderer/generateErrTex';

export class ResourcePackLoader {
    private readonly packPath: string;

    private modelDataCache: { [key: string]: ModelData; } = {};
    private textureCache: { [key: string]: TextureData; } = {};

    public constructor(packPath: string) {
        this.packPath = packPath;

        const packMcmeta: PackMcMeta = JSON.parse(readFileSync(path.join(packPath, 'pack.mcmeta'), 'utf-8'));
        console.log('Pack description:', packMcmeta.pack.description);
        console.log('Pack format:', packMcmeta.pack.pack_format);

        // TODO: そのうち対応する(多分)
        if (packMcmeta.pack.pack_format !== 6) {
            throw Error('このバージョンのリソースパックには現在対応していません');
        }
    }

    /**
     * モデルデータを読み込みます
     * @param id 名前空間ID
     * @returns モデルデータ
     */
    public GetModelData(id: string): ModelData {
        const filePath = this.resolvePath(id, 'models');

        if (!this.modelDataCache[filePath]) {
            this.modelDataCache[filePath] = JSON.parse(readFileSync(filePath, 'utf-8'));
        }

        return this.modelDataCache[filePath];
    }

    /**
     * テクスチャを読み込みます
     * @param id 名前空間ID
     * @returns テクスチャ
     */
    public async GetTexture(id: string): Promise<TextureData> {
        const filePath = this.resolvePath(id, 'textures');

        if (!this.textureCache[filePath]) {
            try {
                const blob = new Blob([readFileSync(filePath)]);
                const texLoader = new THREE.TextureLoader();
                const tex = await texLoader.loadAsync(URL.createObjectURL(blob));
                tex.minFilter = THREE.NearestFilter;
                tex.magFilter = THREE.NearestFilter;

                const metaData = this.getTextureMcMeta(id);

                this.textureCache[filePath] = {
                    texture: tex,
                    animation: metaData && metaData.animation
                };
            }
            catch (err) {
                console.log('Missing texture:', id);

                this.textureCache[filePath] = {
                    texture: await generateErrTex()
                };
            }
        }

        return this.textureCache[filePath];
    }

    /**
     * テクスチャメタデータがあれば読み込む
     * @param id 名前空間ID
     * @returns テクスチャメタデータ
     */
    private getTextureMcMeta(id: string): TextureMcMeta | undefined {
        try {
            const mcMetaPath = `${this.resolvePath(id, 'textures')}.mcmeta`;
            return JSON.parse(readFileSync(mcMetaPath, 'utf-8'));
        }
        catch {
            return undefined;
        }
    }

    /**
     * 名前空間IDを絶対パスに解決します
     * @param id 名前空間ID
     * @param target
     * @returns 絶対パス
     */
    private resolvePath(id: string, target: 'models' | 'textures') {
        // 名前空間が未指定の場合はminecraft:を付ける
        if (!id.includes(':')) {
            id = `minecraft:${id}`;
        }

        // <namespace>:block/stone みたいな感じになってるはず
        const [, namespace, fileName] = /^([^:]*):(.*)$/.exec(id) || [];

        let ext: string;
        if (target === 'models') {
            ext = '.json';
        }
        else /* target === 'textrues' */ {
            // テクスチャってpng以外読まれないよね…？
            ext = '.png';
        }

        return `${this.packPath}/assets/${namespace}/${target}/${fileName}${ext}`;
    }
}
