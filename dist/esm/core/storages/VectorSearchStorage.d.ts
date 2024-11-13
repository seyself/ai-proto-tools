/**
 * ストレージに保存するアイテムの構造を定義するインターフェース
 */
interface StorageItem {
    content: string;
    meta: Record<string, any>;
}
/**
 * 検索結果のアイテムの構造を定義するインターフェース
 */
interface SearchResult {
    id: number;
    key: string;
    create_at: number;
    create_at_string: string;
    meta: string;
    content: string;
    similarity: number;
}
/**
 * ベクトル検索ストレージを管理するクラス
 * シングルトンパターンを採用し、データベース接続を効率的に管理します
 */
export default class VectorSearchStorage {
    private static _db;
    private _initialized;
    private db;
    private model;
    private dbName?;
    private tableName?;
    private dbPath?;
    /**
     * 指定されたデータベース名とテーブル名でインスタンスを取得します
     * @param dbName - データベース名（デフォルト: ':memory:'）
     * @param tableName - テーブル名（デフォルト: 'articles'）
     * @param forceClear - 既存のDBを強制的にクリアするかどうか
     * @returns VectorSearchStorageのインスタンス
     */
    static getInstance: (dbName?: string, tableName?: string, forceClear?: boolean) => VectorSearchStorage;
    constructor();
    /**
     * データベースを初期化し、必要なテーブルを作成します
     * @param dbName - データベース名
     * @param tableName - テーブル名
     * @param forceClear - 既存のDBを強制的にクリアするかどうか
     */
    init: (dbName?: string, tableName?: string, forceClear?: boolean) => void;
    /**
     * 指定されたキーに対応するIDを取得します
     * @param key - 検索するキー
     * @returns 対応するID、存在しない場合はnull
     */
    getIdByKey: (key: string) => number | null;
    /**
     * コンテンツをベクトル化してストレージに保存します
     * @param content - 保存するテキストコンテンツ
     * @param metaData - 関連するメタデータ
     */
    save: (content: string, metaData?: Record<string, any> | null) => Promise<void>;
    /**
     * 指定されたキーに対応するアイテムを取得します
     * @param key - 検索するキー
     * @returns StorageItemオブジェクト、存在しない場合はnull
     */
    getItemByKey: (key: string) => StorageItem | null;
    /**
     * 類似コンテンツを検索します
     * @param content - 検索クエリとなるテキスト
     * @param len - 取得する結果の最大数
     * @returns 類似度でソートされた検索結果の配列
     */
    search: (content: string, len?: number) => Promise<SearchResult[]>;
}
/**
 * テキストをOpenAI APIを使用してベクトル化します
 * @param text - ベクトル化するテキスト
 * @param model - 使用するEmbeddingモデル名
 * @returns ベクトル化された数値配列
 */
export declare function vectorizeText(text: string, model?: string): Promise<number[]>;
export {};
//# sourceMappingURL=VectorSearchStorage.d.ts.map