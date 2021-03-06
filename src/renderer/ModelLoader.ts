import { ResourcePackLoader } from '@/renderer/ResourcePackLoader';
import { BlockModel } from '@/renderer/models/BlockModel';
import { ItemModel } from '@/renderer/models/ItemModel';

export class ModelLoader {
    private rpLoader: ResourcePackLoader;

    public constructor(rpLoader: ResourcePackLoader) {
        this.rpLoader = rpLoader;
    }

    /**
     * ブロックのモデルを取得します
     * @param name 名前空間ID(?)
     * @returns THREE.Object3D
     */
    public LoadModel(name: string): THREE.Object3D {
        const rootModelData = this.rpLoader.GetModelData(name);
        const modelData = this.recursiveLoadModelData(rootModelData);

        // 親が builtin/generated だった時はアイテムモデル
        if (modelData.parent && modelData.parent === 'builtin/generated') {
            return new ItemModel(this.rpLoader, modelData);
        }

        // TODO: builtin/entity に対応する(そのうち)

        return new BlockModel(this.rpLoader, modelData);
    }

    /**
     * 再帰的にモデルデータを読み込みます
     * @param modelData モデルデータ
     * @returns 全ての親がマージされたモデルデータ
     */
    private recursiveLoadModelData(modelData: ModelData): ModelData {
        let resultModelData = modelData;

        if (modelData.parent) {
            // builtin/* 系はファイルとしては存在しない
            if (modelData.parent.startsWith('builtin/')) {
                return modelData;
            }

            const parentModelData = this.rpLoader.GetModelData(modelData.parent);

            // 親優先でマージ
            resultModelData = {
                ...resultModelData,
                ...parentModelData
            };

            resultModelData.parent = parentModelData.parent;

            // elementsは子に上書きされるので親のものは使わない
            if (modelData.elements) {
                resultModelData.elements = modelData.elements;
            }

            // texturesは親から子まで全て親優先でマージ
            if (modelData.textures || parentModelData.textures) {
                resultModelData.textures = {
                    ...modelData.textures,
                    ...parentModelData.textures
                };
            }

            return this.recursiveLoadModelData(resultModelData);
        }
        else {
            // なんとなく要素ごと消しておく(意味はない)
            delete resultModelData.parent;

            // テクスチャ変数の値を全部テクスチャ名にする
            if (resultModelData.textures) {
                const textures = resultModelData.textures;

                for (const texArg of Object.keys(textures)) {
                    const texName = this.recursiveSearchTexture(textures, textures[texArg]) || textures[texArg];
                    textures[texArg] = texName;
                }
            }

            return resultModelData;
        }
    }

    /**
     * テクスチャ変数を再帰的に遡ってテクスチャ名を探す
     * @param textures テクスチャの連想配列
     * @param search テクスチャ変数orテクスチャ名
     * @returns テクスチャ名
     */
    private recursiveSearchTexture(textures: Exclude<ModelData['textures'], undefined>, search: string): string | undefined {
        if (/^#/.test(search)) {
            return this.recursiveSearchTexture(textures, textures[search.slice(1)]);
        }
        else {
            return search;
        }
    }
}
