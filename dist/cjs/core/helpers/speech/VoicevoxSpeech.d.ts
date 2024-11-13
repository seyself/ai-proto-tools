export default class VoicevoxSpeech {
    textToSpeech: (text: string, options?: {
        voice?: string | number | undefined;
    }) => Promise<Buffer>;
    speechToText: (filePath: string, options?: any) => Promise<string>;
}
//# sourceMappingURL=VoicevoxSpeech.d.ts.map