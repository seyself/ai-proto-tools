import * as dotenv from 'dotenv';
import { GoogleGenerativeAI, } from '@google/generative-ai';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { readFileToBase64 } from '../../utils/readFileToBase64.js';
dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
/**
 * Uploads the given file to Gemini.
 *
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(filePath) {
    const file = await readFileToBase64(filePath);
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
export default class GeminiChat {
    constructor(options = { systemPrompt: null, model: 'gemini-1.5-flash-002', max_tokens: 4096, json: false, tools: null }) {
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
                    temperature: 0.7,
                }
            };
            // if (json) {
            //   data.response_format = { type: 'json_object' };
            // }
            // if (tools) {
            //   data.tools = tools.getDefineToolObjects() as Anthropic.Messages.Tool[];
            // }
            try {
                const genModel = genAI.getGenerativeModel({ model: model || this.useModel });
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
            const { model } = options || {};
            try {
                // gemini-pro-visionモデルのインスタンスを作成
                const visionModel = genAI.getGenerativeModel({
                    model: model || this.useModel || 'gemini-1.5-flash-002'
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
                        const fileInfo = await readFileToBase64(filePath);
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
        this.useModel = model || 'gemini-1.5-flash-002';
        this.maxTokens = max_tokens || 4096;
        this.tools = tools || null;
        this.json = json || false;
        this.clearHistory();
    }
    clearHistory() {
        this.history = [];
        if (this.systemPrompt) {
            this.history.push({ role: "user", content: this.systemPrompt });
        }
    }
}
