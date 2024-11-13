interface EventHandlers {
    onRecognitionStarted: () => void;
    onRecognitionStopped: () => void;
    onRecognitionCanceled: () => void;
    onRecognitionFailed: (error: any) => void;
    onRecognitionTextUpdated: (text: string) => void;
    onRecognitionTextEnd: (text: string) => void;
}
export default class AzureSpeechRecognizer {
    private _recognizer;
    private _textList;
    private _startTime;
    private _audioInputDeviceId;
    private _displayText;
    private _isRecording;
    onRecognitionStarted: () => void;
    onRecognitionStopped: () => void;
    onRecognitionCanceled: () => void;
    onRecognitionFailed: (error: any) => void;
    onRecognitionTextUpdated: (text: string) => void;
    onRecognitionTextEnd: (text: string) => void;
    constructor(eventHandlers?: Partial<EventHandlers>);
    stopRecognition(): Promise<void>;
    startRecognition(audioInputDeviceId: string, isRestart?: boolean): Promise<void>;
    private _createSpeechConfig;
    private _setupRecognizerCallbacks;
    private _startContinuousRecognition;
    private _initializeRecording;
    private _handleCanceled;
    private _handleRecognizing;
    private _handleRecognized;
    private updateLatestText;
    private addNewTextEntry;
    private setDocDate;
    private setDate;
}
export {};
//# sourceMappingURL=AzureSpeechRecognizer.d.ts.map