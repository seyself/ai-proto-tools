"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VOICEVOX_API_URL = 'http://localhost:50021';
class VoicevoxSpeech {
    constructor() {
        this.textToSpeech = async (text, options) => {
            const voice = options?.voice || 0;
            const query = await audioQuery(text, voice);
            return await synthesis(query, voice);
        };
        this.speechToText = async (filePath, options) => {
            throw new Error('Not implemented');
        };
    }
}
exports.default = VoicevoxSpeech;
async function audioQuery(text, voice = 0) {
    const url = `${VOICEVOX_API_URL}/audio_query`;
    const params = {
        text,
        speaker: voice,
    };
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`${url}?${queryString}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return await res.json();
}
async function synthesis(query, voice) {
    const url = `${VOICEVOX_API_URL}/synthesis`;
    const params = {
        speaker: voice,
        enable_interrogative_upspeak: true,
    };
    const queryString = new URLSearchParams(params).toString();
    const sound_row = await fetch(`${url}?${queryString}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'accept': 'audio/wav',
            'responseType': "stream"
        },
        body: JSON.stringify(query)
    });
    const arrayBuffer = await sound_row.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // await fs.promises.writeFile("stream.wav", buffer);
    return buffer;
}
