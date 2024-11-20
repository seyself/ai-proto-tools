import ToolsFunction, { type CallFunctionArgs, type DefineToolObject } from '../functions/ToolsFunction.js';

/** AI Tools用の機能を管理・実行するためのヘルパークラス */
export class ToolsHelper {
  /** 登録された機能のリスト */
  functions: ToolsFunction[];
  /** ファイル検索機能の有効フラグ */
  fileSearch: boolean;
  /** コードインタープリター機能の有効フラグ */
  codeInterpreter: boolean;

  /**
   * ToolsHelperのコンストラクタ
   * @param fileSearch - ファイル検索機能を有効にするかどうか
   * @param codeInterpreter - コードインタープリター機能を有効にするかどうか
   * @param functionList - 初期化時に登録する機能のリスト
   */
  constructor(fileSearch = false, codeInterpreter = false, functionList: ToolsFunction[] = []) {
    this.functions = functionList;
    this.fileSearch = fileSearch;
    this.codeInterpreter = codeInterpreter;
  }

  /**
   * 新しい機能を追加する
   * @param funcInstance - 追加する機能のインスタンス
   */
  addFunction = (funcInstance: ToolsFunction): void => {
    this.functions.push(funcInstance);
  }

  /**
   * 登録された機能を削除する
   * @param funcInstance - 削除する機能のインスタンス
   */
  removeFunction = (funcInstance: ToolsFunction): void => {
    this.functions = this.functions.filter(func => func !== funcInstance);
  }

  /**
   * 指定された名前の機能を実行する
   * @param functionName - 実行する機能の名前
   * @param params - 実行時のパラメータ
   * @returns 機能の実行結果
   */
  callFunction = async (functionName: string, { thread_id, run_id, call_id, args, onProgress, onCanceled }: CallFunctionArgs): Promise<any> => {
    try {
      for (const func of this.functions) {
        if (func.match(functionName, args)) {
          return await func.callFunction({ thread_id, run_id, call_id, args, onProgress, onCanceled });
        }
      }
    } catch (e) {
      console.error(e);
    }

    // キャンセル時の処理
    try {
      return onCanceled('');
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * 登録された全機能の定義オブジェクトを取得する
   * @returns 機能定義オブジェクトの配列
   */
  getDefineToolObjects = (): Array<{ type: string } | { function: DefineToolObject }> => {
    const list: Array<{ type: string } | { function: DefineToolObject }> = [];
    
    if (this.fileSearch) list.push({ type: 'file_search' });
    if (this.codeInterpreter) list.push({ type: 'code_interpreter' });

    for (const func of this.functions) {
      list.push(func.getDefineToolObject());
    }
    return list;
  }

  /**
   * トークヘルパーに登録された機能を適用する
   * @param talkHelper - 機能を適用するトークヘルパーインスタンス
   */
  applyTalkTools = (talkHelper: any): void => {
    for (const func of this.functions) {
      this.applyFunction(talkHelper, func);
    }
  }

  /**
   * 個別の機能をトークヘルパーに適用する
   * @param talkHelper - 機能を適用するトークヘルパーインスタンス
   * @param func - 適用する機能のインスタンス
   * @private
   */
  private applyFunction = (talkHelper: any, func: ToolsFunction): void => {
    const defineTool = func.getDefineToolObject().function;
    const callback = func.callFunction;
    talkHelper.addTool(defineTool, async (...args: any[]) => {
      console.log('addTool Call >>', defineTool.name);
      const result = await callback({
        thread_id: '', // 適切な値を設定
        run_id: '',    // 適切な値を設定
        call_id: '',   // 適切な値を設定
        args,
        onProgress: (message: string) => {},
        onCanceled: (message: string) => {}
      });
      console.log('result >>>', result);
      return result?.text || 'データが見つかりません。';
    });
  }
}

export default ToolsHelper;
