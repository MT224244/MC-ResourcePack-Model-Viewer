import { ResourcePack } from '@/renderer/ResourcePack';
import { generateErrTex } from '@/renderer/generateErrTex';

export class ResourcePackLoader {
    public static get ResourcePacks() { return this.resourcePacks; }
    private static resourcePacks: ResourcePack[] = [];

    /**
     * リソースパックを追加する
     * @param packPath リソパのパス(ディレクトリでもzipでも可)
     */
    public static AddResourcePack(packPath: string) {
        // 同じリソパは読み込まない
        if (this.resourcePacks.find(x => x.PackPath === packPath)) return;

        try {
            const rp = new ResourcePack(packPath);
            this.resourcePacks.splice(0, 0, rp);
        }
        catch {
            throw Error('リソースパックを読み込めませんでした');
        }
    }

    /**
     * リソースパックを削除する
     * @param packPath リソパのパス
     */
    public static RemoveResourcePack(packPath: string) {
        const idx = this.resourcePacks.findIndex(x => x.PackPath === packPath);
        if (idx > -1) {
            this.resourcePacks[idx].Dispose();
            this.resourcePacks.splice(idx, 1);
        }
    }

    /**
     * ブロックモデルの名前空間リストを取得する
     */
    public static GetBlockModelIds() {
        const array: string[] = [];

        for (const rp of this.resourcePacks) {
            array.push(...rp.GetBlockModelIds());
        }

        return [...new Set(array)].sort();
    }

    /**
     * アイテムモデルの名前空間リストを取得する
     */
    public static GetItemModelIds() {
        const array: string[] = [];

        for (const rp of this.resourcePacks) {
            array.push(...rp.GetItemModelIds());
        }

        return [...new Set(array)].sort();
    }

    /**
     * モデルデータを読み込みます
     * @param id 名前空間ID
     * @returns モデルデータ
     */
    public static GetModelData(id: string): ModelData {
        for (const rp of this.resourcePacks) {
            try {
                return rp.GetModelData(id);
            }
            catch {}
        }

        throw Error(`モデルデータが見つかりません: ${id}`);
    }

    /**
     * テクスチャを読み込みます
     * @param id 名前空間ID
     * @returns テクスチャ
     */
    public static async GetTexture(id: string): Promise<TextureData> {
        for (const rp of this.resourcePacks) {
            try {
                return await rp.GetTexture(id);
            }
            catch {}
        }

        console.log('Missing texture:', id);

        return {
            texture: await generateErrTex()
        };
    }
}
