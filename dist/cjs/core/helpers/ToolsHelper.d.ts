import ToolsFunction, { type CallFunctionArgs, type DefineToolObject } from '../functions/ToolsFunction.js';
/** AI Tools用の機能を管理・実行するためのヘルパークラス */
export default class ToolsHelper {
    /** 登録された機能のリスト */
    functions: ToolsFunction[];
    /** ファイル検索機能の有効フラグ */
    fileSearch: boolean;
    /** コードインタープリター機能の有効フラグ */
    codeInterpreter: boolean;
    /**
     * ToolsHelperのコンストラクタ
     * @param fileSearch - ファイル検索機能を有効にするかどうか
     * @param codeInterpreter - コードインタープリター機能を有効にするかどうか
     * @param functionList - 初期化時に登録する機能のリスト
     */
    constructor(fileSearch?: boolean, codeInterpreter?: boolean, functionList?: ToolsFunction[]);
    /**
     * 新しい機能を追加する
     * @param funcInstance - 追加する機能のインスタンス
     */
    addFunction: (funcInstance: ToolsFunction) => void;
    /**
     * 登録された機能を削除する
     * @param funcInstance - 削除する機能のインスタンス
     */
    removeFunction: (funcInstance: ToolsFunction) => void;
    /**
     * 指定された名前の機能を実行する
     * @param functionName - 実行する機能の名前
     * @param params - 実行時のパラメータ
     * @returns 機能の実行結果
     */
    callFunction: (functionName: string, { thread_id, run_id, call_id, args, onProgress, onCanceled }: CallFunctionArgs) => Promise<any>;
    /**
     * 登録された全機能の定義オブジェクトを取得する
     * @returns 機能定義オブジェクトの配列
     */
    getDefineToolObjects: () => Array<{
        type: string;
    } | {
        function: DefineToolObject;
    }>;
    /**
     * トークヘルパーに登録された機能を適用する
     * @param talkHelper - 機能を適用するトークヘルパーインスタンス
     */
    applyTalkTools: (talkHelper: any) => void;
    /**
     * 個別の機能をトークヘルパーに適用する
     * @param talkHelper - 機能を適用するトークヘルパーインスタンス
     * @param func - 適用する機能のインスタンス
     * @private
     */
    private applyFunction;
}
//# sourceMappingURL=ToolsHelper.d.ts.map