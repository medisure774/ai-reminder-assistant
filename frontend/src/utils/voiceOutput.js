/**
 * Web Speech API - Speech Synthesis (Text to Speech)
 */
class VoiceOutput {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;

        // Load voices
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            // Prefer a natural sounding English voice
            this.voice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google')) ||
                voices.find(v => v.lang.includes('en')) ||
                voices[0];
        };

        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
        loadVoices();
    }

    speak(text, onEnd = () => { }) {
        if (!this.synth) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;

        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        utterance.volume = 1.0;

        utterance.onend = onEnd;
        utterance.onerror = (err) => {
            console.error("Speech Synthesis Error:", err);
            onEnd();
        };

        this.synth.speak(utterance);
    }

    stop() {
        if (this.synth) this.synth.cancel();
    }
}

export const voiceOutput = new VoiceOutput();
export default voiceOutput;
