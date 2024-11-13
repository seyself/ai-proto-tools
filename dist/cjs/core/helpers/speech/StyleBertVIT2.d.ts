type StyleBertVIT2Options = {
    model?: string | undefined;
    speed?: number | undefined;
    baseUrl?: string | undefined;
    encoding?: string | undefined;
    noise?: number | undefined;
    noisew?: number | undefined;
    language?: string | undefined;
    style?: string | undefined;
    styleWeight?: number | undefined;
};
export default class StyleBertVIT2 {
    private useModel;
    private speed;
    private baseUrl;
    private style;
    private styleWeight;
    static Model: {
        amitaro: string;
        koharune_ami: string;
        jvnv_F1_jp: string;
        jvnv_F2_jp: string;
        jvnv_M1_jp: string;
        jvnv_M2_jp: string;
    };
    static Style: {
        Neutral: string;
        Angry: string;
        Disgust: string;
        Fear: string;
        Happy: string;
        Sad: string;
        Surprise: string;
    };
    constructor(options?: StyleBertVIT2Options);
    speechToText: (audioFilePath: string, options?: any) => Promise<string>;
    textToSpeech: (text: string, options?: StyleBertVIT2Options) => Promise<Buffer>;
}
export {};
//# sourceMappingURL=StyleBertVIT2.d.ts.map