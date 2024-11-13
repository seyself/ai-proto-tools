"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
dotenv.config();
const dbDir = './db/';
class KeyValueStorage {
    /**
     * 指定されたデータベース名とテーブル名でKeyValueStorageのインスタンスを取得します
     * @param dbName - データベース名（デフォルト: ':memory:'）
     * @param tableName - テーブル名（デフォルト: 'articles'）
     * @param forceClear - trueの場合、既存のデータベースを削除して新規作成
     * @returns KeyValueStorageインスタンス
     */
    static getInstance(dbName = ':memory:', tableName = 'articles', forceClear = false) {
        if (KeyValueStorage._db[dbName]) {
            return KeyValueStorage._db[dbName];
        }
        const storage = new KeyValueStorage();
        storage.init(dbName, tableName, forceClear);
        KeyValueStorage._db[dbName] = storage;
        return storage;
    }
    constructor() {
        this._initialized = false;
        this.db = null;
        this.dbName = '';
        this.tableName = '';
        this.dbPath = '';
    }
    /**
     * データベースを初期化し、必要なテーブルを作成します
     * @param dbName - データベース名
     * @param tableName - テーブル名
     * @param forceClear - trueの場合、既存のデータベースを削除
     * @throws データベース操作に失敗した場合にエラーをコンソールに出力
     */
    init(dbName = ':memory:', tableName = 'articles', forceClear = false) {
        if (this._initialized)
            return;
        if (this.db)
            return;
        this._initialized = true;
        this.dbName = dbName;
        this.tableName = tableName;
        this.dbPath = dbDir + dbName + (dbName === ':memory:' ? '' : '.db');
        try {
            if (forceClear && fs.existsSync(this.dbPath)) {
                fs.unlinkSync(this.dbPath);
            }
        }
        catch (e) {
            console.error(e);
        }
        try {
            this.db = new better_sqlite3_1.default(this.dbPath);
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
        }
        catch (error) {
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
    async save(key, content, meta = {}) {
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
        }
        catch (error) {
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
    async getData(key) {
        if (!this._initialized || !this.db) {
            throw new Error('Database not initialized');
        }
        try {
            const stmt = this.db.prepare(`
        SELECT * FROM ${this.tableName} WHERE key = ?
      `);
            const result = stmt.get(key);
            if (result) {
                result.meta = JSON.parse(result.meta);
                result.content = JSON.parse(result.content).content;
                return result;
            }
            return null;
        }
        catch (error) {
            console.error('Error getting data:', error);
            return null;
        }
    }
    /**
     * 指定されたキーに関連するコンテンツのみを取得します
     * @param key - 検索するキー
     * @returns 保存されているコンテンツ、存在しない場合はnull
     */
    async get(key) {
        const data = await this.getData(key);
        return data ? data.content : null;
    }
    /**
     * 指定されたキーに関連するメタデータのみを取得します
     * @param key - 検索するキー
     * @returns メタデータオブジェクト、存在しない場合はnull
     */
    async getMeta(key) {
        const data = await this.getData(key);
        return data && typeof data.meta === 'string' ? JSON.parse(data.meta) : data?.meta || null;
    }
}
KeyValueStorage._db = {};
exports.default = KeyValueStorage;
