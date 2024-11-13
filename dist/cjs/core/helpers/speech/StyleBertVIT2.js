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
dotenv.config();
class StyleBertVIT2 {
    constructor(options) {
        this.speechToText = async (audioFilePath, options) => {
            throw new Error('Not implemented');
        };
        this.textToSpeech = async (text, options) => {
            const model = options?.model || this.useModel || StyleBertVIT2.Model.amitaro;
            const baseUrl = options?.baseUrl || this.baseUrl;
            const params = {
                text: text,
                model_name: model,
                encoding: options?.encoding || 'utf-8',
                length: options?.speed || this.speed || 1,
                noise: options?.noise || 0.6,
                noisew: options?.noisew || 0.8,
                language: options?.language || 'JP',
                style: options?.style || this.style || StyleBertVIT2.Style.Neutral,
                style_weight: options?.styleWeight || this.styleWeight || 1,
            };
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${baseUrl}/voice?${queryString}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'audio/wav',
                },
            });
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        };
        this.useModel = options?.model || StyleBertVIT2.Model.amitaro;
        this.speed = options?.speed || 1;
        this.baseUrl = options?.baseUrl || 'http://localhost:5000';
        this.style = options?.style || StyleBertVIT2.Style.Neutral;
        this.styleWeight = options?.styleWeight || 1;
    }
}
StyleBertVIT2.Model = {
    amitaro: 'amitaro',
    koharune_ami: 'koharune-ami',
    jvnv_F1_jp: 'jvnv-F1-jp',
    jvnv_F2_jp: 'jvnv-F2-jp',
    jvnv_M1_jp: 'jvnv-M1-jp',
    jvnv_M2_jp: 'jvnv-M2-jp',
};
StyleBertVIT2.Style = {
    Neutral: 'Neutral',
    Angry: 'Angry',
    Disgust: 'Disgust',
    Fear: 'Fear',
    Happy: 'Happy',
    Sad: 'Sad',
    Surprise: 'Surprise',
};
exports.default = StyleBertVIT2;
