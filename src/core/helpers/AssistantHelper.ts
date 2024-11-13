import * as dotenv from 'dotenv';
import { setTimeout as _setTimeout } from 'timers/promises';
import OpenAI from 'openai';
import * as fs from 'fs';
import ToolsHelper from './ToolsHelper.js';

dotenv.config();

const openai = new OpenAI();

const DEFAULT_MODEL = 'gpt-4o';
const keepAssistantRunId = './data/keep_asst_run_id.txt';

/**
 * アシスタントの作成オプションを定義するインターフェース
 * @interface AssistantOptions
 */
interface AssistantOptions {
  /** 使用するモデル名 */
  model: string;
  /** アシスタントの名前 */
  name: string;
  /** アシスタントの指示内容 */
  instructions: string;
  /** 使用するツールの配列 */
  tools: any[];
}

/**
 * アシスタント実行のパラメータを定義するインターフェース
 * @interface RunParams
 */
interface RunParams {
  /** アシスタントのID */
  assistant_id: string;
  /** スレッドのID */
  thread_id: string;
  /** オプションの指示内容 */
  instructions?: string;
  /** 進捗コールバック関数 */
  callback?: (message: any) => Promise<void>;
}

interface ToolCall {
  id: string;
  type: string;
  [key: string]: any;
}

interface RunRetrieve {
  status: string;
  required_action?: {
    type: string;
    [key: string]: any;
  } | null;
}

interface MessageContent {
  type: string;
  text: {
    value: string;
    annotations: any[];
  };
}

interface Message extends OpenAI.Beta.Threads.Message {
  // 追加のプロパティがある場合はここに定義
}

interface FileUploadResult {
  id: string;
  filename: string;
  purpose: string;
  bytes: number;
  created_at: number;
  status: string;
  status_details?: any; // オプショナルに変更
}

type ContentItem = 
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

// OpenAIの型定義に合わせて修正
type AssistantTool = OpenAI.Beta.Assistants.AssistantTool | { file_ids: string[] };

// interface CodeInterpreterTool extends AssistantTool {
//   type: "code_interpreter";
// }

// interface FileSearchTool extends AssistantTool {
//   type: "retrieval"; // OpenAIの最新の型定義では "retrieval" になっています
// }

/**
 * OpenAI Assistant APIを操作するためのヘルパークラス
 * アシスタントの作成、実行、メッセージの送信、ファイルの操作などの機能を提供する
 */
export default class AssistantHelper {
  private onReady: () => void;
  private _assistant_id: string | null;
  private tools: ToolsHelper;
  private model?: string;
  private description?: string | null;
  private instructions?: string | null;
  private top_p?: number | null;
  private temperature?: number | null;
  private response_format?: OpenAI.Beta.Assistants.AssistantUpdateParams['response_format'] | null;
  private _referenceText?: string;
  private _tool_outputs?: any[];
  private _tool_outputs_count?: number;
  private referenceLinks?: { title: string; link: string }[];
  private supplementaryInfo?: any;

  /**
   * AssistantHelper のコンストラクタ
   * @param {string} assistant_id - アシスタントの ID
   */
  constructor(assistant_id: string) {
    this.onReady = () => {};
    this._assistant_id = null;
    this.tools = new ToolsHelper();
    this.setAssistantId(assistant_id);
  }

  /**
   * アシスタント ID を設定し、アシスタントの情報を取得する
   * @param {string} assistant_id - 設定するアシスタント ID
   * @returns {Promise<void>}
   */
  setAssistantId = async (assistant_id: string): Promise<void> => {
    this._assistant_id = assistant_id;

    const assistant = await openai.beta.assistants.retrieve(assistant_id);
    if (!assistant) return;

    this.model = assistant.model;
    this.description = assistant.description;
    this.instructions = assistant.instructions;
    this.top_p = assistant.top_p;
    this.temperature = assistant.temperature;
    this.response_format = assistant.response_format;

    assistant?.tools?.forEach(tool => {
      if (tool.type == 'file_search') this.tools.fileSearch = true;
      if (tool.type == 'code_interpreter') this.tools.codeInterpreter = true;
    });
    
    if (this.onReady) this.onReady();
  }

