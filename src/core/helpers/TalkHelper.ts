// TalkHelper.ts

/**
 * このファイルでは、リアルタイムの音声処理やクライアントとの通信を行うクラスを定義します。
 * Reactの機能を使用せず、サーバーサイドでも使用できるように実装しています。
 * 設定は type: module を使用しています。
 */
import axios from 'axios';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { WavRecorder, WavStreamPlayer } from '../../libs/wavtools/index.js';
import { instructions } from '../../libs/utils/conversation_config.js';

// イベントを管理するためのEventEmitterを使用
import { EventEmitter } from 'events';
import ToolsHelper from './ToolsHelper.js';

interface TalkHelperOptions {
  apiKey: string;
  relayServer?: string;
  customInstructions?: string;
}

interface ChunkData {
  mono: Int16Array;
  raw: Int16Array;
}

interface TrackSampleOffset {
  trackId: string;
  offset: number;
}

interface RealtimeEvent {
  event: {
    type: string;
  };
  count?: number;
}

/**
 * TalkHelperクラスは、リアルタイム音声処理とクライアント通信の機能を提供します。
 */
export default class TalkHelper extends EventEmitter 
{
  private instructions: string;
  private tools: ToolsHelper;
  private apiKey: string;
  private USE_LOCAL_RELAY_SERVER_URL: string;
  private wavRecorder: WavRecorder;
  private wavStreamPlayer: WavStreamPlayer;
  private client: RealtimeClient;
  private _keepBuffers: any[];
  private items: any[];
  private realtimeEvents: RealtimeEvent[];
  private memoryKv: Record<string, any>;
  private isTalking: boolean;
  private lastSoundTime: number | null;
  private maxSilenceDuration: number;
  private silenceThreshold: number;
  private noiseStartTime: number | null;
  private minNoiseDuration: number;

  constructor({ apiKey, relayServer='', customInstructions='' }: TalkHelperOptions) 
  {
    super();

    this.instructions = customInstructions || instructions;

    this.tools = new ToolsHelper(false, false, []);
    // this.tools.addFunction(new YahooNews());

    // インスタンス変数の初期化
    this.apiKey = apiKey;
    this.USE_LOCAL_RELAY_SERVER_URL = relayServer;

    // WavRecorder（音声入力）とWavStreamPlayer（音声出力）のインスタンスを作成
    this.wavRecorder = new WavRecorder({ sampleRate: 24000 });
    this.wavStreamPlayer = new WavStreamPlayer({ sampleRate: 24000 });
    this.setupWavStreamPlayerListeners();

    // RealtimeClientのインスタンスを作成
    this.client = new RealtimeClient(
      this.USE_LOCAL_RELAY_SERVER_URL
        ? { url: this.USE_LOCAL_RELAY_SERVER_URL }
        : {
            apiKey: this.apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    );

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

  private setupWavStreamPlayerListeners(): void {
    this.wavStreamPlayer.addEventListener('connect', this.onConnect);
    this.wavStreamPlayer.addEventListener('disconnect', this.onDisconnect);
    this.wavStreamPlayer.addEventListener('interrupt', this.onInterrupt);
    this.wavStreamPlayer.addEventListener('resume', this.onResume);
    this.wavStreamPlayer.addEventListener('error', this.onError);
    this.wavStreamPlayer.addEventListener('start', this.onStart);
    this.wavStreamPlayer.addEventListener('stop', this.onStop);
  }

  private onConnect = (): void => {
    console.log('音声出力が接続されました');
    this.emit('connect');
  }

  private onDisconnect = (): void => {
    console.log('音声出力が切断されました');
    this.emit('disconnect');
  }

  private onInterrupt = (): void => {
    console.log('音声出力が中断されました');
    this.emit('interrupt');
  }

  private onResume = (): void => {
    console.log('音声出力が再開されました');
    this.emit('resume');
  }

  private onError = (error: Error): void => {
    console.error('音声出力エラー:', error);
    this.emit('error', error);
  }

  private onStart = (): void => {
    console.log('音声出力が開始されました');
    this.emit('start');
  }

  private onStop = (): void => {
    console.log('音声出力が停止されました');
    this.emit('stop');
  }

  private chunkProcessor = (data: ChunkData): void => 
  {
    return this.chunkProcessor_simple(data);
  }

  private chunkProcessor_simple = (data: ChunkData): void => 
  {
    try
    {
      this.client.appendInputAudio(data.mono);
    }
    catch (error)
    {
      console.warn('音声入力エラー:', error);
      // this.emit('error', error);
    }
  }
  private chunkProcessor_rms = (data: ChunkData): void => 
  {
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
    } else {
      // 無音が検出された
      if (this.isTalking) {
        this.noiseStartTime = null;
        if (now - (this.lastSoundTime || 0) > this.maxSilenceDuration) {
          // 最大無音期間を超えた場合、会話終了と判断
          this.isTalking = false;
          this.discardAudio();
        }
      } else {
        // まだ会話が始まっていない場合、短い無音期間でキャンセル
        if (!this.noiseStartTime) {
          this.noiseStartTime = now;
        } else if (now - this.noiseStartTime > this.minNoiseDuration) {
          // 最小雑音期間を超えても音声が検出されない場合、キャンセル
          this.discardAudio();
          this.noiseStartTime = null;
        }
      }
    }
  }

  private discardAudio(): void {
    console.log('音声入力をキャンセルまたは終了します');
    // 音声バッファをクリア
    this.client.realtime.send('input_audio_buffer.clear', {});
    // 必要であれば、ここで会話終了のシグナルを送信するなどの処理を追加
    this.emit('silenceDetected');
  }

  public addTool(definition: any, handler: (...args: any[]) => Promise<any>): void {
    this.client.addTool(definition, handler);
  }

  /**
   * クライアントの初期設定を行います
   */
  private initializeClient(): void {
    const client = this.client;

    // 指示を設定
    client.updateSession({ instructions: this.instructions });
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
    client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
      const lastEvent = this.realtimeEvents[this.realtimeEvents.length - 1];
      if (lastEvent && lastEvent.event.type === realtimeEvent.event.type) {
        // 同じイベントが連続して受信された場合、表示のために集約
        lastEvent.count = (lastEvent.count || 0) + 1;
        this.realtimeEvents[this.realtimeEvents.length - 1] = lastEvent;
      } else {
        this.realtimeEvents.push(realtimeEvent);
      }
      // イベントが更新されたことを通知
      this.emit('realtimeEventsUpdated', this.realtimeEvents);
    });

