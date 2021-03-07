import { readFileSync, statSync } from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import * as THREE from 'three';

export class ResourcePack {
    private readonly packPath: string;

    /**
     * zip/jarファイルのデータ\
     * これがnullじゃなければ圧縮されたリソパを読み込んでる
     */
    private readonly zipData: AdmZip | null = null;

    private modelDataCache: { [key: string]: ModelData; } = {};
    private textureCache: { [key: string]: TextureData; } = {};

    public constructor(packPath: string) {
        this.packPath = packPath;

        if (statSync(packPath).isFile()) {
            this.zipData = new AdmZip(packPath);
        }

        const packMcmeta = this.GetPackMcmeta();
        if (packMcmeta) {
            console.log('Pack description:', packMcmeta.pack.description);
            console.log('Pack format:', packMcmeta.pack.pack_format);
        }
        else {
            console.warn('pack.mcmetaがありません');
        }
    }

    /**
     * pack.mcmetaを取得する
     */
    public GetPackMcmeta(): PackMcMeta | undefined {
        try {
            return JSON.parse(this.readFile('pack.mcmeta', 'utf-8'));
        }
        catch {
            return undefined;
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
            this.modelDataCache[filePath] = JSON.parse(this.readFile(filePath, 'utf-8'));
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
            const blob = new Blob([this.readFile(filePath)]);
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
            return JSON.parse(this.readFile(mcMetaPath, 'utf-8'));
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

        return `assets/${namespace}/${target}/${fileName}${ext}`;
    }

    /**
     * ファイルを読み込む
     * @param filePath ファイルのパス
     * @param encoding エンコード
     */
    private readFile(filePath: string): Buffer;
    private readFile(filePath: string, encoding: BufferEncoding): string;
    private readFile(filePath: string, encoding?: BufferEncoding): Buffer | string {
        try {
            if (this.zipData) {
                if (encoding) {
                    return this.zipData.getEntry(filePath).getData().toString(encoding);
                }
                else {
                    return this.zipData.getEntry(filePath).getData();
                }
            }
            else {
                if (encoding) {
                    return readFileSync(path.join(this.packPath, filePath), encoding);
                }
                else {
                    return readFileSync(path.join(this.packPath, filePath));
                }
            }
        }
        catch {
            throw Error(`ファイルが存在しません: ${filePath}`);
        }
    }
}