  /**
   * 新しいアシスタントを作成する
   * @param {string} name - アシスタントの名前
   * @param {string} instructions - アシスタントの指示
   * @param {string} [model] - 使用するモデル（オプション）
   * @returns {Promise<OpenAI.Beta.Assistants.Assistant>}
   */
  createNewAssistant = async (name: string, instructions: string, model?: string): Promise<OpenAI.Beta.Assistants.Assistant> => {
    const useModel = model || DEFAULT_MODEL;

    const options: AssistantOptions = {
      model: useModel,
      name: name,
      instructions: instructions,
      tools: this.tools.getDefineToolObjects(),
    };
    const emptyNewAssistant = await openai.beta.assistants.create(options);
    return emptyNewAssistant;
  }

  /**
   * スレッドを取得する
   * @param {string} thread_id - スレッド ID
   * @returns {Promise<OpenAI.Beta.Threads.Thread | null>}
   */
  retrieveThread = async (thread_id: string): Promise<OpenAI.Beta.Threads.Thread | null> => {
    if (!thread_id) return null;
    
    try {
      const thread = await openai.beta.threads.retrieve(thread_id);
      return thread;
    } catch(error) {
      console.error(error);
    }
    return null;
  }

  /**
   * 現在のアシスタントの実行をキャンセルする
   * @returns {Promise<void>}
   */
  cancelCurrentAssistant = async (): Promise<void> => {
    try {
      if (fs.existsSync(keepAssistantRunId)) {
        const text = fs.readFileSync(keepAssistantRunId, 'utf8');
        if (!text) return;

        const [thread_id, run_id] = text.split(':');
        await openai.beta.threads.runs.cancel(thread_id, run_id);
        fs.writeFileSync(keepAssistantRunId, '', 'utf8');
      }
    } catch(e) {
      console.error(e);
    }
  }

  cancelAssistant = async (thread_id: string, run_id: string): Promise<void> => {
    try {
      await openai.beta.threads.runs.cancel(thread_id, run_id);
      fs.writeFileSync(keepAssistantRunId, '', 'utf8');
    } catch(e) {
      console.error(e);
    }
  }

  createNewThread = async (): Promise<OpenAI.Beta.Threads.Thread> => {
    const emptyThread = await openai.beta.threads.create();
    return emptyThread;
  }

  addMessage = async (thread_id: string, content: string, fileList: { id: string }[] | null = null): Promise<OpenAI.Beta.Threads.Message | null> => {
    try {
      const requestParams: any = {
        role: "user",
        content: content,
      };
      if (fileList && fileList.length > 0) {
        const file_ids = fileList.map(x => x.id);
        console.log('file_ids >>>', file_ids);
        requestParams.file_ids = file_ids;
      }

      const create_message = await openai.beta.threads.messages.create(thread_id, requestParams);
      await _setTimeout(300);
      return create_message;
    } catch(e) {
      console.error('addUserMessage Error >>>\n' + (e instanceof Error ? e.message : String(e)));
    }
    return null;
  }

  /**
   * アシスタントを実行する
   * @param {RunParams} params - 実行パラメータ
   * @returns {Promise<{ status: string; text: string | null; files: any[] | null } | null>} 実行結果
   * @throws {Error} アシスタントの実行に失敗した場合
   */
  runAssistant = async ({ assistant_id, thread_id, instructions, callback }: RunParams): Promise<{ status: string; text: string | null; files: any[] | null } | null> => {
    this.supplementaryInfo = null;
    const params = this.prepareParams(assistant_id || this._assistant_id!, instructions);

    console.log('runAssistantFunction / runs.create');
    const run = await this.createRunWithRetries(thread_id, params);
    if (!run) throw new Error('Assistantの実行に失敗しました');

    const run_id = run.id;
    this._referenceText = '';

    fs.writeFileSync(keepAssistantRunId, `${thread_id}:${run_id}`, 'utf8');

    if (!callback) {
      callback = async (message) => { console.log(message); };
    }

    const result = await this.monitorRunStatus(thread_id, run_id, callback);
    return result;
  };

