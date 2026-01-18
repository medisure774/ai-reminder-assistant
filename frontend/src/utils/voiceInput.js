/**
 * Web Speech API - Speech Recognition (Speech to Text)
 */
class VoiceInput {
    constructor() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API not supported in this browser.");
            this.supported = false;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.supported = true;
    }

    start(onResult, onError, onEnd) {
        if (!this.supported) {
            onError("Speech recognition not supported");
            return;
        }

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            onError(event.error);
        };

        this.recognition.onend = () => {
            if (onEnd) onEnd();
        };

        try {
            this.recognition.start();
        } catch (err) {
            console.error("Failed to start recognition:", err);
            onError(err.message);
        }
    }

    stop() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }
}

export const voiceInput = new VoiceInput();
export default voiceInput;
