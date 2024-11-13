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
const sdk_1 = require("@anthropic-ai/sdk");
const readFileToBase64_js_1 = require("../../utils/readFileToBase64.js");
dotenv.config();
const anthropic = new sdk_1.Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
class ClaudeChat {
    constructor(options = { systemPrompt: null, model: 'claude-3-5-sonnet-20241022', max_tokens: 4096, json: false, tools: null }) {
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
            const { systemPrompt, model, max_tokens, json, tools } = options;
            this.history.push({ role: "user", content: userPrompt });
            const data = {
                model: model || this.useModel,
                messages: this.history,
                max_tokens: max_tokens || this.maxTokens,
                system: systemPrompt || this.systemPrompt || undefined,
            };
            // if (json) {
            //   data.response_format = { type: 'json_object' };
            // }
            // if (tools) {
            //   data.tools = tools.getDefineToolObjects() as Anthropic.Messages.Tool[];
            // }
            try {
                const response = await anthropic.messages.create(data);
                console.log('API >> response >>>', response);
                if ('content' in response && response.content.length > 0) {
                    const content = response.content[0];
                    if (content) {
                        const text = content?.text;
                        if (text) {
                            this.history.push({ role: "assistant", content: text });
                            return text;
                        }
                    }
                }
                return null;
            }
            catch (error) {
                console.error('Error fetching data:', error);
            }
            return null;
        };
        this.vision = async (text, files, options) => {
            const { model } = options || {};
            const reqContent = [
                {
                    type: 'text',
                    text: text
                },
            ];
            for (const filePath of files) {
                if (filePath) {
                    if (filePath.indexOf(';base64,') > 0) {
                        reqContent.push({
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: filePath.split(',')[0].replace(/^data:([^;]+);base64/, '$1') || 'image/png',
                                data: filePath.split(',')[1], // Remove data URL prefix
                            }
                        });
                    }
                    else {
                        const fileInfo = await (0, readFileToBase64_js_1.readFileToBase64)(filePath);
                        reqContent.push({
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: fileInfo.mimeType || 'image/jpeg',
                                data: fileInfo.base64.split(',')[1], // Remove data URL prefix
                            }
                        });
                    }
                }
            }
            try {
                const visionResponse = await anthropic.messages.create({
                    model: model || this.useModel || 'claude-3-opus-20240229',
                    max_tokens: this.maxTokens,
                    messages: [
                        {
                            role: 'user',
                            content: reqContent,
                        }
                    ],
                });
                if ('content' in visionResponse && visionResponse.content.length > 0) {
                    const content = visionResponse.content[0];
                    if (content && 'text' in content) {
                        return content.text;
                    }
                }
                return null;
            }
            catch (error) {
                console.error('Error in vision processing:', error);
                return null;
            }
        };
        const { systemPrompt, model, max_tokens, json, tools } = options;
        this.systemPrompt = systemPrompt;
        this.useModel = model || 'claude-3-5-sonnet-20241022';
        this.maxTokens = max_tokens || 4096;
        this.tools = tools || null;
        this.json = json || false;
        this.clearHistory();
    }
    clearHistory() {
        this.history = [];
    }
}
exports.default = ClaudeChat;