  private prepareParams = (assistant_id: string, override_instructions?: string): any => {
    const params: any = {
      assistant_id: assistant_id,
      tools: this.tools.getDefineToolObjects(),
    };
    if (override_instructions) {
      params.instructions = override_instructions;
    }
    return params;
  };

  private createRunWithRetries = async (thread_id: string, params: any): Promise<OpenAI.Beta.Threads.Runs.Run | null> => {
    let run = null;
    let tryCount = 0;
    while (!run && tryCount < 3) {
      tryCount++;
      try {
        run = await openai.beta.threads.runs.create(thread_id, params);
      } catch (e) {
        console.error(e);
        run = null;
        await _setTimeout(5000);
      }
    }
    return run;
  };

  private monitorRunStatus = async (thread_id: string, run_id: string, progress_callback: (message: any) => Promise<void>): Promise<{ status: string; text: string | null; files: any[] | null }> => {
    let status = 'queued';
    let isSearch = false;
    let waitCount = 0;

    while (status !== 'completed') {
      waitCount++;
      console.log('await waitCount >>>', waitCount);
      await _setTimeout(500);
      const runRetrieve = await this.retrieveRunStatus(thread_id, run_id);
      if (!runRetrieve) continue;

      status = runRetrieve.status;
      if (status === 'cancelled') {
        await this.handleCancelled(progress_callback);
        break;
      }
      if (status === 'failed') {
        await this.handleFailed(progress_callback);
        break;
      }
      if (status === 'requires_action' && !isSearch) {
        await this.handleActionRequired(runRetrieve, progress_callback, thread_id, run_id);
        isSearch = true;
      }
    }

    return await this.retrieveResult(thread_id, run_id);
  };

