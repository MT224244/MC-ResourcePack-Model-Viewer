import { readFileSync, statSync } from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import * as THREE from 'three';

import { IDisposable } from '@/renderer/IDisposable';

export class ResourcePack implements IDisposable {
    /**
     * リソースパックのパス
     */
    public get PackPath() { return this.packPath; }
    private packPath: string;

    /**
     * リソースパックのファイル(ディレクトリ)名
     */
    public get PackName() { return this.packName; }
    private packName: string;

    /**
     * リソースパックの説明
     */
    public get PackDescription() { return this.packDescription; }
    private packDescription?: string = undefined;

    /**
     * リソースパックのフォーマット番号
     */
    public get PackFormat() { return this.packFormat; }
    private packFormat?: number = undefined;

    /**
     * リソースパックのアイコン(Blob URL)
     */
    public get PackIcon() { return this.packIcon; }
    private packIcon?: string;

    public get ErrorMessage() { return this.errorMessage; }
    private errorMessage: string | null = null;

    /**
     * zip/jarファイルのデータ\
     * これがnullじゃなければ圧縮されたリソパを読み込んでる
     */
    private zipData: AdmZip | null = null;

    public constructor(packPath: string) {
        this.packPath = packPath;
        this.packName = path.basename(packPath);

        try {
            if (statSync(packPath).isFile()) {
                try {
                    this.zipData = new AdmZip(packPath);
                }
                catch {
                    this.errorMessage = '読み込めませんでした';
                    throw Error;
                }
            }

            const packMcmeta = this.GetPackMcmeta();
            if (packMcmeta) {
                this.packDescription = packMcmeta.pack.description;
                this.packFormat = packMcmeta.pack.pack_format;
            }
            else {
                this.errorMessage = 'pack.mcmeta がありません';
                throw Error;
            }

            try {
                this.packIcon = URL.createObjectURL(new Blob([this.readFile('pack.png')]));
            }
            catch {
                this.errorMessage = 'pack.png がありません';
            }
        }
        catch {
            this.Dispose();
        }
    }

    /**
     * pack.mcmetaを取得する
     */
    public GetPackMcmeta(): PackMcMeta | undefined {
        try {
            return JSON.parse(this.readFile('pack.mcmeta', 'utf-8').replace(/[\n\r]/g, ''));
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

        return JSON.parse(this.readFile(filePath, 'utf-8'));
    }

    /**
     * テクスチャを読み込みます
     * @param id 名前空間ID
     * @returns テクスチャ
     */
    public async GetTexture(id: string): Promise<TextureData> {
        const filePath = this.resolvePath(id, 'textures');

        const blob = new Blob([this.readFile(filePath)]);
        const texLoader = new THREE.TextureLoader();
        const tex = await texLoader.loadAsync(URL.createObjectURL(blob));
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;

        const metaData = this.getTextureMcMeta(id);

        return {
            texture: tex,
            animation: metaData && metaData.animation
        };
    }

    public Dispose() {
        this.zipData = null;
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
