"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolsHelper = void 0;
/** AI Tools用の機能を管理・実行するためのヘルパークラス */
class ToolsHelper {
    /**
     * ToolsHelperのコンストラクタ
     * @param fileSearch - ファイル検索機能を有効にするかどうか
     * @param codeInterpreter - コードインタープリター機能を有効にするかどうか
     * @param functionList - 初期化時に登録する機能のリスト
     */
    constructor(fileSearch = false, codeInterpreter = false, functionList = []) {
        /**
         * 新しい機能を追加する
         * @param funcInstance - 追加する機能のインスタンス
         */
        this.addFunction = (funcInstance) => {
            this.functions.push(funcInstance);
        };
        /**
         * 登録された機能を削除する
         * @param funcInstance - 削除する機能のインスタンス
         */
        this.removeFunction = (funcInstance) => {
            this.functions = this.functions.filter(func => func !== funcInstance);
        };
        /**
         * 指定された名前の機能を実行する
         * @param functionName - 実行する機能の名前
         * @param params - 実行時のパラメータ
         * @returns 機能の実行結果
         */
        this.callFunction = async (functionName, options) => {
            try {
                for (const func of this.functions) {
                    if (func.match(functionName, options.args)) {
                        return await func.callFunction(options);
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
            // キャンセル時の処理
            try {
                if (options.onCanceled) {
                    options.onCanceled('');
                }
            }
            catch (e) {
                console.error(e);
            }
            return {
                call_id: options.call_id,
                args: options.args,
                result: '',
                canceled: true,
            };
        };
        /**
         * 登録された全機能の定義オブジェクトを取得する
         * @returns 機能定義オブジェクトの配列
         */
        this.getDefineToolObjects = () => {
            const list = [];
            if (this.fileSearch)
                list.push({ type: 'file_search' });
            if (this.codeInterpreter)
                list.push({ type: 'code_interpreter' });
            for (const func of this.functions) {
                list.push(func.getDefineToolObject());
            }
            return list;
        };
        /**
         * トークヘルパーに登録された機能を適用する
         * @param talkHelper - 機能を適用するトークヘルパーインスタンス
         */
        this.applyTalkTools = (talkHelper) => {
            for (const func of this.functions) {
                this.applyFunction(talkHelper, func);
            }
        };
        /**
         * 個別の機能をトークヘルパーに適用する
         * @param talkHelper - 機能を適用するトークヘルパーインスタンス
         * @param func - 適用する機能のインスタンス
         * @private
         */
        this.applyFunction = (talkHelper, func) => {
            const defineTool = func.getDefineToolObject().function;
            const callback = func.callFunction;
            talkHelper.addTool(defineTool, async (...args) => {
                console.log('addTool Call >>', defineTool.name);
                const result = await callback({
                    thread_id: '', // 適切な値を設定
                    run_id: '', // 適切な値を設定
                    call_id: '', // 適切な値を設定
                    args,
                    onProgress: (message) => { },
                    onCanceled: (message) => { }
                });
                console.log('result >>>', result);
                return result?.result || 'データが見つかりません。';
            });
        };
        this.functions = functionList;
        this.fileSearch = fileSearch;
        this.codeInterpreter = codeInterpreter;
    }
}
exports.ToolsHelper = ToolsHelper;
exports.default = ToolsHelper;