  private retrieveRunStatus = async (thread_id: string, run_id: string): Promise<RunRetrieve | null> => {
    try {
      console.log(`runs.retrieve >>> thread_id=${thread_id}, run_id=${run_id}`);
      return await openai.beta.threads.runs.retrieve(thread_id, run_id);
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  private handleCancelled = async (progress_callback: (message: any) => Promise<void>): Promise<void> => {
    try {
      await progress_callback({ 
        status:'cancelled', 
        text:':cry: 回答の生成をキャンセルしました',
      });
    } catch (e) {
      console.log(e);
    }
  };

  private handleFailed = async (progress_callback: (message: any) => Promise<void>): Promise<void> => {
    try {
      await progress_callback({
        status: 'failed',
        text: ':cry: 回答の生成に失敗しました',
      });
    } catch (e) {
      console.log(e);
    }
  };

  private handleActionRequired = async (runRetrieve: RunRetrieve, progress_callback: (message: any) => Promise<void>, thread_id: string, run_id: string): Promise<void> => {
    try {
      await progress_callback({
        status: 'progress',
        text: ':thinking_face: べるのでもう少しお待ち下さい...'
      });
    } catch (e) {
      console.log(e);
    }

    try {
      const tool_calls = runRetrieve.required_action![runRetrieve.required_action!.type].tool_calls;

      this._tool_outputs = [];
      this._tool_outputs_count = tool_calls.length;
      console.log('tool_calls count >>>', tool_calls.length);

      for (const tool_call of tool_calls) {
        await this.processToolCall(tool_call, thread_id, run_id, progress_callback);
      }
    } catch(e) {
      console.error(e);
      await this.cancelAssistant(thread_id, run_id);
    }
  };

  private processToolCall = async (tool_call: ToolCall, thread_id: string, run_id: string, progress_callback: (message: any) => Promise<void>): Promise<void> => {
    const tool_type = tool_call.type;
    const tool = tool_call[tool_type];

    console.log('tool_call >>>', tool_call);
    console.log('tool_type >>>', tool_type);

    if (tool_type === 'function') {
      await this.callFunctionTool(tool, thread_id, run_id, tool_call.id, progress_callback);
    }
  };

  private callFunctionTool = async (tool: any, thread_id: string, run_id: string, call_id: string, progress_callback: (message: any) => Promise<void>): Promise<void> => {
    let args = {};
    try {
      args = JSON.parse(tool.arguments);
    } catch (e) {
      console.log('tool.arguments のJSONパースエラー');
      console.error(e);
    }

    console.log('Call Function >>>', tool.name);
    console.log('args >>>', JSON.stringify(args, null, '  '));

    const result = await this.tools.callFunction(tool.name, {
      thread_id, run_id, call_id, 
      args: args,
      onProgress: progress_callback || (async () => {}),
      onCanceled: async (message) => await this.cancelAssistant(thread_id, run_id),
    });
    this.referenceLinks = result?.link || null;
    this.setToolOutput(thread_id, run_id, call_id, result?.text);
  };

  private setToolOutput = async (thread_id: string, run_id: string, call_id: string, content: string | undefined): Promise<void> => {
    const NoData = '該当する情報が見つかりませんでした。';

    const output = {
      tool_call_id: call_id,
      output: content || NoData,
    };

    if (!this._tool_outputs) this._tool_outputs = [];
    this._tool_outputs.push(output);

    if (this._tool_outputs.length < (this._tool_outputs_count || 0)) {
      return;
    }

    try {
      await openai.beta.threads.runs.submitToolOutputs(
        thread_id,
        run_id,
        {
          tool_outputs: this._tool_outputs,
        }
      );
    } catch(e) {
      console.error(e);
      await this.cancelAssistant(thread_id, run_id);
    }
  }

  private retrieveResult = async (thread_id: string, run_id: string): Promise<{ status: string; text: string | null; files: any[] | null }> => {
    let result = null;
    while (!result) {
      try {
        result = await openai.beta.threads.messages.list(thread_id);
        if (result) break;
      } catch (e) {
        console.error(e);
      }
      await _setTimeout(500);
    }

    // 修正: result.body.data の代わりに result.data を使用
    const results = result.data;

    return this.processResults(results, run_id);
  };

  private processResults = async (results: Message[], run_id: string): Promise<{ status: string; text: string | null; files: any[] | null }> => {
    for (const data of results) {
      if (data.run_id === run_id) {
        if (data.content && data.content[0]) {
          const content = data.content[0];
          if ('text' in content && content.text.value) {
            const contentText = content.text.value;
            const refs = this.referenceLinks?.map(item => `- <${item.link}|${item.title}>`).join('\n');
            const responseText = refs ? `${contentText}\n\n*参考リンク*: \n${refs}` : contentText;
            const annotationFiles = await this.saveAnnotationFiles(content.text.annotations);
            return { status: 'completed', text: responseText, files: annotationFiles };
          }
        }
        return { status: 'completed', text: null, files: null };
      }
    }
    return { status: 'completed', text: null, files: null };
  };

  private saveAnnotationFiles = async (annotations: any[]): Promise<any[] | null> => {
    if (!annotations) return null;
    if (annotations.length == 0) return null;

    const result = [];
    const numAnnotations = annotations.length;
    for(let i=0; i<numAnnotations; i++) {
      try {
        const item = annotations[i];
        console.log(item);
        const fileName = item.text.split('/').pop();
        const filePath = `./data/files/${fileName}`;
        const fileId = (item.file_citation || item.file_path).file_id;
        const response = await openai.files.content(fileId);
        const image_data = await response.arrayBuffer();
        const image_data_buffer = Buffer.from(image_data);
        fs.writeFileSync(filePath, image_data_buffer);
        result.push({ id:fileId, filename:fileName, file:filePath });
      } catch(e) {
        console.error(e);
      }
    }
    return result;
  }

  uploadFiles = async (fileList: { id: string; filePath?: string }[] | null, afterRemoveFile: boolean = false): Promise<any[] | null> => {
    if (!fileList) return null;
    let numFiles = fileList.length;
    let results = [];
    for(let i=0; i<numFiles; i++) {
      try {
        const file = fileList[i];
        if (file && file.filePath) {
          const fileData = await this.uploadFile(file.filePath, afterRemoveFile);
          console.log('fileData >>>', fileData);
          results.push(fileData);
        }
      } catch(e) {
        console.error(e);
      }
    }
    if (results.length == 0) return null;
    return results;
  }

  /**
   * ファイルをアップロードする
   * @param {string} filePath - アップロードするファイルのパス
   * @param {boolean} [afterRemoveFile=false] - アップロード後にファイルを削除するかどうか
   * @returns {Promise<FileUploadResult>}
   */
  uploadFile = async (filePath: string, afterRemoveFile: boolean = false): Promise<FileUploadResult> => {
    console.log('filePath >>>', filePath);
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "assistants",
    });
    let inProgress = true;
    const fileID = file.id;
    while(inProgress) {
      await _setTimeout(1000);
      const uploadInfo = await openai.files.retrieve(fileID);
      console.log(uploadInfo.status);
      inProgress = uploadInfo.status != 'processed';
    }
    console.log('fileUpload >>>', file);

    if (afterRemoveFile) {
      fs.unlinkSync(filePath);
    }

    return file;
  }

