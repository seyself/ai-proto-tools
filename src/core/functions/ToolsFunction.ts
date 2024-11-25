/**
 * 関数呼び出し時の引数インターフェース
 */
export interface CallFunctionArgs {
  /** スレッドID */
  thread_id?: string;
  /** 実行ID */
  run_id?: string;
  /** 呼び出しID */
  call_id: string;
  /** 関数に渡される引数 */
  args: any;
  /** 進捗状況を通知するコールバック関数 */
  onProgress?: (message: string) => void;
  /** キャンセル時のコールバック関数 */
  onCanceled?: (message: string) => void;
}

/**
 * 関数呼び出し結果のインターフェース
 */
export interface CallFunctionResult {
  /** スレッドID */
  thread_id?: string;
  /** 実行ID */
  run_id?: string;
  /** 呼び出しID */
  call_id: string;
  /** 関数に渡された引数 */
  args: any;
  /** 実行結果のテキスト */
  result: string;
  success?: boolean;
  canceled?: boolean;
  hasError?: boolean;
  /** 関連リンク情報 */
  link?: { title: string; link: string }[] | string | null;
}

/**
 * ツール定義オブジェクトのインターフェース
 */
export interface DefineToolObject {
  /** ツールのタイプ */
  type: string;
  /** 関数の定義情報 */
  function: DefineToolObjectFunction;
}

/**
 * ツール定義オブジェクトの関数定義インターフェース
 */
export interface DefineToolObjectFunction {
  /** オブジェクトのタイプ ('function') */
  type?: string;
  /** 関数の説明 */
  description: string;
  /** 関数名 */
  name: string;
  /** パラメータ定義 */
  parameters: DefineToolObjectInput;
}

/**
 * ツール定義オブジェクトのパラメータ定義インターフェース
 */
export interface DefineToolObjectInput {
  /** パラメータのタイプ */
  type: string;
  /** プロパティ定義 */
  properties: Record<string, any>;
  /** 必須パラメータのリスト */
  required: string[];
}

/**
 * ツール関数の基底クラス
 * 各ツールはこのクラスを継承して実装する
 */
export default abstract class ToolsFunction {
  functionName: string;
  description: string;
  properties: Record<string, any>;
  required: string[];
  strict: boolean;

  constructor(functionName: string) {
    this.functionName = functionName;
    this.description = '';
    this.properties = {};
    this.required = [];
    this.strict = false;
  }

  /**
   * ツール定義オブジェクトを取得する
   * @returns {DefineToolObject} ツール定義オブジェクト
   */
  getDefineToolObject = (): DefineToolObject => {
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
   * ツール定義オブジェクトを取得する
   * @returns {DefineToolObjectFunction} ツール定義オブジェクト
   */
  getDefineToolFunction = (): DefineToolObjectFunction => {
    return {
      type: 'function',
      description: this.description,
      name: this.functionName,
      parameters: {
        type: 'object',
        properties: this.properties || {},
        required: this.required || [],
      },
      // strict: this.strict,
    };
  };

  /**
   * 関数名と引数が一致するかチェックする
   * @param funcName - チェックする関数名
   * @param args - チェックする引数
   * @returns {boolean} 一致する場合はtrue
   */
  match = (funcName: string, args: any): boolean => {
    if (funcName !== this.functionName) return false;
    
    // 必須パラメータが全て存在するかチェック
    return this.required.every(param => args.hasOwnProperty(param));
  };

  /**
   * 関数を実行する
   * @param args - 関数呼び出し時の引数
   * @returns {Promise<CallFunctionResult>} 実行結果
   */
  abstract callFunction(args: CallFunctionArgs): Promise<CallFunctionResult>;
}
