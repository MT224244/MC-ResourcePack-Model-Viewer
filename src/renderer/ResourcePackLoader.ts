import { ResourcePack } from '@/renderer/ResourcePack';
import { generateErrTex } from '@/renderer/generateErrTex';

export class ResourcePackLoader {
    private resourcePacks: ResourcePack[] = [];

    public AddResourcePack(packPath: string) {
        try {
            const rp = new ResourcePack(packPath);
            this.resourcePacks.splice(0, 0, rp);
        }
        catch {
            throw Error('リソースパックを読み込めませんでした');
        }
    }

    /**
     * モデルデータを読み込みます
     * @param id 名前空間ID
     * @returns モデルデータ
     */
    public GetModelData(id: string): ModelData {
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
    public async GetTexture(id: string): Promise<TextureData> {
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
