import OpenAI from 'openai';
/**
 * アシスタント実行のパラメータを定義するインターフェース
 * @interface RunParams
 */
interface RunParams {
    /** アシスタントのID */
    assistant_id: string;
    /** スレッドのID */
    thread_id: string;
    /** オプションの指示内容 */
    instructions?: string;
    /** 進捗コールバック関数 */
    callback?: (message: any) => Promise<void>;
}
interface FileUploadResult {
    id: string;
    filename: string;
    purpose: string;
    bytes: number;
    created_at: number;
    status: string;
    status_details?: any;
}
/**
 * OpenAI Assistant APIを操作するためのヘルパークラス
 * アシスタントの作成、実行、メッセージの送信、ファイルの操作などの機能を提供する
 */
export default class AssistantHelper {
    private onReady;
    private _assistant_id;
    private tools;
    private model?;
    private description?;
    private instructions?;
    private top_p?;
    private temperature?;
    private response_format?;
    private _referenceText?;
    private _tool_outputs?;
    private _tool_outputs_count?;
    private referenceLinks?;
    private supplementaryInfo?;
    /**
     * AssistantHelper のコンストラクタ
     * @param {string} assistant_id - アシスタントの ID
     */
    constructor(assistant_id: string);
    /**
     * アシスタント ID を設定し、アシスタントの情報を取得する
     * @param {string} assistant_id - 設定するアシスタント ID
     * @returns {Promise<void>}
     */
    setAssistantId: (assistant_id: string) => Promise<void>;
    /**
     * 新しいアシスタントを作成する
     * @param {string} name - アシスタントの名前
     * @param {string} instructions - アシスタントの指示
     * @param {string} [model] - 使用するモデル（オプション）
     * @returns {Promise<OpenAI.Beta.Assistants.Assistant>}
     */
    createNewAssistant: (name: string, instructions: string, model?: string) => Promise<OpenAI.Beta.Assistants.Assistant>;
    /**
     * スレッドを取得する
     * @param {string} thread_id - スレッド ID
     * @returns {Promise<OpenAI.Beta.Threads.Thread | null>}
     */
    retrieveThread: (thread_id: string) => Promise<OpenAI.Beta.Threads.Thread | null>;
    /**
     * 現在のアシスタントの実行をキャンセルする
     * @returns {Promise<void>}
     */
    cancelCurrentAssistant: () => Promise<void>;
    cancelAssistant: (thread_id: string, run_id: string) => Promise<void>;
    createNewThread: () => Promise<OpenAI.Beta.Threads.Thread>;
    addMessage: (thread_id: string, content: string, fileList?: {
        id: string;
    }[] | null) => Promise<OpenAI.Beta.Threads.Message | null>;
    /**
     * アシスタントを実行する
     * @param {RunParams} params - 実行パラメータ
     * @returns {Promise<{ status: string; text: string | null; files: any[] | null } | null>} 実行結果
     * @throws {Error} アシスタントの実行に失敗した場合
     */
    runAssistant: ({ assistant_id, thread_id, instructions, callback }: RunParams) => Promise<{
        status: string;
        text: string | null;
        files: any[] | null;
    } | null>;
    private prepareParams;
    private createRunWithRetries;
    private monitorRunStatus;
    private retrieveRunStatus;
    private handleCancelled;
    private handleFailed;
    private handleActionRequired;
    private processToolCall;
    private callFunctionTool;
    private setToolOutput;
    private retrieveResult;
    private processResults;
    private saveAnnotationFiles;
    uploadFiles: (fileList: {
        id: string;
        filePath?: string;
    }[] | null, afterRemoveFile?: boolean) => Promise<any[] | null>;
    /**
     * ファイルをアップロードする
     * @param {string} filePath - アップロードするファイルのパス
     * @param {boolean} [afterRemoveFile=false] - アップロード後にファイルを削除するかどうか
     * @returns {Promise<FileUploadResult>}
     */
    uploadFile: (filePath: string, afterRemoveFile?: boolean) => Promise<FileUploadResult>;
    /**
     * ファイルをアップロードしてアシスタントに追加する
     * @param {string} assistant_id - アシスタントのID
     * @param {Array<{ id: string; mimeType: string }>} fileList - アップロードするファイルのリスト
     * @returns {Promise<void>}
     */
    addFilesToAssistant: (assistant_id: string, fileList: {
        id: string;
        mimeType: string;
    }[]) => Promise<void>;
    /**
     * Vision APIを使用して画像解析を実行する
     * @param {string} text - 画像に関連する質問やプロンプト
     * @param {Array<{ dataURL: string }>} files - 解析する画像ファイルのリスト
     * @returns {Promise<string | null>} 解析結果のテキスト
     */
    vision: (text: string, files: {
        dataURL: string;
    }[]) => Promise<string | null>;
}
export {};
//# sourceMappingURL=AssistantHelper.d.ts.map