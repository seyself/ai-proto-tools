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
const fs_1 = __importDefault(require("fs"));
const openai_1 = __importDefault(require("openai"));
dotenv.config();
const openai = new openai_1.default();
class OpenAISpeech {
    constructor() {
        this.speechToText = async (audioFilePath, options) => {
            if (!options) {
                options = {};
            }
            const params = {
                file: fs_1.default.createReadStream(audioFilePath),
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
exports.default = OpenAISpeech;
