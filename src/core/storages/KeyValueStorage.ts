import * as fs from 'fs';
import * as dotenv from 'dotenv';
import Database, { type Database as DatabaseType } from 'better-sqlite3';

dotenv.config();
const dbDir = './db/';

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
  private static _db: { [key: string]: KeyValueStorage } = {};
  private _initialized: boolean = false;
  private db: DatabaseType | null = null;
  private dbName: string = '';
  private tableName: string = '';
  private dbPath: string = '';

  /**
   * 指定されたデータベース名とテーブル名でKeyValueStorageのインスタンスを取得します
   * @param dbName - データベース名（デフォルト: ':memory:'）
   * @param tableName - テーブル名（デフォルト: 'articles'）
   * @param forceClear - trueの場合、既存のデータベースを削除して新規作成
   * @returns KeyValueStorageインスタンス
   */
  static getInstance(dbName: string = ':memory:', tableName: string = 'articles', forceClear: boolean = false): KeyValueStorage {
    if (KeyValueStorage._db[dbName]) {
      return KeyValueStorage._db[dbName];
    }

    const storage = new KeyValueStorage();
    storage.init(dbName, tableName, forceClear);
    KeyValueStorage._db[dbName] = storage;
    return storage;
  }

  private constructor() {}

  /**
   * データベースを初期化し、必要なテーブルを作成します
   * @param dbName - データベース名
   * @param tableName - テーブル名
   * @param forceClear - trueの場合、既存のデータベースを削除
   * @throws データベース操作に失敗した場合にエラーをコンソールに出力
   */
  init(dbName: string = ':memory:', tableName: string = 'articles', forceClear: boolean = false): void {
    if (this._initialized) return;
    if (this.db) return;
    
    this._initialized = true;

    this.dbName = dbName;
    this.tableName = tableName;
    this.dbPath = dbDir + dbName + (dbName === ':memory:' ? '' : '.db');
    
    try {
      if (forceClear && fs.existsSync(this.dbPath)) {
        fs.unlinkSync(this.dbPath);
      }
    } catch(e) {
      console.error(e);
    }

    try {
      this.db = new Database(this.dbPath);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL,
          create_at DATETIME,
          create_at_string TEXT NOT NULL,
          meta TEXT NOT NULL,
          content TEXT NOT NULL,
          UNIQUE(key)
        );
      `);
    } catch(error) {
      console.error(error);
    }
  }

  /**
   * キーと値をデータベースに保存します
   * @param key - 一意のキー
   * @param content - 保存するコンテンツ（任意の型）
   * @param meta - 関連するメタデータ（オプション）
   * @returns 保存が成功した場合はtrue、失敗した場合はfalse
   * @throws データベースが初期化されていない場合にエラー
   */
  async save(key: string, content: any, meta: object = {}): Promise<boolean> {
    if (!this._initialized || !this.db) {
      throw new Error('Database not initialized');
    }

    const createAt = new Date();
    const createAtString = createAt.toISOString();
    const metaString = JSON.stringify(meta);
    const contentString = JSON.stringify({ content });

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO ${this.tableName} (key, create_at, create_at_string, meta, content)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(key, createAt.getTime(), createAtString, metaString, contentString);
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  /**
   * 指定されたキーに関連するすべてのデータを取得します
   * @param key - 検索するキー
   * @returns StorageDataオブジェクト、存在しない場合はnull
   * @throws データベースが初期化されていない場合にエラー
   */
  async getData(key: string): Promise<StorageData | null> {
    if (!this._initialized || !this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM ${this.tableName} WHERE key = ?
      `);
      const result = stmt.get(key) as StorageData | undefined;
      
      if (result) {
        result.meta = JSON.parse(result.meta);
        result.content = JSON.parse(result.content).content;
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  }

  /**
   * 指定されたキーに関連するコンテンツのみを取得します
   * @param key - 検索するキー
   * @returns 保存されているコンテンツ、存在しない場合はnull
   */
  async get(key: string): Promise<any | null> {
    const data = await this.getData(key);
    return data ? data.content : null;
  }

  /**
   * 指定されたキーに関連するメタデータのみを取得します
   * @param key - 検索するキー
   * @returns メタデータオブジェクト、存在しない場合はnull
   */
  async getMeta(key: string): Promise<any | null> {
    const data = await this.getData(key);
    return data && typeof data.meta === 'string' ? JSON.parse(data.meta) : data?.meta || null;
  }
}
