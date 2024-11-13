import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import axios, { AxiosError } from 'axios';
import Cookie from 'universal-cookie';


interface EventHandlers {
  onRecognitionStarted: () => void;
  onRecognitionStopped: () => void;
  onRecognitionCanceled: () => void;
  onRecognitionFailed: (error: any) => void;
  onRecognitionTextUpdated: (text: string) => void;
  onRecognitionTextEnd: (text: string) => void;
}

interface TextEntry {
  date: string;
  time: string;
  speaker: string;
  text: string;
}

export default class AzureSpeechRecognizer {
  private _recognizer: speechsdk.SpeechRecognizer | null;
  private _textList: TextEntry[];
  private _startTime: number;
  private _audioInputDeviceId: string | null;
  private _displayText: string;
  private _isRecording: boolean;

  onRecognitionStarted: () => void;
  onRecognitionStopped: () => void;
  onRecognitionCanceled: () => void;
  onRecognitionFailed: (error: any) => void;
  onRecognitionTextUpdated: (text: string) => void;
  onRecognitionTextEnd: (text: string) => void;

  constructor(eventHandlers: Partial<EventHandlers> = {}) {
    this._recognizer = null;
    this._textList = [];
    this._startTime = 0;
    this._audioInputDeviceId = null;
    this._displayText = '';
    this._isRecording = false;

    this.onRecognitionStarted = eventHandlers.onRecognitionStarted || (() => {});
    this.onRecognitionStopped = eventHandlers.onRecognitionStopped || (() => {});
    this.onRecognitionCanceled = eventHandlers.onRecognitionCanceled || (() => {});
    this.onRecognitionFailed = eventHandlers.onRecognitionFailed || (() => {});
    this.onRecognitionTextUpdated = eventHandlers.onRecognitionTextUpdated || (() => {});
    this.onRecognitionTextEnd = eventHandlers.onRecognitionTextEnd || (() => {});
  }

  async stopRecognition(): Promise<void> {
    if (this._isRecording && this._recognizer) {
      try {
        await new Promise<void>((resolve, reject) => {
          this._recognizer!.stopContinuousRecognitionAsync(
            () => {
              this._displayText = 'Continuous Recognition stopped';
              this._isRecording = false;
              this.onRecognitionStopped();
              resolve();
            },
            (error) => reject(error)
          );
        });
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }

  async startRecognition(audioInputDeviceId: string, isRestart: boolean = false): Promise<void> {
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
    } catch (error) {
      console.error('Error starting recognition:', error);
      this._displayText = 'Failed to start recognition';
      this._isRecording = false;
      this.onRecognitionFailed(error);
    }
  }

  private _createSpeechConfig(tokenObj: { authToken: string; region: string }): speechsdk.SpeechConfig {
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
    speechConfig.speechRecognitionLanguage = 'ja-JP';
    return speechConfig;
  }

  private _setupRecognizerCallbacks(isRestart: boolean): void {
    if (this._recognizer) {
      this._recognizer.canceled = this._handleCanceled.bind(this);
      this._recognizer.recognizing = this._handleRecognizing.bind(this);
      this._recognizer.recognized = this._handleRecognized.bind(this);
    }
  }

  private async _startContinuousRecognition(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._recognizer!.startContinuousRecognitionAsync(
        () => {
          this._displayText = 'Continuous Recognition started';
          this._isRecording = true;
          this._initializeRecording();
          resolve();
        },
        (error) => reject(error)
      );
    });
  }

  private _initializeRecording(): void {
    this._startTime = Date.now();
    this.setDocDate();
  }

  private _handleCanceled(sender: any, event: speechsdk.SpeechRecognitionCanceledEventArgs): void {
    console.log('Recognition canceled:', event);
    this._displayText = 'Restarting Continuous Recognition';
    this._isRecording = false;
    this.onRecognitionCanceled();
    if (this._audioInputDeviceId) {
      this.startRecognition(this._audioInputDeviceId, true);
    }
  }

  private _handleRecognizing(sender: any, event: speechsdk.SpeechRecognitionEventArgs): void {
    if (event.result.text) {
      this.setDate();
      this.updateLatestText(event.result.text);
      this.onRecognitionTextUpdated(event.result.text);
    }
  }

  private _handleRecognized(sender: any, event: speechsdk.SpeechRecognitionEventArgs): void {
    if (event.result.text) {
      this.updateLatestText(event.result.text);
      this.addNewTextEntry();
      this.onRecognitionTextEnd(event.result.text);
    }
  }

  private updateLatestText(text: string): void {
    const lastIndex = this._textList.length - 1;
    if (lastIndex >= 0) {
      this._textList[lastIndex].text = text;
    }
  }

  private addNewTextEntry(): void {
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

  private setDocDate(): void {
    // 文書の日付を設定するロジックを実装
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    if (this._textList.length > 0) {
      this._textList[0].date = date;
    }
  }

  private setDate(): void {
    // 各エントリーの日時を設定するロジックを実装
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    const lastIndex = this._textList.length - 1;
    if (lastIndex >= 0) {
      this._textList[lastIndex].time = time;
    }
  }
}



interface SpeechTokenResponse {
  token: string;
  region: string;
}

interface TokenResult {
  authToken: string | null;
  region?: string;
  error?: string;
}

async function getTokenOrRefresh(): Promise<TokenResult> {
  const CookieClass: any = Cookie;
  const cookie = new CookieClass();
  const speechToken = cookie.get('speech-token');

  if (speechToken === undefined) {
    try {
      const res = await axios.get<SpeechTokenResponse>('/api/get-speech-token');
      const { token, region } = res.data;
      cookie.set('speech-token', `${region}:${token}`, { maxAge: 540, path: '/' });

      console.log('Token fetched from back-end: ' + token);
      return { authToken: token, region };
    } catch (err) {
      const error = err as AxiosError;
      console.log(error.response?.data);
      return { authToken: null, error: error.response?.data as string };
    }
  } else {
    console.log('Token fetched from cookie: ' + speechToken);
    const [region, authToken] = speechToken.split(':');
    return { authToken, region };
  }
}
