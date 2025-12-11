/**
 * CYPHER ARENA - Audio Manager
 * MWA201 Malware Analysis Training
 *
 * Generates synthetic sounds using Web Audio API
 * (No external audio files needed!)
 */

const AudioManager = {
    context: null,
    masterGain: null,
    enabled: true,
    volume: 0.5,

    /**
     * Initialize the audio system
     */
    init: function() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.setVolume(this.volume);
            console.log('[Audio] Initialized');
        } catch (e) {
            console.warn('[Audio] Web Audio API not supported:', e);
            this.enabled = false;
        }
    },

    /**
     * Resume audio context (needed after user interaction)
     */
    resume: function() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    },

    /**
     * Set master volume
     * @param {number} value - Volume 0-1
     */
    setVolume: function(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    },

    /**
     * Enable/disable audio
     * @param {boolean} enabled
     */
    setEnabled: function(enabled) {
        this.enabled = enabled;
    },

    /**
     * Play a beep sound
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {string} type - Oscillator type: sine, square, sawtooth, triangle
     * @param {number} volume - Volume multiplier 0-1
     */
    beep: function(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.context) return;

        this.resume();

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        // Envelope
        const now = this.context.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    },

    /**
     * Play correct answer sound - ascending happy tone
     */
    playCorrect: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        // Play ascending arpeggio
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.beep(freq, 0.15, 'sine', 0.25);
            }, i * 80);
        });
    },

    /**
     * Play wrong answer sound - descending error tone
     */
    playWrong: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        // Buzzer sound
        this.beep(180, 0.3, 'square', 0.15);
        setTimeout(() => {
            this.beep(140, 0.2, 'square', 0.1);
        }, 100);
    },

    /**
     * Play damage/hit sound
     */
    playHit: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        // Impact sound
        this.beep(100, 0.1, 'sawtooth', 0.4);
        setTimeout(() => {
            this.beep(60, 0.15, 'square', 0.3);
        }, 50);
    },

    /**
     * Play power-up activation sound
     */
    playPowerup: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        // Sparkly ascending sound
        const notes = [392, 523.25, 659.25, 783.99, 1046.5]; // G4 to C6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.beep(freq, 0.1, 'sine', 0.2);
            }, i * 50);
        });
    },

    /**
     * Play victory fanfare
     */
    playVictory: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        // Victory melody
        const melody = [
            { freq: 523.25, dur: 0.15 },  // C5
            { freq: 659.25, dur: 0.15 },  // E5
            { freq: 783.99, dur: 0.15 },  // G5
            { freq: 1046.5, dur: 0.4 },   // C6
        ];

        let time = 0;
        melody.forEach((note) => {
            setTimeout(() => {
                this.beep(note.freq, note.dur, 'sine', 0.3);
            }, time);
            time += note.dur * 1000;
        });
    },

    /**
     * Play defeat sound
     */
    playDefeat: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        // Sad descending sound
        const notes = [392, 349.23, 293.66, 261.63]; // G4 to C4
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.beep(freq, 0.25, 'sine', 0.2);
            }, i * 200);
        });
    },

    /**
     * Play typing/keystroke sound
     */
    playKeystroke: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        // Quick click sound
        const freq = 1200 + Math.random() * 400;
        this.beep(freq, 0.02, 'square', 0.05);
    },

    /**
     * Play countdown tick
     */
    playTick: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        this.beep(800, 0.05, 'sine', 0.1);
    },

    /**
     * Play round start sound
     */
    playRoundStart: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        this.beep(440, 0.1, 'sine', 0.2);
        setTimeout(() => {
            this.beep(880, 0.15, 'sine', 0.25);
        }, 100);
    },

    /**
     * Play combo sound (higher pitch for higher combos)
     * @param {number} combo - Current combo count
     */
    playCombo: function(combo) {
        if (!this.enabled || !this.context) return;

        this.resume();

        const baseFreq = 600;
        const freq = baseFreq + (combo * 100);
        this.beep(Math.min(freq, 2000), 0.1, 'sine', 0.2);
    },

    /**
     * Play UI click sound
     */
    playClick: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        this.beep(1000, 0.03, 'sine', 0.1);
    },

    /**
     * Play notification sound
     */
    playNotification: function() {
        if (!this.enabled || !this.context) return;

        this.resume();

        this.beep(880, 0.1, 'sine', 0.15);
        setTimeout(() => {
            this.beep(1100, 0.1, 'sine', 0.15);
        }, 120);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    AudioManager.init();
});

// Resume on first user interaction
document.addEventListener('click', function() {
    AudioManager.resume();
}, { once: true });

// Make available globally
window.AudioManager = AudioManager;
