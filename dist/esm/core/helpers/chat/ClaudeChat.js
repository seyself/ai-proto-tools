import * as dotenv from 'dotenv';
import { Anthropic } from '@anthropic-ai/sdk';
import { readFileToBase64 } from '../../utils/readFileToBase64.js';
import { AIModel } from '../AIModel.js';
dotenv.config();
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
export default class ClaudeChat {
    constructor(options = { systemPrompt: null, model: AIModel.claude_default, max_tokens: 4096, json: false, tools: null }) {
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
            if (options) {
                // if (options.seed !== undefined) data.seed = options.seed;
                if (options.top_p !== undefined)
                    data.top_p = options.top_p;
                // if (options.frequency_penalty !== undefined) data.frequency_penalty = options.frequency_penalty;
                // if (options.presence_penalty !== undefined) data.presence_penalty = options.presence_penalty;
                // if (options.modalities !== undefined) data.modalities = options.modalities;
            }
            // if (json) {
            //   data.response_format = { type: 'json_object' };
            // }
            // if (tools) {
            //   data.tools = tools.getDefineToolObjects() as Anthropic.Messages.Tool[];
            // }
            try {
                const response = await anthropic.messages.create(data);
                if (this.outputLogs || options?.outputLogs)
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
                console.log('Error fetching data:', error.message);
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
                        const fileInfo = await readFileToBase64(filePath);
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
                const data = {
                    model: model || this.useModel || AIModel.claude_default,
                    max_tokens: this.maxTokens,
                    messages: [
                        {
                            role: 'user',
                            content: reqContent,
                        }
                    ],
                };
                if (options) {
                    // if (options.seed !== undefined) data.seed = options.seed;
                    if (options.top_p !== undefined)
                        data.top_p = options.top_p;
                    // if (options.frequency_penalty !== undefined) data.frequency_penalty = options.frequency_penalty;
                    // if (options.presence_penalty !== undefined) data.presence_penalty = options.presence_penalty;
                    // if (options.modalities !== undefined) data.modalities = options.modalities;
                }
                const visionResponse = await anthropic.messages.create(data);
                if ('content' in visionResponse && visionResponse.content.length > 0) {
                    const content = visionResponse.content[0];
                    if (content && 'text' in content) {
                        return content.text;
                    }
                }
                return null;
            }
            catch (error) {
                console.log('Error in vision processing:', error.message);
                return null;
            }
        };
        const { systemPrompt, model, max_tokens, json, tools } = options;
        this.systemPrompt = systemPrompt;
        this.useModel = model || AIModel.claude_default;
        this.maxTokens = max_tokens || 4096;
        this.tools = tools || null;
        this.json = json || false;
        this.outputLogs = options?.outputLogs || false;
        this.clearHistory();
    }
    clearHistory() {
        this.history = [];
    }
}
