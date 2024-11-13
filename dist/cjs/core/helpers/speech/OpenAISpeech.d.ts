export default class OpenAISpeech {
    constructor();
    speechToText: (audioFilePath: string, options?: {
        language?: string | undefined;
        prompt?: string | undefined;
        response_format?: string | undefined;
        temperature?: number | undefined;
        timestamp_granularities?: any[] | undefined;
    }) => Promise<string>;
    textToSpeech: (text: string, options?: {
        voice?: string | number | undefined;
        model?: string | undefined;
        response_format?: string | undefined;
        speed?: number | undefined;
    }) => Promise<Buffer>;
}
//# sourceMappingURL=OpenAISpeech.d.ts.map