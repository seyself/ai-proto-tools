import * as dotenv from 'dotenv';
import { setTimeout as _setTimeout } from 'timers/promises';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import ToolsHelper from '../ToolsHelper.js';
import { Anthropic } from '@anthropic-ai/sdk';
import { type IChatHelper, type ChatHelperOptions, type VisionFile } from '../IChatHelper.js';
import { readFileToBase64 } from '../../utils/readFileToBase64.js';
import { AIModel } from '../AIModel.js';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default class ClaudeChat implements IChatHelper {
  private systemPrompt: string | null | undefined;
  readonly useModel: string;
  private maxTokens: number;
  private tools: ToolsHelper | null;
  private json: boolean;
  private history: ChatCompletionMessageParam[] = [];

  constructor(options:ChatHelperOptions = { systemPrompt: null, model: AIModel.claude_default, max_tokens: 4096, json: false, tools: null }) {
    const { systemPrompt, model, max_tokens, json, tools } = options;

    this.systemPrompt = systemPrompt;
    this.useModel = model || AIModel.claude_default;
    this.maxTokens = max_tokens || 4096;
    this.tools = tools || null;
    this.json = json || false;

    this.clearHistory();
  }

  public clearHistory()
  {
    this.history = [];
  }

  public addUserMessage = (content: string) => {
    this.history.push({ role: 'user', content });
  }

  public addAssistantMessage = (content: string) => {
    this.history.push({ role: 'assistant', content });
  }

  public send = async (userPrompt: string, options: ChatHelperOptions = { json: false, model: null, tools: null }): Promise<string | object | null> => {
    if (!userPrompt) return null;

    const { systemPrompt, model, max_tokens, json, tools } = options;

    this.history.push({ role: "user", content: userPrompt });

    const data: Anthropic.Messages.MessageCreateParamsNonStreaming = {
      model: model || this.useModel,
      messages: this.history as Anthropic.Messages.MessageParam[],
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
      const response: Anthropic.Messages.Message = await anthropic.messages.create(data);
      console.log('API >> response >>>', response);
      if ('content' in response && response.content.length > 0) {
        const content: Anthropic.Messages.ContentBlock = response.content[0];
        if (content) {
          const text: string = (content as Anthropic.Messages.TextBlock)?.text;
          if (text)
          {
            this.history.push({ role: "assistant", content: text });
            return text;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    return null;
  }

  public vision = async (text: string, files: string[], options?: ChatHelperOptions): Promise<string | null> => {
    const { model } = options || {};
    const reqContent: Array<any> = [
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
        } else {
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
      const visionResponse = await anthropic.messages.create({
        model: model || this.useModel || AIModel.claude_default,
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
    } catch (error) {
      console.error('Error in vision processing:', error);
      return null;
    }
  }
}
