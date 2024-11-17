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
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const generative_ai_1 = require("@google/generative-ai");
const server_1 = require("@google/generative-ai/server");
const readFileToBase64_js_1 = require("../../utils/readFileToBase64.js");
const AIModel_js_1 = require("../AIModel.js");
dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
const fileManager = new server_1.GoogleAIFileManager(GEMINI_API_KEY);
/**
 * Uploads the given file to Gemini.
 *
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(filePath) {
    const file = await (0, readFileToBase64_js_1.readFileToBase64)(filePath);
    console.log(filePath, file.fileName);
    // const response = await axios.post(
    //   `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    //   { file: { display_name: file.fileName } },
    //   {
    //     headers: {
    //       'X-Goog-Upload-Command': 'start, upload, finalize',
    //       'X-Goog-Upload-Header-Content-Length': file.length,
    //       'X-Goog-Upload-Header-Content-Type': file.mimeType,
    //       'Content-Type': 'application/json',
    //     },
    //     data: file.data,
    //   }
    // );
    const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType: file.mimeType,
        displayName: file.fileName,
    });
    const fileInfo = uploadResult.file;
    console.log(`Uploaded file ${fileInfo.displayName} as: ${fileInfo.name}`);
    // return file;
    return {
        // response: response?.data?.file,
        response: fileInfo,
        file: file,
    };
}
class GeminiChat {
    constructor(options = { systemPrompt: null, model: AIModel_js_1.AIModel.gemini_default, max_tokens: 4096, json: false, tools: null }) {
        this.history = [];
        this.addUserMessage = (content) => {
            this.history.push({ role: 'user', content });
        };
        this.addAssistantMessage = (content) => {
            this.history.push({ role: 'model', content });
        };
        this.send = async (userPrompt, options = { json: false, model: null, tools: null }) => {
            if (!userPrompt)
                return null;
            const { systemPrompt, model, max_tokens, json, tools } = options;
            this.history.push({ role: "user", content: userPrompt });
            const data = {
                parts: this.history,
                generationConfig: {
                    maxOutputTokens: this.maxTokens,
                    temperature: 1,
                    topP: 0.95,
                    responseMimeType: "text/plain",
                }
            };
            // if (json) {
            //   data.response_format = { type: 'json_object' };
            // }
            // if (tools) {
            //   data.tools = tools.getDefineToolObjects() as Anthropic.Messages.Tool[];
            // }
            try {
                const genModel = genAI.getGenerativeModel({
                    model: model || this.useModel || AIModel_js_1.AIModel.gemini_default,
                    systemInstruction: systemPrompt || this.systemPrompt || '',
                }, {
                    apiVersion: options?.apiVersion || 'v1beta',
                });
                const chat = await genModel.startChat(data);
                const result = await chat.sendMessage(userPrompt);
                const response = await result.response;
                console.log('API >> response >>>', response);
                return response.text();
            }
            catch (error) {
                console.error('Error fetching data:', error);
            }
            return null;
        };
        this.vision = async (text, files, options) => {
            const { systemPrompt, model, max_tokens, json, tools } = options || {};
            try {
                // gemini-pro-visionモデルのインスタンスを作成
                const visionModel = genAI.getGenerativeModel({
                    model: model || this.useModel || AIModel_js_1.AIModel.gemini_default,
                    systemInstruction: systemPrompt || this.systemPrompt || '',
                }, {
                    apiVersion: options?.apiVersion || 'v1beta',
                });
                const generationConfig = {
                    temperature: 1,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain",
                };
                const images = [];
                for (let i = 0; i < files.length; i++) {
                    const filePath = files[i];
                    if (filePath.indexOf(';base64,') > 0) {
                        const imageData = {
                            inlineData: {
                                mimeType: filePath.split(',')[0].replace(/^data:([^;]+);base64/, '$1'),
                                data: filePath.split(',')[1],
                            },
                        };
                        images.push(imageData);
                    }
                    else {
                        const fileInfo = await (0, readFileToBase64_js_1.readFileToBase64)(filePath);
                        const imageData = {
                            inlineData: {
                                mimeType: fileInfo.mimeType,
                                data: fileInfo.base64.split(',')[1],
                            },
                        };
                        images.push(imageData);
                    }
                }
                const result = await visionModel.generateContent([text, ...images]);
                const resultText = result.response.text();
                return resultText;
            }
            catch (error) {
                console.error('Error in vision processing:', error);
                return null;
            }
        };
        const { systemPrompt, model, max_tokens, json, tools } = options;
        this.systemPrompt = systemPrompt;
        this.useModel = model || AIModel_js_1.AIModel.gemini_default;
        this.maxTokens = max_tokens || 4096;
        this.tools = tools || null;
        this.json = json || false;
        this.apiVersion = options?.apiVersion || null;
        this.clearHistory();
    }
    clearHistory() {
        this.history = [];
        if (this.systemPrompt) {
            this.history.push({ role: "user", content: this.systemPrompt });
        }
    }
}
exports.default = GeminiChat;
