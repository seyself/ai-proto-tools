import fs from "fs"

const VOICEVOX_API_URL = 'http://localhost:50021';

export default class VoicevoxSpeech {

  textToSpeech = async (text: string, options?: {
    voice?: string | number | undefined
  }): Promise<Buffer> => {
    const voice: number = options?.voice as number || 0;
    const query = await audioQuery(text, voice);
    return await synthesis(query, voice);
  }

  speechToText = async (filePath: string, options?: any): Promise<string> => {
    throw new Error('Not implemented');
  }
}

async function audioQuery(text: string, voice: number = 0): Promise<any> {
  const url = `${VOICEVOX_API_URL}/audio_query`;
  const params: any = {
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

async function synthesis(query: any, voice: number): Promise<Buffer> {
  const url = `${VOICEVOX_API_URL}/synthesis`;
  const params: any = {
    speaker: voice,
    enable_interrogative_upspeak: true,
  }
  const queryString = new URLSearchParams(params).toString();
  const sound_row = await fetch(`${url}?${queryString}`, {
    method: "POST",
    headers: { 
      'Content-Type': 'application/json',
      'accept': 'audio/wav',
      'responseType': "stream"
     },
     body: JSON.stringify(query)
  })
  
  const arrayBuffer = await sound_row.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // await fs.promises.writeFile("stream.wav", buffer);
  return buffer;
}



