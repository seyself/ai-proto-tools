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
const promises_1 = require("timers/promises");
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const ToolsHelper_js_1 = __importDefault(require("./ToolsHelper.js"));
dotenv.config();
const openai = new openai_1.default();
const DEFAULT_MODEL = 'gpt-4o';
const keepAssistantRunId = './data/keep_asst_run_id.txt';
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
class AssistantHelper {
    /**
     * AssistantHelper のコンストラクタ
     * @param {string} assistant_id - アシスタントの ID
     */
    constructor(assistant_id) {
        /**
         * アシスタント ID を設定し、アシスタントの情報を取得する
         * @param {string} assistant_id - 設定するアシスタント ID
         * @returns {Promise<void>}
         */
        this.setAssistantId = async (assistant_id) => {
            this._assistant_id = assistant_id;
            const assistant = await openai.beta.assistants.retrieve(assistant_id);
            if (!assistant)
                return;
            this.model = assistant.model;
            this.description = assistant.description;
            this.instructions = assistant.instructions;
            this.top_p = assistant.top_p;
            this.temperature = assistant.temperature;
            this.response_format = assistant.response_format;
            assistant?.tools?.forEach(tool => {
                if (tool.type == 'file_search')
                    this.tools.fileSearch = true;
                if (tool.type == 'code_interpreter')
                    this.tools.codeInterpreter = true;
            });
            if (this.onReady)
                this.onReady();
        };
        /**
         * 新しいアシスタントを作成する
         * @param {string} name - アシスタントの名前
         * @param {string} instructions - アシスタントの指示
         * @param {string} [model] - 使用するモデル（オプション）
         * @returns {Promise<OpenAI.Beta.Assistants.Assistant>}
         */
        this.createNewAssistant = async (name, instructions, model) => {
            const useModel = model || DEFAULT_MODEL;
            const options = {
                model: useModel,
                name: name,
                instructions: instructions,
                tools: this.tools.getDefineToolObjects(),
            };
            const emptyNewAssistant = await openai.beta.assistants.create(options);
            return emptyNewAssistant;
        };
        /**
         * スレッドを取得する
         * @param {string} thread_id - スレッド ID
         * @returns {Promise<OpenAI.Beta.Threads.Thread | null>}
         */
        this.retrieveThread = async (thread_id) => {
            if (!thread_id)
                return null;
            try {
                const thread = await openai.beta.threads.retrieve(thread_id);
                return thread;
            }
            catch (error) {
                console.error(error);
            }
            return null;
        };
        /**
         * 現在のアシスタントの実行をキャンセルする
         * @returns {Promise<void>}
         */
        this.cancelCurrentAssistant = async () => {
            try {
                if (fs.existsSync(keepAssistantRunId)) {
                    const text = fs.readFileSync(keepAssistantRunId, 'utf8');
                    if (!text)
                        return;
                    const [thread_id, run_id] = text.split(':');
                    await openai.beta.threads.runs.cancel(thread_id, run_id);
                    fs.writeFileSync(keepAssistantRunId, '', 'utf8');
                }
            }
            catch (e) {
                console.error(e);
            }
        };
        this.cancelAssistant = async (thread_id, run_id) => {
            try {
                await openai.beta.threads.runs.cancel(thread_id, run_id);
                fs.writeFileSync(keepAssistantRunId, '', 'utf8');
            }
            catch (e) {
                console.error(e);
            }
        };
        this.createNewThread = async () => {
            const emptyThread = await openai.beta.threads.create();
            return emptyThread;
        };
        this.addMessage = async (thread_id, content, fileList = null) => {
            try {
                const requestParams = {
                    role: "user",
                    content: content,
                };
                if (fileList && fileList.length > 0) {
                    const file_ids = fileList.map(x => x.id);
                    console.log('file_ids >>>', file_ids);
                    requestParams.file_ids = file_ids;
                }
                const create_message = await openai.beta.threads.messages.create(thread_id, requestParams);
                await (0, promises_1.setTimeout)(300);
                return create_message;
            }
            catch (e) {
                console.error('addUserMessage Error >>>\n' + (e instanceof Error ? e.message : String(e)));
            }
            return null;
        };
        /**
         * アシスタントを実行する
         * @param {RunParams} params - 実行パラメータ
         * @returns {Promise<{ status: string; text: string | null; files: any[] | null } | null>} 実行結果
         * @throws {Error} アシスタントの実行に失敗した場合
         */
        this.runAssistant = async ({ assistant_id, thread_id, instructions, callback }) => {
            this.supplementaryInfo = null;
            const params = this.prepareParams(assistant_id || this._assistant_id, instructions);
            console.log('runAssistantFunction / runs.create');
            const run = await this.createRunWithRetries(thread_id, params);
            if (!run)
                throw new Error('Assistantの実行に失敗しました');
            const run_id = run.id;
            this._referenceText = '';
            fs.writeFileSync(keepAssistantRunId, `${thread_id}:${run_id}`, 'utf8');
            if (!callback) {
                callback = async (message) => { console.log(message); };
            }
            const result = await this.monitorRunStatus(thread_id, run_id, callback);
            return result;
        };
        this.prepareParams = (assistant_id, override_instructions) => {
            const params = {
                assistant_id: assistant_id,
                tools: this.tools.getDefineToolObjects(),
            };
            if (override_instructions) {
                params.instructions = override_instructions;
            }
            return params;
        };
        this.createRunWithRetries = async (thread_id, params) => {
            let run = null;
            let tryCount = 0;
            while (!run && tryCount < 3) {
                tryCount++;
                try {
                    run = await openai.beta.threads.runs.create(thread_id, params);
                }
                catch (e) {
                    console.error(e);
                    run = null;
                    await (0, promises_1.setTimeout)(5000);
                }
            }
            return run;
        };
        this.monitorRunStatus = async (thread_id, run_id, progress_callback) => {
            let status = 'queued';
            let isSearch = false;
            let waitCount = 0;
            while (status !== 'completed') {
                waitCount++;
                console.log('await waitCount >>>', waitCount);
                await (0, promises_1.setTimeout)(500);
                const runRetrieve = await this.retrieveRunStatus(thread_id, run_id);
                if (!runRetrieve)
                    continue;
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
        this.retrieveRunStatus = async (thread_id, run_id) => {
            try {
                console.log(`runs.retrieve >>> thread_id=${thread_id}, run_id=${run_id}`);
                return await openai.beta.threads.runs.retrieve(thread_id, run_id);
            }
            catch (e) {
                console.error(e);
                return null;
            }
        };
        this.handleCancelled = async (progress_callback) => {
            try {
                await progress_callback({
                    status: 'cancelled',
                    text: ':cry: 回答の生成をキャンセルしました',
                });
            }
            catch (e) {
                console.log(e);
            }
        };
        this.handleFailed = async (progress_callback) => {
            try {
                await progress_callback({
                    status: 'failed',
                    text: ':cry: 回答の生成に失敗しました',
                });
            }
            catch (e) {
                console.log(e);
            }
        };
        this.handleActionRequired = async (runRetrieve, progress_callback, thread_id, run_id) => {
            try {
                await progress_callback({
                    status: 'progress',
                    text: ':thinking_face: べるのでもう少しお待ち下さい...'
                });
            }
            catch (e) {
                console.log(e);
            }
            try {
                const tool_calls = runRetrieve.required_action[runRetrieve.required_action.type].tool_calls;
                this._tool_outputs = [];
                this._tool_outputs_count = tool_calls.length;
                console.log('tool_calls count >>>', tool_calls.length);
                for (const tool_call of tool_calls) {
                    await this.processToolCall(tool_call, thread_id, run_id, progress_callback);
                }
            }
            catch (e) {
                console.error(e);
                await this.cancelAssistant(thread_id, run_id);
            }
        };
        this.processToolCall = async (tool_call, thread_id, run_id, progress_callback) => {
            const tool_type = tool_call.type;
            const tool = tool_call[tool_type];
            console.log('tool_call >>>', tool_call);
            console.log('tool_type >>>', tool_type);
            if (tool_type === 'function') {
                await this.callFunctionTool(tool, thread_id, run_id, tool_call.id, progress_callback);
            }
        };
        this.callFunctionTool = async (tool, thread_id, run_id, call_id, progress_callback) => {
            let args = {};
            try {
                args = JSON.parse(tool.arguments);
            }
            catch (e) {
                console.log('tool.arguments のJSONパースエラー');
                console.error(e);
            }
            console.log('Call Function >>>', tool.name);
            console.log('args >>>', JSON.stringify(args, null, '  '));
            const result = await this.tools.callFunction(tool.name, {
                thread_id, run_id, call_id,
                args: args,
                onProgress: progress_callback || (async () => { }),
                onCanceled: async (message) => await this.cancelAssistant(thread_id, run_id),
            });
            this.referenceLinks = result?.link || null;
            this.setToolOutput(thread_id, run_id, call_id, result?.text);
        };
        this.setToolOutput = async (thread_id, run_id, call_id, content) => {
            const NoData = '該当する情報が見つかりませんでした。';
            const output = {
                tool_call_id: call_id,
                output: content || NoData,
            };
            if (!this._tool_outputs)
                this._tool_outputs = [];
            this._tool_outputs.push(output);
            if (this._tool_outputs.length < (this._tool_outputs_count || 0)) {
                return;
            }
            try {
                await openai.beta.threads.runs.submitToolOutputs(thread_id, run_id, {
                    tool_outputs: this._tool_outputs,
                });
            }
            catch (e) {
                console.error(e);
                await this.cancelAssistant(thread_id, run_id);
            }
        };
        this.retrieveResult = async (thread_id, run_id) => {
            let result = null;
            while (!result) {
                try {
                    result = await openai.beta.threads.messages.list(thread_id);
                    if (result)
                        break;
                }
                catch (e) {
                    console.error(e);
                }
                await (0, promises_1.setTimeout)(500);
            }
            // 修正: result.body.data の代わりに result.data を使用
            const results = result.data;
            return this.processResults(results, run_id);
        };
        this.processResults = async (results, run_id) => {
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
        this.saveAnnotationFiles = async (annotations) => {
            if (!annotations)
                return null;
            if (annotations.length == 0)
                return null;
            const result = [];
            const numAnnotations = annotations.length;
            for (let i = 0; i < numAnnotations; i++) {
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
                    result.push({ id: fileId, filename: fileName, file: filePath });
                }
                catch (e) {
                    console.error(e);
                }
            }
            return result;
        };
        this.uploadFiles = async (fileList, afterRemoveFile = false) => {
            if (!fileList)
                return null;
            let numFiles = fileList.length;
            let results = [];
            for (let i = 0; i < numFiles; i++) {
                try {
                    const file = fileList[i];
                    if (file && file.filePath) {
                        const fileData = await this.uploadFile(file.filePath, afterRemoveFile);
                        console.log('fileData >>>', fileData);
                        results.push(fileData);
                    }
                }
                catch (e) {
                    console.error(e);
                }
            }
            if (results.length == 0)
                return null;
            return results;
        };
        /**
         * ファイルをアップロードする
         * @param {string} filePath - アップロードするファイルのパス
         * @param {boolean} [afterRemoveFile=false] - アップロード後にファイルを削除するかどうか
         * @returns {Promise<FileUploadResult>}
         */
        this.uploadFile = async (filePath, afterRemoveFile = false) => {
            console.log('filePath >>>', filePath);
            const file = await openai.files.create({
                file: fs.createReadStream(filePath),
                purpose: "assistants",
            });
            let inProgress = true;
            const fileID = file.id;
            while (inProgress) {
                await (0, promises_1.setTimeout)(1000);
                const uploadInfo = await openai.files.retrieve(fileID);
                console.log(uploadInfo.status);
                inProgress = uploadInfo.status != 'processed';
            }
            console.log('fileUpload >>>', file);
            if (afterRemoveFile) {
                fs.unlinkSync(filePath);
            }
            return file;
        };
        /**
         * ファイルをアップロードしてアシスタントに追加する
         * @param {string} assistant_id - アシスタントのID
         * @param {Array<{ id: string; mimeType: string }>} fileList - アップロードするファイルのリスト
         * @returns {Promise<void>}
         */
        this.addFilesToAssistant = async (assistant_id, fileList) => {
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
                .filter((tool) => tool.type === "code_interpreter" || tool.type === "file_search")
                .flatMap(tool => {
                // TODO: 実際の出力を確認する
                if (tool.type === "code_interpreter") {
                    return tool.code_interpreter?.file_ids || [];
                }
                else {
                    return tool.file_search?.file_ids || [];
                }
            });
            // 既存のファイルIDと新しいファイルIDを結合
            const updatedFileIds = [...existingFileIds, ...newFileIds];
            // アシスタントを更新
            await openai.beta.assistants.update(assistant_id, {
                tools: [
                    { type: "code_interpreter" },
                    { type: "file_search" }
                ],
                tool_resources: {
                    code_interpreter: { file_ids: updatedFileIds },
                    file_search: { vector_store_ids: updatedFileIds }
                }
            });
        };
        /**
         * Vision APIを使用して画像解析を実行する
         * @param {string} text - 画像に関連する質問やプロンプト
         * @param {Array<{ dataURL: string }>} files - 解析する画像ファイルのリスト
         * @returns {Promise<string | null>} 解析結果のテキスト
         */
        this.vision = async (text, files) => {
            const reqContent = [
                {
                    type: 'text',
                    text: text
                },
            ];
            let numFiles = files.length;
            for (let i = 0; i < numFiles; i++) {
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
        };
        this.onReady = () => { };
        this._assistant_id = null;
        this.tools = new ToolsHelper_js_1.default();
        this.setAssistantId(assistant_id);
    }
}
exports.default = AssistantHelper;
/**
 * 指定された時間内にPromiseが解決されない場合にタイムアウトさせる
 * @param {number} timeout - タイムアウトまでのミリ秒
 * @param {Promise<any>} promise - 実行するPromise
 * @returns {Promise<any>}
 */
async function withTimeout(timeout, promise) {
    const errorMessage = `await での待機 ${timeout}ms を超えました`;
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(errorMessage), timeout));
    return Promise.race([
        promise, // 本来実行したい promise 数
        timeoutPromise, // こちらの方早く解決すると reject()
    ]);
}
