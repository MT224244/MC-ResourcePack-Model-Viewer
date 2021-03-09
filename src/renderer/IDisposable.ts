/**
 * 破棄可能オブジェクト
 */
export interface IDisposable {
    /**
     * オブジェクトを破棄する
     */
    Dispose(): void;
}