  /**
   * ファイルをアップロードしてアシスタントに追加する
   * @param {string} assistant_id - アシスタントのID
   * @param {Array<{ id: string; mimeType: string }>} fileList - アップロードするファイルのリスト
   * @returns {Promise<void>}
   */
  addFilesToAssistant = async (assistant_id: string, fileList: { id: string; mimeType: string }[]): Promise<void> => {
    const acceptFileTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/html',
      'application/json',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/x-tex',
      'text/plain',
    ];
    
    // 既存のアシスタントの情報を取得
    const assistant = await openai.beta.assistants.retrieve(assistant_id);
    
    // 新しいファイルIDのリストを作成
    const newFileIds = fileList
      .filter(file => acceptFileTypes.includes(file.mimeType))
      .map(file => file.id);
    
    // 既存のファイルIDを取得
    const existingFileIds = assistant.tools
      .filter((tool): tool is any /*AssistantTool*/ => 
        tool.type === "code_interpreter" || tool.type === "file_search")
      .flatMap(tool => {
        // TODO: 実際の出力を確認する
        if (tool.type === "code_interpreter") {
          return tool.code_interpreter?.file_ids || [];
        } else {
          return tool.file_search?.file_ids || [];
        }
      });
    
    // 既存のファイルIDと新しいファイルIDを結合
    const updatedFileIds = [...existingFileIds, ...newFileIds];
    
    // アシスタントを更新
    await openai.beta.assistants.update(
      assistant_id,
      {
        tools: [
          { type: "code_interpreter" },
          { type: "file_search" }
        ],
        tool_resources: {
          code_interpreter: { file_ids: updatedFileIds },
          file_search: { vector_store_ids: updatedFileIds }
        }
      }
    );
  }

  /**
   * Vision APIを使用して画像解析を実行する
   * @param {string} text - 画像に関連する質問やプロンプト
   * @param {Array<{ dataURL: string }>} files - 解析する画像ファイルのリスト
   * @returns {Promise<string | null>} 解析結果のテキスト
   */
  vision = async (text: string, files: { dataURL: string }[]): Promise<string | null> => {
    const reqContent: ContentItem[] = [
      { 
        type: 'text',
        text: text 
      },
    ];

    let numFiles = files.length;
    for(let i=0; i<numFiles; i++) {
      const file = files[i];
      if (file && file.dataURL) {
        reqContent.push({
          type: 'image_url',
          image_url: {
            url: file.dataURL,
          },
        });
      }
    }

    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: reqContent,
        },
      ],
    });
    console.log('visionResponse >>');
    console.log(visionResponse);
    console.log(visionResponse.choices[0]);

    return visionResponse.choices[0].message.content || null;
  }
}

/**
 * 指定された時間内にPromiseが解決されない場合にタイムアウトさせる
 * @param {number} timeout - タイムアウトまでのミリ秒
 * @param {Promise<any>} promise - 実行するPromise
 * @returns {Promise<any>}
 */
async function withTimeout(timeout: number, promise: Promise<any>): Promise<any> {
  const errorMessage = `await での待機 ${timeout}ms を超えました`;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(errorMessage), timeout),
  );
  return Promise.race([
    promise, // 本来実行したい promise 数
    timeoutPromise, // こちらの方早く解決すると reject()
  ]);
}
