import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { setTimeout as _setTimeout } from 'timers/promises';
import OpenAI from 'openai';

dotenv.config();
const openai = new OpenAI();

export default class OpenAISpeech {

  constructor() {
    //
  }

  speechToText = async (audioFilePath: string, options?: { 
    language?: string | undefined, 
    prompt?: string | undefined, 
    response_format?: string | undefined, 
    temperature?: number | undefined, 
    timestamp_granularities?: any[] | undefined, 
  }): Promise<string> => {
    if (!options) {
      options = {};
    }
    const params: any = {
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: options?.language || 'ja',
      ...options,
    };
    const transcription = await openai.audio.transcriptions.create(params);
    return transcription.text;
  }

  textToSpeech = async (text: string, options?: { 
    voice?: string | number | undefined, 
    model?: string | undefined, 
    response_format?: string | undefined,
    speed?: number | undefined,
  }): Promise<Buffer> => {
    if (!options) {
      options = { 
        voice: 'alloy', 
        model: 'tts-1',
        response_format: 'wav',
      };
    }
    const params: any = {
      input: text,
      voice: options?.voice || 'alloy', 
      model: options?.model || 'tts-1',
      response_format: options?.response_format || 'wav',
      speed: options?.speed || 1,
    };
    const audio = await openai.audio.speech.create(params);
    return Buffer.from(await audio.arrayBuffer());
  }
  
}

