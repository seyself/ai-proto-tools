import ToolsHelper from './ToolsHelper.js';

export interface IChatHelper {

  readonly useModel: string;

  /** チャット履歴をクリアします */
  clearHistory(): void;

  /** ユーザーメッセージを履歴に追加します */
  addUserMessage(content: string): void;

  /** アシスタントメッセージを履歴に追加します */
  addAssistantMessage(content: string): void;

  /**
   * ユーザーのプロンプトを送信し、AI からの応答を取得します。
   * このメソッドは会話履歴を保持し、文脈を考慮した応答を返します。
   * 
   * @param userPrompt - ユーザーのプロンプト
   * @param options - 送信オプション
   * @returns AI からの応答
   */
  send(userPrompt: string, options?: ChatHelperOptions): Promise<string | object | null>;

  /**
   * 画像を含むテキストを送信し、AI による画像解析結果を取得します。
   * このメソッドは GPT-4 Vision API を使用して画像の分析と理解を行います。
   * 
   * @param text - 画像に関連するテキスト（質問や指示など）
   * @param files - 解析する画像ファイルの配列
   * @returns AI による画像解析結果
   */
  vision(text: string, files: string[], options?: ChatHelperOptions): Promise<string | null>;
}

/** チャットヘルパーの初期化オプション */
export interface ChatHelperOptions {
  systemPrompt?: string | null;
  model?: string | null;
  apiVersion?: string | null;
  max_tokens?: number;
  json?: boolean;
  tools?: ToolsHelper | null;
  outputLogs?: boolean;
}

/**
 * vision メソッドで使用する画像ファイルの形式
 */
export interface VisionFile {
  dataURL: string;
}
