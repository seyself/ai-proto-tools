/**
 * キーバリューペアをSQLiteデータベースに永続化するためのストレージクラス
 * シングルトンパターンを使用して、データベース接続を管理します
 */
interface StorageData {
    /** 一意の識別子 */
    id: number;
    /** ストレージのキー */
    key: string;
    /** 作成日時（UNIXタイムスタンプ） */
    create_at: number;
    /** ISO形式の作成日時文字列 */
    create_at_string: string;
    /** JSON形式のメタデータ */
    meta: string;
    /** JSON形式のコンテンツ */
    content: string;
}
export default class KeyValueStorage {
    private static _db;
    private _initialized;
    private db;
    private dbName;
    private tableName;
    private dbPath;
    /**
     * 指定されたデータベース名とテーブル名でKeyValueStorageのインスタンスを取得します
     * @param dbName - データベース名（デフォルト: ':memory:'）
     * @param tableName - テーブル名（デフォルト: 'articles'）
     * @param forceClear - trueの場合、既存のデータベースを削除して新規作成
     * @returns KeyValueStorageインスタンス
     */
    static getInstance(dbName?: string, tableName?: string, forceClear?: boolean): KeyValueStorage;
    private constructor();
    /**
     * データベースを初期化し、必要なテーブルを作成します
     * @param dbName - データベース名
     * @param tableName - テーブル名
     * @param forceClear - trueの場合、既存のデータベースを削除
     * @throws データベース操作に失敗した場合にエラーをコンソールに出力
     */
    init(dbName?: string, tableName?: string, forceClear?: boolean): void;
    /**
     * キーと値をデータベースに保存します
     * @param key - 一意のキー
     * @param content - 保存するコンテンツ（任意の型）
     * @param meta - 関連するメタデータ（オプション）
     * @returns 保存が成功した場合はtrue、失敗した場合はfalse
     * @throws データベースが初期化されていない場合にエラー
     */
    save(key: string, content: any, meta?: object): Promise<boolean>;
    /**
     * 指定されたキーに関連するすべてのデータを取得します
     * @param key - 検索するキー
     * @returns StorageDataオブジェクト、存在しない場合はnull
     * @throws データベースが初期化されていない場合にエラー
     */
    getData(key: string): Promise<StorageData | null>;
    /**
     * 指定されたキーに関連するコンテンツのみを取得します
     * @param key - 検索するキー
     * @returns 保存されているコンテンツ、存在しない場合はnull
     */
    get(key: string): Promise<any | null>;
    /**
     * 指定されたキーに関連するメタデータのみを取得します
     * @param key - 検索するキー
     * @returns メタデータオブジェクト、存在しない場合はnull
     */
    getMeta(key: string): Promise<any | null>;
}
export {};
//# sourceMappingURL=KeyValueStorage.d.ts.map