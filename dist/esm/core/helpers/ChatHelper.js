import * as dotenv from 'dotenv';
import { AIModel } from './AIModel.js';
import OpenAIChat from './chat/OpenAIChat.js';
import ClaudeChat from './chat/ClaudeChat.js';
import GeminiChat from './chat/GeminiChat.js';
import OllamaChat from './chat/OllamaChat.js';
import MiiboChat from './chat/MiiboChat.js';
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
export default class ChatHelper {
    get useModel() {
        return this.chat?.useModel || '';
    }
    static getClient(options = { systemPrompt: null, model: AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        const model = options.model || AIModel.gpt_default;
        if (model.startsWith('gpt-') || model.startsWith('o1-')) {
            return new OpenAIChat(options);
        }
        else if (model.startsWith('claude-')) {
            return new ClaudeChat(options);
        }
        else if (model.startsWith('gemini-')) {
            return new GeminiChat(options);
        }
        return new OllamaChat(options);
    }
    static create(options = { systemPrompt: null, model: AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        return new ChatHelper(ChatHelper.getClient(options));
    }
    static ChatGPT(options = { systemPrompt: null, model: AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        return new ChatHelper(new OpenAIChat(options));
    }
    static Claude(options = { systemPrompt: null, model: AIModel.claude_default, max_tokens: 4096, json: false, tools: null }) {
        return new ChatHelper(new ClaudeChat(options));
    }
    static Gemini(options = { systemPrompt: null, model: AIModel.gemini_default, max_tokens: 2000000, json: false, tools: null }) {
        return new ChatHelper(new GeminiChat(options));
    }
    static Ollama(options = { systemPrompt: null, model: AIModel.ollama_default, max_tokens: 2000000, json: false, tools: null }) {
        return new ChatHelper(new OllamaChat(options));
    }
    static Miibo(options = { systemPrompt: null, model: AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        return new ChatHelper(new MiiboChat(options));
    }
    constructor(options = { systemPrompt: null, model: AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
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
function isChatHelper(obj) {
    return 'send' in obj && 'vision' in obj && 'clearHistory' in obj;
}
