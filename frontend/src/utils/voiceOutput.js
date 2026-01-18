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
            if (voices.length > 0) {
                // Prefer a natural sounding English voice
                this.voice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google')) ||
                    voices.find(v => v.lang.includes('en')) ||
                    voices[0];
            }
        };

        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }

        // Initial load attempt
        loadVoices();

        // Polling fallback for some browsers where onvoiceschanged might not fire reliably
        const interval = setInterval(() => {
            if (this.voice) {
                clearInterval(interval);
                return;
            }
            loadVoices();
        }, 500);
    }

    speak(text, onEnd = () => { }) {
        if (!this.synth) return;

        // Cancel any ongoing speech
        this.synth.cancel();
        // Force resume in case it was paused (e.g., by user interaction or another app)
        this.synth.resume();

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
