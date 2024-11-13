/**
 * Plays audio streams received in raw PCM16 chunks from the browser
 * @class
 */
export class WavStreamPlayer {
    /**
     * Creates a new WavStreamPlayer instance
     * @param {{sampleRate?: number}} options
     * @returns {WavStreamPlayer}
     */
    constructor({ sampleRate }?: {
        sampleRate?: number;
    });
    scriptSrc: any;
    sampleRate: number;
    context: AudioContext | null;
    stream: AudioWorkletNode | null;
    analyser: AnalyserNode | null;
    trackSampleOffsets: {};
    interruptedTrackIds: {};
    listeners: {
        start: never[];
        stop: never[];
        connect: never[];
        disconnect: never[];
        interrupt: never[];
        resume: never[];
        error: never[];
    };
    /**
     * Connects the audio context and enables output to speakers
     * @returns {Promise<true>}
     */
    connect(): Promise<true>;
    /**
     * Disconnects the audio context
     */
    disconnect(): void;
    /**
     * Gets the current frequency domain data from the playing track
     * @param {"frequency"|"music"|"voice"} [analysisType]
     * @param {number} [minDecibels] default -100
     * @param {number} [maxDecibels] default -30
     * @returns {import('./analysis/audio_analysis.js').AudioAnalysisOutputType}
     */
    getFrequencies(analysisType?: "voice" | "frequency" | "music" | undefined, minDecibels?: number | undefined, maxDecibels?: number | undefined): import("./analysis/audio_analysis.js").AudioAnalysisOutputType;
    /**
     * Starts audio streaming
     * @private
     * @returns {Promise<true>}
     */
    private _start;
    /**
     * Adds 16BitPCM data to the currently playing audio stream
     * You can add chunks beyond the current play point and they will be queued for play
     * @param {ArrayBuffer|Int16Array} arrayBuffer
     * @param {string} [trackId]
     * @returns {Int16Array}
     */
    add16BitPCM(arrayBuffer: ArrayBuffer | Int16Array, trackId?: string | undefined): Int16Array;
    /**
     * Gets the offset (sample count) of the currently playing stream
     * @param {boolean} [interrupt]
     * @returns {{trackId: string|null, offset: number, currentTime: number}}
     */
    getTrackSampleOffset(interrupt?: boolean | undefined): {
        trackId: string | null;
        offset: number;
        currentTime: number;
    };
    /**
     * Strips the current stream and returns the sample offset of the audio
     * @param {boolean} [interrupt]
     * @returns {{trackId: string|null, offset: number, currentTime: number}}
     */
    interrupt(): {
        trackId: string | null;
        offset: number;
        currentTime: number;
    };
    /**
     * Resumes playback after an interrupt
     */
    resume(): void;
    /**
     * Adds an event listener
     * @param {'start'|'stop'|'connect'|'disconnect'|'interrupt'|'resume'|'error'} event
     * @param {Function} callback
     */
    addEventListener(event: "start" | "stop" | "connect" | "disconnect" | "interrupt" | "resume" | "error", callback: Function): void;
    /**
     * Removes an event listener
     * @param {'start'|'stop'|'connect'|'disconnect'|'interrupt'|'resume'|'error'} event
     * @param {Function} callback
     */
    removeEventListener(event: "start" | "stop" | "connect" | "disconnect" | "interrupt" | "resume" | "error", callback: Function): void;
    /**
     * Emits an event
     * @private
     * @param {'start'|'stop'|'connect'|'disconnect'|'interrupt'|'resume'|'error'} event
     * @param {any} [data] - Optional data to pass to the event listeners
     */
    private _emit;
}
//# sourceMappingURL=wav_stream_player.d.ts.map