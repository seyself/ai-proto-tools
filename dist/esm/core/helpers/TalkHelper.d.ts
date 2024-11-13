import { EventEmitter } from 'events';
interface TalkHelperOptions {
    apiKey: string;
    relayServer?: string;
    customInstructions?: string;
}
/**
 * TalkHelperクラスは、リアルタイム音声処理とクライアント通信の機能を提供します。
 */
export default class TalkHelper extends EventEmitter {
    private instructions;
    private tools;
    private apiKey;
    private USE_LOCAL_RELAY_SERVER_URL;
    private wavRecorder;
    private wavStreamPlayer;
    private client;
    private _keepBuffers;
    private items;
    private realtimeEvents;
    private memoryKv;
    private isTalking;
    private lastSoundTime;
    private maxSilenceDuration;
    private silenceThreshold;
    private noiseStartTime;
    private minNoiseDuration;
    constructor({ apiKey, relayServer, customInstructions }: TalkHelperOptions);
    private setupWavStreamPlayerListeners;
    private onConnect;
    private onDisconnect;
    private onInterrupt;
    private onResume;
    private onError;
    private onStart;
    private onStop;
    private chunkProcessor;
    private chunkProcessor_simple;
    private chunkProcessor_rms;
    private discardAudio;
    addTool(definition: any, handler: (...args: any[]) => Promise<any>): void;
    /**
     * クライアントの初期設定を行います
     */
    private initializeClient;
    /**
     * インストラクションを更新します
     * @param {string} newInstructions 新しいインストラクション
     */
    updateInstructions(newInstructions: string): void;
    /**
     * 音声入力デバイスを変更します
     * @param {string} deviceId オーディオ入力デバイスのID
     */
    changeInputDevice(deviceId: string): Promise<void>;
    /**
     * 音声出力デバイスを変更します
     * @param {string} deviceId オーディオ出力デバイスのID
     */
    changeOutputDevice(deviceId: string): Promise<void>;
    /**
     * 会話に接続します
     * @param {string} deviceId オーディオ入力デバイスのID
     */
    connectConversation(deviceId: string): Promise<void>;
    /**
     * 会話を切断します
     */
    disconnectConversation(): Promise<void>;
    /**
     * テキストメッセージを送信します
     * @param {string} text 送信するテキストメッセージ
     */
    sendTextMessage(text: string): void;
    /**
     * プッシュ・トゥ・トークモードで録音を開始します
     */
    startRecording(): Promise<void>;
    /**
     * プッシュ・トゥ・トークモードで録音を停止します
     */
    stopRecording(): Promise<void>;
    /**
     * 録音を中断します
     */
    interruptRecording(): Promise<void>;
    /**
     * 手動モードとVADモードの間で通信方法を切り替えます
     */
    changeTurnEndType(value: 'none' | 'server_vad'): Promise<boolean>;
    /**
     * 会話項目を削除します
     */
    deleteConversationItem(id: string): Promise<void>;
    /**
     * 音声の視覚化データを取得します
     */
    getVisualizationData(): {
        clientData: any;
        serverData: any;
    };
    /**
     * 現在のターン検出モードを取得します
     * @returns {'manual' | 'vad'} 現在のモード
     */
    getCurrentMode(): 'manual' | 'vad';
}
export {};
//# sourceMappingURL=TalkHelper.d.ts.map