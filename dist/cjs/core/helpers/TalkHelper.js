"use strict";
// TalkHelper.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const realtime_api_beta_1 = require("@openai/realtime-api-beta");
const index_js_1 = require("../../libs/wavtools/index.js");
const conversation_config_js_1 = require("../../libs/utils/conversation_config.js");
// イベントを管理するためのEventEmitterを使用
const events_1 = require("events");
const ToolsHelper_js_1 = __importDefault(require("./ToolsHelper.js"));
/**
 * TalkHelperクラスは、リアルタイム音声処理とクライアント通信の機能を提供します。
 */
class TalkHelper extends events_1.EventEmitter {
    constructor({ apiKey, relayServer = '', customInstructions = '', voice = 'alloy' }) {
        super();
        this.onConnect = () => {
            console.log('音声出力が接続されました');
            this.emit('connect');
        };
        this.onDisconnect = () => {
            console.log('音声出力が切断されました');
            this.emit('disconnect');
        };
        this.onInterrupt = () => {
            console.log('音声出力が中断されました');
            this.emit('interrupt');
        };
        this.onResume = () => {
            console.log('音声出力が再開されました');
            this.emit('resume');
        };
        this.onError = (error) => {
            console.error('音声出力エラー:', error);
            this.emit('error', error);
        };
        this.onStart = () => {
            console.log('音声出力が開始されました');
            this.emit('start');
        };
        this.onStop = () => {
            console.log('音声出力が停止されました');
            this.emit('stop');
        };
        this.chunkProcessor = (data) => {
            return this.chunkProcessor_simple(data);
        };
        this.chunkProcessor_simple = (data) => {
            try {
                this.client.appendInputAudio(data.mono);
            }
            catch (error) {
                console.warn('音声入力エラー:', error);
                // this.emit('error', error);
            }
        };
        this.chunkProcessor_rms = (data) => {
            // data.mono (ArrayBuffer) を Int16Array に変換
            const int16Data = new Int16Array(data.mono);
            // RMS値を計算
            let sumSquares = 0;
            for (let i = 0; i < int16Data.length; i++) {
                // Int16を -1.0 から 1.0 の範囲に正規化
                const sample = int16Data[i] / 32768;
                sumSquares += sample * sample;
            }
            const rms = Math.sqrt(sumSquares / int16Data.length);
            const now = Date.now();
            // 音声データを即座に送信
            this.client.appendInputAudio(data.mono);
            if (rms > this.silenceThreshold) {
                // 音声が検出された
                this.lastSoundTime = now;
                this.isTalking = true;
                this.noiseStartTime = null;
            }
            else {
                // 無音が検出された
                if (this.isTalking) {
                    this.noiseStartTime = null;
                    if (now - (this.lastSoundTime || 0) > this.maxSilenceDuration) {
                        // 最大無音期間を超えた場合、会話終了と判断
                        this.isTalking = false;
                        this.discardAudio();
                    }
                }
                else {
                    // まだ会話が始まっていない場合、短い無音期間でキャンセル
                    if (!this.noiseStartTime) {
                        this.noiseStartTime = now;
                    }
                    else if (now - this.noiseStartTime > this.minNoiseDuration) {
                        // 最小雑音期間を超えても音声が検出されない場合、キャンセル
                        this.discardAudio();
                        this.noiseStartTime = null;
                    }
                }
            }
        };
        this.instructions = customInstructions || conversation_config_js_1.instructions;
        this.voice = voice;
        this.tools = new ToolsHelper_js_1.default(false, false, []);
        // this.tools.addFunction(new YahooNews());
        // インスタンス変数の初期化
        this.apiKey = apiKey;
        this.USE_LOCAL_RELAY_SERVER_URL = relayServer;
        // WavRecorder（音声入力）とWavStreamPlayer（音声出力）のインスタンスを作成
        this.wavRecorder = new index_js_1.WavRecorder({ sampleRate: 24000 });
        this.wavStreamPlayer = new index_js_1.WavStreamPlayer({ sampleRate: 24000 });
        this.setupWavStreamPlayerListeners();
        // RealtimeClientのインスタンスを作成
        this.client = new realtime_api_beta_1.RealtimeClient(this.USE_LOCAL_RELAY_SERVER_URL
            ? { url: this.USE_LOCAL_RELAY_SERVER_URL }
            : {
                apiKey: this.apiKey,
                dangerouslyAllowAPIKeyInBrowser: true,
            });
        this._keepBuffers = [];
        // 状態変数の初期化
        this.items = [];
        this.realtimeEvents = [];
        this.memoryKv = {};
        // 無音検出用の変数を更新
        this.isTalking = false;
        this.lastSoundTime = null;
        this.maxSilenceDuration = 5000; // 5秒
        this.silenceThreshold = 0.03; // 音量レベルのしきい値（適宜調整してください）
        // 雑音検出用の変数を追加
        this.noiseStartTime = null;
        this.minNoiseDuration = 3000; // 300ミリ秒未満の雑音は無視する
        // クライアントの初期設定を行う
        this.initializeClient();
    }
    setupWavStreamPlayerListeners() {
        this.wavStreamPlayer.addEventListener('connect', this.onConnect);
        this.wavStreamPlayer.addEventListener('disconnect', this.onDisconnect);
        this.wavStreamPlayer.addEventListener('interrupt', this.onInterrupt);
        this.wavStreamPlayer.addEventListener('resume', this.onResume);
        this.wavStreamPlayer.addEventListener('error', this.onError);
        this.wavStreamPlayer.addEventListener('start', this.onStart);
        this.wavStreamPlayer.addEventListener('stop', this.onStop);
    }
    discardAudio() {
        console.log('音声入力をキャンセルまたは終了します');
        // 音声バッファをクリア
        this.client.realtime.send('input_audio_buffer.clear', {});
        // 必要であれば、ここで会話終了のシグナルを送信するなどの処理を追加
        this.emit('silenceDetected');
    }
    addTool(definition, handler) {
        this.client.addTool(definition, handler);
    }
    /**
     * クライアントの初期設定を行います
     */
    initializeClient() {
        const client = this.client;
        // 指示を設定
        client.updateSession({ instructions: this.instructions, voice: this.voice });
        // 音声認識を設定
        client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });
        this.tools.applyTalkTools(this);
        // // ツールを追加
        // client.addTool(
        //   {
        //     name: 'get_schedule',
        //     description: 'MLBの試合スケジュールを取得します。',
        //     parameters: {
        //       type: 'object',
        //       properties: {},
        //       required: [],
        //     },
        //   },
        //   async ({ }) => {
        //     return { ok: true };
        //   }
        // );
        // クライアントとサーバーからのリアルタイムイベントを処理してイベントログに記録
        client.on('realtime.event', (realtimeEvent) => {
            const lastEvent = this.realtimeEvents[this.realtimeEvents.length - 1];
            if (lastEvent && lastEvent.event.type === realtimeEvent.event.type) {
                // 同じイベントが連続して受信された場合、表示のために集約
                lastEvent.count = (lastEvent.count || 0) + 1;
                this.realtimeEvents[this.realtimeEvents.length - 1] = lastEvent;
            }
            else {
                this.realtimeEvents.push(realtimeEvent);
            }
            // イベントが更新されたことを通知
            this.emit('realtimeEventsUpdated', this.realtimeEvents);
        });
        client.on('error', (event) => console.error(event));
        client.on('conversation.interrupted', async () => {
            const trackSampleOffset = await this.wavStreamPlayer.interrupt();
            if (trackSampleOffset && trackSampleOffset.trackId) {
                const { trackId, offset } = trackSampleOffset;
                await client.cancelResponse(trackId, offset);
            }
        });
        client.on('conversation.updated', async ({ item, delta }) => {
            if (delta && delta.audio) {
                this.wavStreamPlayer.add16BitPCM(delta.audio, item.id);
            }
            if (item.status === 'completed' &&
                item.formatted.audio &&
                item.formatted.audio.length) {
                const wavFile = await index_js_1.WavRecorder.decode(item.formatted.audio, 24000, 24000);
                item.formatted.file = wavFile;
            }
            this.items = client.conversation.getItems();
            // 会話アイテムが更新されたことを通知
            this.emit('itemsUpdated', this.items);
        });
        this.items = client.conversation.getItems();
    }
    /**
     * インストラクションを更新します
     * @param {string} newInstructions 新しいインストラクション
     */
    updateInstructions(newInstructions) {
        // console.log('updateInstructions >>>', newInstructions);
        this.instructions = newInstructions;
        this.tools.applyTalkTools(this);
        console.log('applyTalkTools');
        this.client.updateSession({
            instructions: this.instructions,
            voice: this.voice,
        });
    }
    setVoice(voice) {
        this.voice = voice;
        this.client.updateSession({ voice });
    }
    /**
     * 音声入力デバイスを変更します
     * @param {string} deviceId オーディオ入力デバイスのID
     */
    async changeInputDevice(deviceId) {
        try {
            // 現在の録音を停止
            if (this.wavRecorder.recording) {
                await this.wavRecorder.pause();
            }
            await this.wavRecorder.quit();
            // 新しいデバイスでwavRecorderを初期化
            await this.wavRecorder.begin(deviceId);
            // 録音を再開
            if (this.client.getTurnDetectionType() === 'server_vad') {
                await this.wavRecorder.record(this.chunkProcessor);
            }
            else {
                // 手動モードの場合の処理（必要に応じて）
            }
        }
        catch (error) {
            console.error('音声入力デバイスの変更に失敗しました:', error);
            // 必要に応じてユーザーにエラーを通知
        }
    }
    /**
     * 音声出力デバイスを変更します
     * @param {string} deviceId オーディオ出力デバイスのID
     */
    async changeOutputDevice(deviceId) {
        // 影響範囲が大きそうなので、いったん保留
        // await this.wavStreamPlayer.changeOutputDevice(deviceId);
    }
    /**
     * 会話に接続します
     * @param {string} deviceId オーディオ入力デバイスのID
     */
    async connectConversation(deviceId) {
        const client = this.client;
        // マイクに接続
        await this.wavRecorder.begin(deviceId);
        // 音声出力に接続
        await this.wavStreamPlayer.connect();
        // リアルタイムAPIに接続
        await client.connect();
        // this.sendTextMessage('Hello!');
        if (client.getTurnDetectionType() === 'server_vad') {
            await this.wavRecorder.record(this.chunkProcessor);
        }
    }
    /**
     * 会話を切断します
     */
    async disconnectConversation() {
        const client = this.client;
        client.disconnect();
        await this.wavRecorder.end();
        await this.wavStreamPlayer.interrupt();
    }
    /**
     * テキストメッセージを送信します
     * @param {string} text 送信するテキストメッセージ
     */
    sendTextMessage(text) {
        const client = this.client;
        if (client.isConnected()) {
            client.sendUserMessageContent([
                {
                    type: `input_text`,
                    text: text,
                },
            ]);
        }
    }
    /**
     * プッシュ・トゥ・トークモードで録音を開始します
     */
    async startRecording() {
        const client = this.client;
        if (this.wavRecorder.recording) {
            await this.wavRecorder.pause();
        }
        const trackSampleOffset = await this.wavStreamPlayer.interrupt();
        if (trackSampleOffset && trackSampleOffset.trackId) {
            const { trackId, offset } = trackSampleOffset;
            await client.cancelResponse(trackId, offset);
        }
        await this.wavRecorder.record(this.chunkProcessor);
    }
    /**
     * プッシュ・トゥ・トークモードで録音を停止します
     */
    async stopRecording() {
        const client = this.client;
        await this.wavRecorder.pause();
        if (this.isTalking) {
            this.isTalking = false;
            client.createResponse();
        }
    }
    /**
     * 録音を中断します
     */
    async interruptRecording() {
        await this.wavRecorder.pause();
    }
    /**
     * 手動モードとVADモードの間で通信方法を切り替えます
     */
    async changeTurnEndType(value) {
        const client = this.client;
        if (value === 'none' && this.wavRecorder.getStatus() === 'recording') {
            await this.wavRecorder.pause();
        }
        client.updateSession({
            turn_detection: value === 'none' ? null : { type: 'server_vad' },
        });
        if (value === 'server_vad' && client.isConnected()) {
            // await this.wavRecorder.record((data) => client.appendInputAudio(data.mono));
            await this.startRecording();
        }
        return value === 'none';
    }
    /**
     * 会話項目を削除します
     */
    async deleteConversationItem(id) {
        const client = this.client;
        client.deleteItem(id);
        this.items = client.conversation.getItems();
        // 会話アイテムが更新されたことを通知
        this.emit('itemsUpdated', this.items);
    }
    /**
     * 音声の視覚化データを取得します
     */
    getVisualizationData() {
        const clientData = this.wavRecorder.recording
            ? this.wavRecorder.getFrequencies('voice')
            : { values: new Float32Array([0]) };
        const serverData = this.wavStreamPlayer.analyser
            ? this.wavStreamPlayer.getFrequencies('voice')
            : { values: new Float32Array([0]) };
        return { clientData, serverData };
    }
    /**
     * 現在のターン検出モードを取得します
     * @returns {'manual' | 'vad'} 現在のモード
     */
    getCurrentMode() {
        const turnDetectionType = this.client.getTurnDetectionType();
        return turnDetectionType === 'server_vad' ? 'vad' : 'manual';
    }
}
exports.default = TalkHelper;