    client.on('error', (event: any) => console.error(event));

    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await this.wavStreamPlayer.interrupt();
      if (trackSampleOffset && trackSampleOffset.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });

    client.on('conversation.updated', async ({ item, delta }: { item: any, delta: any }) => {
      if (delta && delta.audio) {
        this.wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (
        item.status === 'completed' &&
        item.formatted.audio &&
        item.formatted.audio.length
      ) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        );
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
  public updateInstructions(newInstructions: string): void {
    // console.log('updateInstructions >>>', newInstructions);
    this.instructions = newInstructions;

    this.tools.applyTalkTools(this);
    console.log('applyTalkTools');
    
    this.client.updateSession({ 
      instructions: this.instructions,
    });
  }

  /**
   * 音声入力デバイスを変更します
   * @param {string} deviceId オーディオ入力デバイスのID
   */
  public async changeInputDevice(deviceId: string): Promise<void> {
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
      } else {
        // 手動モードの場合の処理（必要に応じて）
      }
    } catch (error) {
      console.error('音声入力デバイスの変更に失敗しました:', error);
      // 必要に応じてユーザーにエラーを通知
    }
  }

  /**
   * 音声出力デバイスを変更します
   * @param {string} deviceId オーディオ出力デバイスのID
   */
  public async changeOutputDevice(deviceId: string): Promise<void> {
    // 影響範囲が大きそうなので、いったん保留
    // await this.wavStreamPlayer.changeOutputDevice(deviceId);
  }

  /**
   * 会話に接続します
   * @param {string} deviceId オーディオ入力デバイスのID
   */
  public async connectConversation(deviceId: string): Promise<void> {
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
  public async disconnectConversation(): Promise<void> {
    const client = this.client;
    client.disconnect();

    await this.wavRecorder.end();
    await this.wavStreamPlayer.interrupt();
  }

  /**
   * テキストメッセージを送信します
   * @param {string} text 送信するテキストメッセージ
   */
  public sendTextMessage(text: string): void {
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
  public async startRecording(): Promise<void> {
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
  public async stopRecording(): Promise<void> {
    const client = this.client;
    await this.wavRecorder.pause();
    if (this.isTalking)
    {
      this.isTalking = false;
      client.createResponse();
    }
  }

  /**
   * 録音を中断します
   */
  public async interruptRecording(): Promise<void> {
    await this.wavRecorder.pause();
  }

  /**
   * 手動モードとVADモードの間で通信方法を切り替えます
   */
  public async changeTurnEndType(value: 'none' | 'server_vad'): Promise<boolean> {
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
  public async deleteConversationItem(id: string): Promise<void> {
    const client = this.client;
    client.deleteItem(id);
    this.items = client.conversation.getItems();
    // 会話アイテムが更新されたことを通知
    this.emit('itemsUpdated', this.items);
  }

  /**
   * 音声の視覚化データを取得します
   */
  public getVisualizationData(): { clientData: any, serverData: any } {
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
  public getCurrentMode(): 'manual' | 'vad' {
    const turnDetectionType = this.client.getTurnDetectionType();
    return turnDetectionType === 'server_vad' ? 'vad' : 'manual';
  }
}
