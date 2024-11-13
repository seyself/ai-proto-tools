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
const speechsdk = __importStar(require("microsoft-cognitiveservices-speech-sdk"));
const axios_1 = __importDefault(require("axios"));
const universal_cookie_1 = __importDefault(require("universal-cookie"));
class AzureSpeechRecognizer {
    constructor(eventHandlers = {}) {
        this._recognizer = null;
        this._textList = [];
        this._startTime = 0;
        this._audioInputDeviceId = null;
        this._displayText = '';
        this._isRecording = false;
        this.onRecognitionStarted = eventHandlers.onRecognitionStarted || (() => { });
        this.onRecognitionStopped = eventHandlers.onRecognitionStopped || (() => { });
        this.onRecognitionCanceled = eventHandlers.onRecognitionCanceled || (() => { });
        this.onRecognitionFailed = eventHandlers.onRecognitionFailed || (() => { });
        this.onRecognitionTextUpdated = eventHandlers.onRecognitionTextUpdated || (() => { });
        this.onRecognitionTextEnd = eventHandlers.onRecognitionTextEnd || (() => { });
    }
    async stopRecognition() {
        if (this._isRecording && this._recognizer) {
            try {
                await new Promise((resolve, reject) => {
                    this._recognizer.stopContinuousRecognitionAsync(() => {
                        this._displayText = 'Continuous Recognition stopped';
                        this._isRecording = false;
                        this.onRecognitionStopped();
                        resolve();
                    }, (error) => reject(error));
                });
            }
            catch (error) {
                console.error('Error stopping recognition:', error);
            }
        }
    }
    async startRecognition(audioInputDeviceId, isRestart = false) {
        try {
            const tokenObj = await getTokenOrRefresh();
            if (!tokenObj.authToken) {
                throw new Error('Failed to obtain auth token');
            }
            const speechConfig = this._createSpeechConfig({
                authToken: tokenObj.authToken ?? '',
                region: tokenObj.region ?? ''
            });
            const audioConfig = speechsdk.AudioConfig.fromMicrophoneInput(audioInputDeviceId);
            this._audioInputDeviceId = audioInputDeviceId;
            this._recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
            this._setupRecognizerCallbacks(isRestart);
            await this._startContinuousRecognition();
            this.onRecognitionStarted();
        }
        catch (error) {
            console.error('Error starting recognition:', error);
            this._displayText = 'Failed to start recognition';
            this._isRecording = false;
            this.onRecognitionFailed(error);
        }
    }
    _createSpeechConfig(tokenObj) {
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'ja-JP';
        return speechConfig;
    }
    _setupRecognizerCallbacks(isRestart) {
        if (this._recognizer) {
            this._recognizer.canceled = this._handleCanceled.bind(this);
            this._recognizer.recognizing = this._handleRecognizing.bind(this);
            this._recognizer.recognized = this._handleRecognized.bind(this);
        }
    }
    async _startContinuousRecognition() {
        return new Promise((resolve, reject) => {
            this._recognizer.startContinuousRecognitionAsync(() => {
                this._displayText = 'Continuous Recognition started';
                this._isRecording = true;
                this._initializeRecording();
                resolve();
            }, (error) => reject(error));
        });
    }
    _initializeRecording() {
        this._startTime = Date.now();
        this.setDocDate();
    }
    _handleCanceled(sender, event) {
        console.log('Recognition canceled:', event);
        this._displayText = 'Restarting Continuous Recognition';
        this._isRecording = false;
        this.onRecognitionCanceled();
        if (this._audioInputDeviceId) {
            this.startRecognition(this._audioInputDeviceId, true);
        }
    }
    _handleRecognizing(sender, event) {
        if (event.result.text) {
            this.setDate();
            this.updateLatestText(event.result.text);
            this.onRecognitionTextUpdated(event.result.text);
        }
    }
    _handleRecognized(sender, event) {
        if (event.result.text) {
            this.updateLatestText(event.result.text);
            this.addNewTextEntry();
            this.onRecognitionTextEnd(event.result.text);
        }
    }
    updateLatestText(text) {
        const lastIndex = this._textList.length - 1;
        if (lastIndex >= 0) {
            this._textList[lastIndex].text = text;
        }
    }
    addNewTextEntry() {
        const speaker = this._textList.length > 0
            ? this._textList[this._textList.length - 1].speaker
            : 'UNKNOWN';
        this._textList.push({
            date: '',
            time: '',
            speaker: speaker,
            text: '',
        });
    }
    setDocDate() {
        // 文書の日付を設定するロジックを実装
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        if (this._textList.length > 0) {
            this._textList[0].date = date;
        }
    }
    setDate() {
        // 各エントリーの日時を設定するロジックを実装
        const now = new Date();
        const time = now.toTimeString().split(' ')[0];
        const lastIndex = this._textList.length - 1;
        if (lastIndex >= 0) {
            this._textList[lastIndex].time = time;
        }
    }
}
exports.default = AzureSpeechRecognizer;
async function getTokenOrRefresh() {
    const CookieClass = universal_cookie_1.default;
    const cookie = new CookieClass();
    const speechToken = cookie.get('speech-token');
    if (speechToken === undefined) {
        try {
            const res = await axios_1.default.get('/api/get-speech-token');
            const { token, region } = res.data;
            cookie.set('speech-token', `${region}:${token}`, { maxAge: 540, path: '/' });
            console.log('Token fetched from back-end: ' + token);
            return { authToken: token, region };
        }
        catch (err) {
            const error = err;
            console.log(error.response?.data);
            return { authToken: null, error: error.response?.data };
        }
    }
    else {
        console.log('Token fetched from cookie: ' + speechToken);
        const [region, authToken] = speechToken.split(':');
        return { authToken, region };
    }
}
