import { type IChatHelper, type ChatHelperOptions } from '../IChatHelper.js';
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
export default class MiiboChat implements IChatHelper {
    private systemPrompt;
    readonly useModel: string;
    private maxTokens;
    private tools;
    private json;
    private history;
    private uid;
    private outputLogs;
    /**
     * ChatHelper のインスタンスを作成します。
     * @param {ChatHelperOptions} options - 設定オプション
     * @param {string} [options.systemPrompt] - システムプロンプト
     * @param {string} [options.model='gpt-4o'] - 使用する AI モデル
     * @param {number} [options.max_tokens=4096] - 最大トークン数
     */
    constructor(options?: ChatHelperOptions);
    clearHistory(): void;
    addUserMessage: (content: string) => void;
    addAssistantMessage: (content: string) => void;
    send: (userPrompt: string, options?: ChatHelperOptions) => Promise<string | object | null>;
    vision: (text: string, files: string[], options?: ChatHelperOptions) => Promise<string | null>;
}
//# sourceMappingURL=MiiboChat.d.ts.map