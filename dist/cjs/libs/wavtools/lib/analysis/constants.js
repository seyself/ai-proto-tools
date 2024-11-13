"use strict";
/**
 * Constants for help with visualization
 * Helps map frequency ranges from Fast Fourier Transform
 * to human-interpretable ranges, notably music ranges and
 * human vocal ranges.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceFrequencyLabels = exports.voiceFrequencies = exports.noteFrequencyLabels = exports.noteFrequencies = void 0;
// Eighth octave frequencies
const octave8Frequencies = [
    4186.01, 4434.92, 4698.63, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93,
    6644.88, 7040.0, 7458.62, 7902.13,
];
// Labels for each of the above frequencies
const octave8FrequencyLabels = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
];
/**
 * All note frequencies from 1st to 8th octave
 * in format "A#8" (A#, 8th octave)
 */
exports.noteFrequencies = [];
exports.noteFrequencyLabels = [];
for (let i = 1; i <= 8; i++) {
    for (let f = 0; f < octave8Frequencies.length; f++) {
        const freq = octave8Frequencies[f];
        exports.noteFrequencies.push(freq / Math.pow(2, 8 - i));
        exports.noteFrequencyLabels.push(octave8FrequencyLabels[f] + i);
    }
}
/**
 * Subset of the note frequencies between 32 and 2000 Hz
 * 6 octave range: C1 to B6
 */
const voiceFrequencyRange = [32.0, 2000.0];
exports.voiceFrequencies = exports.noteFrequencies.filter((_, i) => {
    return (exports.noteFrequencies[i] > voiceFrequencyRange[0] &&
        exports.noteFrequencies[i] < voiceFrequencyRange[1]);
});
exports.voiceFrequencyLabels = exports.noteFrequencyLabels.filter((_, i) => {
    return (exports.noteFrequencies[i] > voiceFrequencyRange[0] &&
        exports.noteFrequencies[i] < voiceFrequencyRange[1]);
});
