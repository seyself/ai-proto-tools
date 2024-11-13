import { type IChatHelper, type ChatHelperOptions } from './IChatHelper.js';
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
export default class ChatHelper implements IChatHelper {
    private chat;
    static Create(options?: ChatHelperOptions): ChatHelper;
    static ChatGPT(options?: ChatHelperOptions): ChatHelper;
    static Claude(options?: ChatHelperOptions): ChatHelper;
    static Gemini(options?: ChatHelperOptions): ChatHelper;
    static Ollama(options?: ChatHelperOptions): ChatHelper;
    static Miibo(options?: ChatHelperOptions): ChatHelper;
    constructor(options?: ChatHelperOptions | IChatHelper);
    clearHistory(): void;
    addUserMessage: (content: string) => void;
    addAssistantMessage: (content: string) => void;
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
    send: (userPrompt: string, options?: ChatHelperOptions) => Promise<string | object | null>;
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
    vision: (text: string, files: string[], options?: ChatHelperOptions) => Promise<string | null>;
}
//# sourceMappingURL=ChatHelper.d.ts.map