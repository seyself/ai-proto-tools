"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ツール関数の基底クラス
 * 各ツールはこのクラスを継承して実装する
 */
class ToolsFunction {
    constructor(functionName) {
        /**
         * ツール定義オブジェクトを取得する
         * @returns {DefineToolObject} ツール定義オブジェクト
         */
        this.getDefineToolObject = () => {
            return {
                type: 'function',
                function: {
                    type: 'function',
                    description: this.description,
                    name: this.functionName,
                    parameters: {
                        type: 'object',
                        properties: this.properties || {},
                        required: this.required || [],
                    },
                    // strict: this.strict,
                },
            };
        };
        /**
         * 関数名と引数が一致するかチェックする
         * @param funcName - チェックする関数名
         * @param args - チェックする引数
         * @returns {boolean} 一致する場合はtrue
         */
        this.match = (funcName, args) => {
            if (funcName !== this.functionName)
                return false;
            // 必須パラメータが全て存在するかチェック
            return this.required.every(param => args.hasOwnProperty(param));
        };
        this.functionName = functionName;
        this.description = '';
        this.properties = {};
        this.required = [];
        this.strict = false;
    }
}
exports.default = ToolsFunction;
