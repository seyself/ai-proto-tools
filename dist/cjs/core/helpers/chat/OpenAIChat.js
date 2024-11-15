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
const dotenv = __importStar(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
const readFileToBase64_js_1 = require("../../utils/readFileToBase64.js");
const AIModel_js_1 = require("../AIModel.js");
dotenv.config();
const openai = new openai_1.default();
/**
 * ChatHelper クラスは OpenAI の API を使用してチャット機能を提供します。
 * このクラスは、テキストベースの会話とビジョン（画像解析）機能をサポートし、
 * 会話履歴の管理も行います。
 *
 * @example
 * const chatHelper = new ChatHelper({
 *   systemPrompt: "あなたは親切なアシスタントです",
 *   model: "gpt-4"
 * });
 * const response = await chatHelper.send("こんにちは");
 */
class OpenAIChat {
    /**
     * ChatHelper のインスタンスを作成します。
     * @param {ChatHelperOptions} options - 設定オプション
     * @param {string} [options.systemPrompt] - システムプロンプト
     * @param {string} [options.model='gpt-4o'] - 使用する AI モデル
     * @param {number} [options.max_tokens=4096] - 最大トークン数
     */
    constructor(options = { systemPrompt: null, model: AIModel_js_1.AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        this.history = [];
        this.addUserMessage = (content) => {
            this.history.push({ role: 'user', content });
        };
        this.addAssistantMessage = (content) => {
            this.history.push({ role: 'assistant', content });
        };
        /**
         * ユーザーのプロンプトを送信し、AI からの応答を取得します。
         * このメソッドは会話履歴を保持し、文脈を考慮した応答を返します。
         *
         * @param {string} userPrompt - ユーザーのプロンプト
         * @param {SendOptions} options - 送信オプション
         * @param {boolean} [options.json=false] - JSON 形式で応答を受け取るかどうか
         * @param {string|null} [options.model=null] - 使用する AI モデル（null の場合はデフォルトを使用）
         * @param {ToolsHelper} [options.tools=null] - 使用するツール（Function calling 用）
         * @returns {Promise<string|object|null>} AI からの応答
         *   - string: テキスト形式の応答
         *   - object: JSON形式の応答（options.json が true の場合）
         *   - null: エラーが発生した場合または応答が空の場合
         * @throws {Error} API リクエスト中にエラーが発生した場合
         */
        this.send = async (userPrompt, options = { json: false, model: null, tools: null }) => {
            if (!userPrompt)
                return null;
            const { systemPrompt, model, max_tokens, json, tools } = options;
            this.history.push({ role: "user", content: userPrompt });
            const data = {
                model: model || this.useModel,
                messages: this.history
            };
            if (json) {
                data.response_format = { type: 'json_object' };
            }
            if (tools) {
                data.tools = tools.getDefineToolObjects();
            }
            try {
                const response = await openai.chat.completions.create(data);
                if (OpenAIChat.enableLog)
                    console.log('API >> response >>>', response);
                if ('choices' in response && response.choices.length > 0) {
                    const content = response.choices[0]?.message?.content;
                    if (content) {
                        if (json) {
                            try {
                                const responseJson = JSON.parse(content);
                                this.history.push({ role: "assistant", content });
                                return responseJson;
                            }
                            catch (e) {
                                console.error('JSON Parse Error >>> \n' + e.toString());
                            }
                        }
                        else {
                            this.history.push({ role: "assistant", content });
                            return content;
                        }
                    }
                }
                return null;
            }
            catch (error) {
                console.error('Error fetching data:', error);
            }
            return null;
        };
        /**
         * 画像を含むテキストを送信し、AI による画像解析結果を取得します。
         * このメソッドは GPT-4 Vision API を使用して画像の分析と理解を行います。
         *
         * @param {string} text - 画像に関連するテキスト（質問や指示など）
         * @param {VisionFile[]} files - 解析する画像ファイルの配列
         * @returns {Promise<string|null>} AI による画像解析結果
         *   - string: 画像分析の結果
         *   - null: エラーが発生した場合または応答が空の場合
         * @throws {Error} 画像処理中にエラーが発生した場合
         */
        this.vision = async (text, files, options) => {
            const { model } = options || {};
            const reqContent = [
                {
                    type: 'text',
                    text: text
                },
            ];
            for (const filePath of files) {
                if (filePath) {
                    if (filePath.indexOf(';base64,') > 0) {
                        reqContent.push({
                            type: 'image_url',
                            image_url: {
                                'url': filePath,
                            },
                        });
                    }
                    else {
                        const fileInfo = await (0, readFileToBase64_js_1.readFileToBase64)(filePath);
                        reqContent.push({
                            type: 'image_url',
                            image_url: {
                                'url': fileInfo.base64,
                            },
                        });
                    }
                }
            }
            this.history.push({ role: "user", content: reqContent });
            try {
                const visionResponse = await openai.chat.completions.create({
                    model: model || this.useModel || AIModel_js_1.AIModel.gpt_default,
                    max_tokens: this.maxTokens,
                    messages: this.history,
                });
                const content = visionResponse.choices[0]?.message?.content;
                this.history.push({ role: "assistant", content });
                return content;
            }
            catch (error) {
                console.error('Error in vision processing:', error);
                return null;
            }
        };
        const { systemPrompt, model, max_tokens, json, tools } = options;
        this.systemPrompt = systemPrompt;
        this.useModel = model || AIModel_js_1.AIModel.gpt_default;
        this.maxTokens = max_tokens || 4096;
        this.tools = tools || null;
        this.json = json || false;
        this.clearHistory();
    }
    clearHistory() {
        this.history = [];
        if (this.systemPrompt) {
            this.history.push({ role: "system", content: this.systemPrompt });
        }
    }
}
OpenAIChat.enableLog = false;
exports.default = OpenAIChat;
