import * as dotenv from 'dotenv';
import fs from 'fs';
import OpenAI from 'openai';
dotenv.config();
const openai = new OpenAI();
export default class OpenAISpeech {
    constructor() {
        this.speechToText = async (audioFilePath, options) => {
            if (!options) {
                options = {};
            }
            const params = {
                file: fs.createReadStream(audioFilePath),
                model: 'whisper-1',
                language: options?.language || 'ja',
                ...options,
            };
            const transcription = await openai.audio.transcriptions.create(params);
            return transcription.text;
        };
        this.textToSpeech = async (text, options) => {
            if (!options) {
                options = {
                    voice: 'alloy',
                    model: 'tts-1',
                    response_format: 'wav',
                };
            }
            const params = {
                input: text,
                voice: options?.voice || 'alloy',
                model: options?.model || 'tts-1',
                response_format: options?.response_format || 'wav',
                speed: options?.speed || 1,
            };
            const audio = await openai.audio.speech.create(params);
            return Buffer.from(await audio.arrayBuffer());
        };
        //
    }
}
