import * as dotenv from 'dotenv';
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
        this.baseUrl = options?.baseUrl || process.env.STYLE_BERT_VIT2_API_BASE_URL || 'http://localhost:5000';
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
export default StyleBertVIT2;
