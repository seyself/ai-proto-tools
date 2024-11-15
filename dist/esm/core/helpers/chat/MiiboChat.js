import * as dotenv from 'dotenv';
import axios from 'axios';
import { readFileToBase64 } from '../../utils/readFileToBase64.js';
import { AIModel } from '../AIModel.js';
dotenv.config();
// 環境変数からAPI情報を取得
const MIIBO_API_URL = 'https://api-mebo.dev/api';
const MIIBO_API_KEY = process.env.MIIBO_API_KEY;
const MIIBO_AGENT_ID = process.env.MIIBO_AGENT_ID;
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
export default class MiiboChat {
    /**
     * ChatHelper のインスタンスを作成します。
     * @param {ChatHelperOptions} options - 設定オプション
     * @param {string} [options.systemPrompt] - システムプロンプト
     * @param {string} [options.model='gpt-4o'] - 使用する AI モデル
     * @param {number} [options.max_tokens=4096] - 最大トークン数
     */
    constructor(options = { systemPrompt: null, model: AIModel.gpt_default, max_tokens: 4096, json: false, tools: null }) {
        this.history = [];
        this.addUserMessage = (content) => {
            this.history.push({ role: 'user', content });
        };
        this.addAssistantMessage = (content) => {
            this.history.push({ role: 'assistant', content });
        };
        this.send = async (userPrompt, options = { json: false, model: null, tools: null }) => {
            if (!userPrompt)
                return null;
            try {
                const response = await axios.post(MIIBO_API_URL, {
                    api_key: MIIBO_API_KEY,
                    agent_id: MIIBO_AGENT_ID,
                    utterance: userPrompt,
                    uid: this.uid,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                const content = response?.data?.bestResponse?.utterance;
                // console.log(response.data);
                this.addUserMessage(userPrompt);
                this.addAssistantMessage(content);
                return content;
            }
            catch (error) {
                console.error('メッセージ送信エラー:', error);
            }
            return null;
        };
        this.vision = async (text, files, options) => {
            const { model } = options || {};
            if (!text)
                return null;
            try {
                let fileInfo = null;
                if (files[0].indexOf(';base64,') > 0) {
                    fileInfo = files[0]; // Base64 の場合はそのまま追加
                }
                else {
                    fileInfo = await readFileToBase64(files[0]);
                }
                const response = await axios.post(MIIBO_API_URL, {
                    api_key: MIIBO_API_KEY,
                    agent_id: MIIBO_AGENT_ID,
                    utterance: text,
                    uid: this.uid,
                    base64_image: fileInfo.base64.split(',')[1],
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });
                const content = response?.data?.bestResponse?.utterance;
                // console.log(response.data);
                this.addUserMessage(text);
                this.addAssistantMessage(content);
                return content;
            }
            catch (error) {
                console.error('メッセージ送信エラー:', error);
            }
            return null;
        };
        const { systemPrompt, model, max_tokens, json, tools } = options;
        this.systemPrompt = systemPrompt;
        this.useModel = model || AIModel.gpt_default;
        this.maxTokens = max_tokens || 4096;
        this.tools = tools || null;
        this.json = json || false;
        this.uid = 'uid_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 15);
        this.clearHistory();
    }
    clearHistory() {
        this.history = [];
        if (this.systemPrompt) {
            this.history.push({ role: "system", content: this.systemPrompt });
        }
    }
}
