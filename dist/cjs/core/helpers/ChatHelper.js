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
const AIModel_js_1 = require("./AIModel.js");
const OpenAIChat_js_1 = __importDefault(require("./chat/OpenAIChat.js"));
const ClaudeChat_js_1 = __importDefault(require("./chat/ClaudeChat.js"));
const GeminiChat_js_1 = __importDefault(require("./chat/GeminiChat.js"));
const OllamaChat_js_1 = __importDefault(require("./chat/OllamaChat.js"));
const MiiboChat_js_1 = __importDefault(require("./chat/MiiboChat.js"));
dotenv.config();
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
class ChatHelper {
    get useModel() {
        return this.chat?.useModel || '';
    }
    static getClient(options = { systemPrompt: null, model: AIModel_js_1.AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        const model = options.model || AIModel_js_1.AIModel.gpt_default;
        if (model.startsWith('chatgpt-')
            || model.startsWith('gpt-')
            || model.startsWith('o1-')
            || model.startsWith('o3-')) {
            return new OpenAIChat_js_1.default(options);
        }
        else if (model.startsWith('claude-')) {
            return new ClaudeChat_js_1.default(options);
        }
        else if (model.startsWith('gemini-')) {
            return new GeminiChat_js_1.default(options);
        }
        return new OllamaChat_js_1.default(options);
    }
    static create(options = { systemPrompt: null, model: AIModel_js_1.AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        return new ChatHelper(ChatHelper.getClient(options));
    }
    static ChatGPT(options = { systemPrompt: null, model: AIModel_js_1.AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        return new ChatHelper(new OpenAIChat_js_1.default(options));
    }
    static Claude(options = { systemPrompt: null, model: AIModel_js_1.AIModel.claude_default, max_tokens: 4096, json: false, tools: null }) {
        return new ChatHelper(new ClaudeChat_js_1.default(options));
    }
    static Gemini(options = { systemPrompt: null, model: AIModel_js_1.AIModel.gemini_default, max_tokens: 2000000, json: false, tools: null }) {
        return new ChatHelper(new GeminiChat_js_1.default(options));
    }
    static Ollama(options = { systemPrompt: null, model: AIModel_js_1.AIModel.ollama_default, max_tokens: 2000000, json: false, tools: null }) {
        return new ChatHelper(new OllamaChat_js_1.default(options));
    }
    static Miibo(options = { systemPrompt: null, model: AIModel_js_1.AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        return new ChatHelper(new MiiboChat_js_1.default(options));
    }
    constructor(options = { systemPrompt: null, model: AIModel_js_1.AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        this.addUserMessage = (content) => {
            this.chat.addUserMessage(content);
        };
        this.addAssistantMessage = (content) => {
            this.chat.addAssistantMessage(content);
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
            return this.chat.send(userPrompt, options);
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
            return this.chat.vision(text, files, options);
        };
        this.chat = isChatHelper(options) ? options : ChatHelper.getClient(options);
    }
    clearHistory() {
        this.chat.clearHistory();
    }
}
exports.default = ChatHelper;
function isChatHelper(obj) {
    return 'send' in obj && 'vision' in obj && 'clearHistory' in obj;
}
