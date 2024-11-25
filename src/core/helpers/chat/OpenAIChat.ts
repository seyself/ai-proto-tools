import * as dotenv from 'dotenv';
import { setTimeout as _setTimeout } from 'timers/promises';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import ToolsHelper from '../ToolsHelper.js';
import { type IChatHelper, type ChatHelperOptions, type VisionFile } from '../IChatHelper.js';
import { readFileToBase64 } from '../../utils/readFileToBase64.js';
import { AIModel } from '../AIModel.js';

dotenv.config();

const openai = new OpenAI();

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
export default class OpenAIChat implements IChatHelper {

  private systemPrompt: string | null | undefined;
  readonly useModel: string;
  private maxTokens: number;
  private tools: ToolsHelper | null;
  private json: boolean;
  private history: ChatCompletionMessageParam[] = [];
  private outputLogs: boolean;
  private options: ChatHelperOptions;
  /**
   * ChatHelper のインスタンスを作成します。
   * @param {ChatHelperOptions} options - 設定オプション
   * @param {string} [options.systemPrompt] - システムプロンプト
   * @param {string} [options.model='gpt-4o'] - 使用する AI モデル
   * @param {number} [options.max_tokens=4096] - 最大トークン数
   */
  constructor(options:ChatHelperOptions = { systemPrompt: null, model: AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
    const { systemPrompt, model, max_tokens, json, tools } = options;
    
    this.systemPrompt = systemPrompt;
    this.useModel = model || AIModel.gpt_default;
    this.maxTokens = max_tokens || 4096;
    this.tools = tools || null;
    this.json = json || false;
    this.outputLogs = options?.outputLogs || false;

    this.options = options;

    this.clearHistory();
  }

  public clearHistory()
  {
    this.history = [];
    if (this.systemPrompt) {
      this.history.push({ role: "system", content: this.systemPrompt });
    }
  }

  public addUserMessage = (content: string) => {
    this.history.push({ role: 'user', content });
  }

  public addAssistantMessage = (content: string) => {
    this.history.push({ role: 'assistant', content });
  }

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
  public send = async (userPrompt: string, options: ChatHelperOptions = { json: false, model: null, tools: null }): Promise<string | object | null> => {
    if (!userPrompt) return null;

    const { systemPrompt, model, max_tokens, json, tools } = options;

    this.history.push({ role: "user", content: userPrompt });

    const data: OpenAI.Chat.ChatCompletionCreateParams = {
      model: model || this.useModel,
      messages: this.history
    };

    if (this.options) {
      if (this.options.seed !== undefined) data.seed = this.options.seed;
      if (this.options.top_p !== undefined) data.top_p = this.options.top_p;
      if (this.options.frequency_penalty !== undefined) data.frequency_penalty = this.options.frequency_penalty;
      if (this.options.presence_penalty !== undefined) data.presence_penalty = this.options.presence_penalty;
      if (this.options.modalities !== undefined) data.modalities = this.options.modalities as OpenAI.Chat.ChatCompletionModality[];
    }
    if (options) {
      if (options.seed !== undefined) data.seed = options.seed;
      if (options.top_p !== undefined) data.top_p = options.top_p;
      if (options.frequency_penalty !== undefined) data.frequency_penalty = options.frequency_penalty;
      if (options.presence_penalty !== undefined) data.presence_penalty = options.presence_penalty;
      if (options.modalities !== undefined) data.modalities = options.modalities as OpenAI.Chat.ChatCompletionModality[];
    }

    if (json) {
      data.response_format = { type: 'json_object' };
    }

    if (tools) {
      data.tools = tools.getDefineToolObjects() as OpenAI.Chat.ChatCompletionTool[];
    }

    try {
      const response = await openai.chat.completions.create(data);
      if (this.outputLogs || options?.outputLogs) console.log('API >> response >>>', response);
      if ('choices' in response && response.choices.length > 0) {
        const content = response.choices[0]?.message?.content;
        if (content) {
          if (json) {
            try {
              const responseJson = JSON.parse(content);
              this.history.push({ role: "assistant", content });
              return responseJson;
            } catch (e) {
              console.error('JSON Parse Error >>> \n' + (e as Error).toString());
            }
          } else {
            this.history.push({ role: "assistant", content });
            return content;
          }
        }
      }
      return null;
    } catch (error) {
      console.log('Error fetching data:', (error as Error).message);
    }
    return null;
  }

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
  public vision = async (text: string, files: string[], options?: ChatHelperOptions): Promise<string | null> => {
    const { model } = options || {};
    const reqContent: Array<OpenAI.Chat.ChatCompletionContentPart> = [
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
        } else {
          const fileInfo = await readFileToBase64(filePath);
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
      const data: OpenAI.Chat.ChatCompletionCreateParams = {
        model: model || this.useModel || AIModel.gpt_default,
        max_tokens: this.maxTokens,
        messages: this.history,
      };

      if (this.options) {
        if (this.options.seed !== undefined) data.seed = this.options.seed;
        if (this.options.top_p !== undefined) data.top_p = this.options.top_p;
        if (this.options.frequency_penalty !== undefined) data.frequency_penalty = this.options.frequency_penalty;
        if (this.options.presence_penalty !== undefined) data.presence_penalty = this.options.presence_penalty;
        if (this.options.modalities !== undefined) data.modalities = this.options.modalities as OpenAI.Chat.ChatCompletionModality[];
      }
      if (options) {
        if (options.seed !== undefined) data.seed = options.seed;
        if (options.top_p !== undefined) data.top_p = options.top_p;
        if (options.frequency_penalty !== undefined) data.frequency_penalty = options.frequency_penalty;
        if (options.presence_penalty !== undefined) data.presence_penalty = options.presence_penalty;
        if (options.modalities !== undefined) data.modalities = options.modalities as OpenAI.Chat.ChatCompletionModality[];
      }
      const visionResponse = await openai.chat.completions.create(data);

      const content = visionResponse.choices[0]?.message?.content;
      this.history.push({ role: "assistant", content });

      return content;
    } catch (error) {
      console.log('Error in vision processing:', (error as Error).message);
      return null;
    }
  }
}
