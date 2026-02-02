class AudioEngine {
    private ctx: AudioContext | null = null;

    private init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Quick mechanical tick for typing
    playTick() {
        this.playTone(800, 'square', 0.05, 0.02);
    }

    // Dramatic match found sound
    playMatch() {
        this.playTone(400, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.2, 0.05), 50);
    }

    // Deep scan thrum
    playScan() {
        this.playTone(100, 'sawtooth', 0.8, 0.05);
    }

    // Error/Empty sound
    playError() {
        this.playTone(150, 'triangle', 0.3, 0.05);
    }

    playBoot() {
        this.playTone(200, 'sawtooth', 0.5, 0.05);
        setTimeout(() => this.playTone(400, 'square', 0.2, 0.03), 200);
    }

    playGlitch() {
        this.playTone(Math.random() * 1000, 'square', 0.05, 0.01);
    }
}

export const audioEngine = new AudioEngine();
