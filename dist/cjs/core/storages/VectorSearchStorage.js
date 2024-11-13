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
exports.vectorizeText = vectorizeText;
/**
 * OpenAIのEmbeddingAPIを使用してテキストデータをベクトル化し、
 * SQLite-VECで保存・検索を行うためのストレージクラス
 */
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const sqliteVec = __importStar(require("sqlite-vec"));
dotenv_1.default.config();
const openai = new openai_1.default();
const dbDir = './db/';
// 定数定義
const EMBEDDING_MODEL_SMALL = { name: 'text-embedding-3-small', size: 1536 };
const EMBEDDING_MODEL_LARGE = { name: 'text-embedding-3-large', size: 3072 };
const EMBEDDING_MODEL_OLD = { name: 'text-embedding-ada-002', size: 1536 };
const EMBEDDING_MODEL = EMBEDDING_MODEL_SMALL;
/**
 * ベクトル検索ストレージを管理するクラス
 * シングルトンパターンを採用し、データベース接続を効率的に管理します
 */
class VectorSearchStorage {
    constructor() {
        /**
         * データベースを初期化し、必要なテーブルを作成します
         * @param dbName - データベース名
         * @param tableName - テーブル名
         * @param forceClear - 既存のDBを強制的にクリアするかどうか
         */
        this.init = (dbName = ':memory:', tableName = 'articles', forceClear = false) => {
            if (this._initialized)
                return;
            if (this.db)
                return;
            this._initialized = true;
            this.dbName = dbName;
            this.tableName = tableName;
            this.dbPath = dbDir + dbName + (dbName == ':memory:' ? '' : '.db');
            try {
                if (forceClear) {
                    if (fs_1.default.existsSync(this.dbPath)) {
                        fs_1.default.unlinkSync(this.dbPath);
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
            try {
                this.db = new better_sqlite3_1.default(this.dbPath);
                sqliteVec.load(this.db);
                const result = this.db
                    .prepare(`
          select sqlite_version() as sqlite_version, 
          vec_version() as vec_version;
        `)
                    .get();
                console.log('sqlite_version:', result.sqlite_version);
                console.log('vec_version:', result.vec_version);
            }
            catch (e) {
            }
            try {
                if (!this.db)
                    throw new Error('Database not initialized');
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
                // sqlite-vecのテーブル作成構文
                this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS vec_${this.tableName} USING vec0(
          embedding float[${this.model.size}]
        );
      `);
                // // 利用可能な関数を確認（デバッグ用）
                // const functions = this.db.prepare(`
                //   SELECT name FROM pragma_function_list 
                //   WHERE name LIKE 'vec%';
                // `).all();
                // console.log('Available vector functions:', functions);
            }
            catch (error) {
                console.error('Error in table creation:', error);
                throw error;
            }
        };
        /**
         * 指定されたキーに対応するIDを取得します
         * @param key - 検索するキー
         * @returns 対応するID、存在しない場合はnull
         */
        this.getIdByKey = (key) => {
            try {
                const query = this.db?.prepare(`
        SELECT id
        FROM ${this.tableName}
        WHERE key = ?
        LIMIT 1
      `);
                const result = query?.get(key);
                return result ? result.id : null;
            }
            catch (error) {
                console.error('Error in getIdByKey:', error);
                return null;
            }
        };
        /**
         * コンテンツをベクトル化してストレージに保存します
         * @param content - 保存するテキストコンテンツ
         * @param metaData - 関連するメタデータ
         */
        this.save = async (content, metaData = null) => {
            if (!this.db)
                throw new Error('Database not initialized');
            try {
                let create_at = Date.now();
                let create_at_string = new Date().toISOString();
                const metaString = JSON.stringify(metaData || {});
                const key = metaData?.key || create_at.toString();
                // SQLite-VECにtextとベクトルを保存する
                const insert1 = this.db.prepare(`
        INSERT OR REPLACE INTO ${this.tableName}(
          key, 
          create_at, 
          create_at_string, 
          meta,
          content
        )
        VALUES (?, ?, ?, ?, ?)
      `);
                insert1.run(key, create_at, create_at_string, metaString, content);
                const last_id = this.getIdByKey(key);
                if (!last_id)
                    throw new Error('Failed to get ID for key: ' + key);
                const insert2 = this.db.prepare(`
        INSERT OR REPLACE INTO vec_${this.tableName}(rowid, embedding)
        VALUES (?, ?)
      `);
                const vector = await vectorizeText(content, this.model.name);
                insert2.run(BigInt(last_id), new Float32Array(vector));
            }
            catch (error) {
                console.error('Error in add:', error);
                throw error;
            }
        };
        /**
         * 指定されたキーに対応するアイテムを取得します
         * @param key - 検索するキー
         * @returns StorageItemオブジェクト、存在しない場合はnull
         */
        this.getItemByKey = (key) => {
            if (!this.db)
                throw new Error('Database not initialized');
            try {
                const query = this.db.prepare(`
        SELECT content, meta
        FROM ${this.tableName}
        WHERE key = ?
        LIMIT 1
      `);
                const result = query.get(key);
                if (result) {
                    return {
                        content: result.content,
                        meta: JSON.parse(result.meta)
                    };
                }
                return null;
            }
            catch (error) {
                console.error('Error in getItemByKey:', error);
                return null;
            }
        };
        /**
         * 類似コンテンツを検索します
         * @param content - 検索クエリとなるテキスト
         * @param len - 取得する結果の最大数
         * @returns 類似度でソートされた検索結果の配列
         */
        this.search = async (content, len = 10) => {
            if (!this.db)
                throw new Error('Database not initialized');
            try {
                const vector = await vectorizeText(content, this.model.name);
                // Changed vec_dot_product to 1 - vec_distance_cosine since cosine distance is the opposite of cosine similarity
                const search = this.db.prepare(`
        SELECT ${this.tableName}.*, 
               (1 - vec_distance_cosine(vec_${this.tableName}.embedding, ?)) as similarity
        FROM vec_${this.tableName}
        JOIN ${this.tableName} ON vec_${this.tableName}.rowid = ${this.tableName}.id
        ORDER BY similarity DESC
        LIMIT ?
      `);
                const results = search.all(new Float32Array(vector), len);
                return results;
            }
            catch (error) {
                console.error('Error in search:', error);
                throw error;
            }
        };
        this._initialized = false;
        this.db = null;
        this.model = EMBEDDING_MODEL;
    }
}
VectorSearchStorage._db = {};
/**
 * 指定されたデータベース名とテーブル名でインスタンスを取得します
 * @param dbName - データベース名（デフォルト: ':memory:'）
 * @param tableName - テーブル名（デフォルト: 'articles'）
 * @param forceClear - 既存のDBを強制的にクリアするかどうか
 * @returns VectorSearchStorageのインスタンス
 */
VectorSearchStorage.getInstance = (dbName = ':memory:', tableName = 'articles', forceClear = false) => {
    if (VectorSearchStorage._db[dbName]) {
        return VectorSearchStorage._db[dbName];
    }
    const storage = new VectorSearchStorage();
    storage.init(dbName, tableName, forceClear);
    VectorSearchStorage._db[dbName] = storage;
    return storage;
};
exports.default = VectorSearchStorage;
/**
 * テキストをOpenAI APIを使用してベクトル化します
 * @param text - ベクトル化するテキスト
 * @param model - 使用するEmbeddingモデル名
 * @returns ベクトル化された数値配列
 */
async function vectorizeText(text, model = '') {
    try {
        const response = await openai.embeddings.create({
            model: model || EMBEDDING_MODEL.name,
            input: text,
            encoding_format: "float",
        });
        if (!response?.data?.[0]?.embedding) {
            throw new Error('Failed to get embedding from OpenAI');
        }
        return response.data[0].embedding;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
}
