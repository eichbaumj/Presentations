/**
 * CYPHER ARENA - Configuration
 * MWA201 Malware Analysis Training
 */

const CONFIG = {
    // Game Settings
    TOTAL_ROUNDS: 15,
    STARTING_HP: 6,
    MAX_COMBO: 10,

    // Timing (ms)
    ROUND_DELAY: 2000,          // Delay between rounds
    FEEDBACK_DURATION: 1500,     // How long to show feedback
    WRONG_ANSWER_COOLDOWN: 500,  // Cooldown after wrong answer

    // Scoring
    BASE_POINTS: 100,
    COMBO_MULTIPLIER: 50,        // Additional points per combo level
    TIME_BONUS_THRESHOLD: 5000,  // Under 5 seconds = time bonus
    TIME_BONUS_POINTS: 50,
    SPEED_DEMON_THRESHOLD: 2000, // Under 2 seconds for achievement

    // Difficulty Progression (round ranges)
    DIFFICULTY: {
        // Rounds 1-3: ROT13 only, easy words
        EASY: { rounds: [1, 3], encodings: ['rot13'], difficulty: 'easy' },
        // Rounds 4-6: ROT13 + Hex
        MEDIUM_LOW: { rounds: [4, 6], encodings: ['rot13', 'hex'], difficulty: 'easy' },
        // Rounds 7-9: ROT13 + Hex + Base64 + URL
        MEDIUM: { rounds: [7, 9], encodings: ['rot13', 'hex', 'base64', 'url'], difficulty: 'medium' },
        // Rounds 10-12: All encodings including XOR
        MEDIUM_HIGH: { rounds: [10, 12], encodings: ['rot13', 'hex', 'base64', 'url', 'xor'], difficulty: 'medium' },
        // Rounds 13-15: All encodings, hard phrases
        HARD: { rounds: [13, 15], encodings: ['rot13', 'hex', 'base64', 'url', 'xor'], difficulty: 'hard' }
    },

    // Power-ups
    POWERUPS: {
        HINT: { name: 'Hint', icon: '💡', startCount: 1, revealChars: 2 },
        SKIP: { name: 'Skip', icon: '⏭️', startCount: 2 },
        FREEZE: { name: 'Freeze', icon: '🧊', duration: 3000, comboRequired: 2 },
        SCRAMBLE: { name: 'Scramble', icon: '🔀', duration: 2000, comboRequired: 3 },
        SHIELD: { name: 'Shield', icon: '🛡️', timeRequired: 3000 }
    },

    // Achievements
    ACHIEVEMENTS: {
        FIRST_BLOOD: {
            id: 'first_blood',
            name: 'First Blood',
            description: 'Win your first match',
            icon: '🩸'
        },
        PERFECT: {
            id: 'perfect',
            name: 'Perfect',
            description: 'Complete practice without losing HP',
            icon: '⭐'
        },
        SPEED_DEMON: {
            id: 'speed_demon',
            name: 'Speed Demon',
            description: 'Decode in under 2 seconds',
            icon: '⚡'
        },
        ROT13_MASTER: {
            id: 'rot13_master',
            name: 'ROT13 Master',
            description: '10 consecutive ROT13 decodes',
            icon: '🔐'
        },
        COMEBACK_KID: {
            id: 'comeback_kid',
            name: 'Comeback Kid',
            description: 'Win with 1 HP remaining',
            icon: '🔥'
        },
        VETERAN: {
            id: 'veteran',
            name: 'Veteran',
            description: 'Play 25 practice sessions',
            icon: '🎖️'
        },
        CHAMPION: {
            id: 'champion',
            name: 'Champion',
            description: 'Complete 10 practice sessions',
            icon: '🏆'
        },
        DECODER: {
            id: 'decoder',
            name: 'Decoder',
            description: 'Decode 100 strings total',
            icon: '🔓'
        },
        STREAK_5: {
            id: 'streak_5',
            name: 'On Fire',
            description: 'Get a 5x combo',
            icon: '🔥'
        },
        ALL_ENCODINGS: {
            id: 'all_encodings',
            name: 'Polyglot',
            description: 'Successfully decode all encoding types',
            icon: '🌐'
        }
    },

    // Supabase Configuration
    SUPABASE: {
        URL: 'https://kolmyvbgbbwjysafqbmj.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbG15dmJnYmJ3anlzYWZxYm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDE4MjEsImV4cCI6MjA4MTAxNzgyMX0.qtLKRkTf3oX5sTiXkg1tWrva2vJJTAZ4wKiEenX0E0w'
    },

    // Local Storage Keys
    STORAGE: {
        USERNAME: 'cypher_arena_username',
        STATS: 'cypher_arena_stats',
        ACHIEVEMENTS: 'cypher_arena_achievements',
        SETTINGS: 'cypher_arena_settings'
    }
};

// Default settings
const DEFAULT_SETTINGS = {
    volume: 50,
    sfxEnabled: true,
    musicEnabled: true,
    animationsEnabled: true,
    difficulty: 'normal'
};

// Default stats
const DEFAULT_STATS = {
    totalWins: 0,
    totalLosses: 0,
    totalPoints: 0,
    totalDecodes: 0,
    totalSessions: 0,
    bestCombo: 0,
    fastestDecode: Infinity,
    encodingsDecoded: {
        rot13: 0,
        hex: 0,
        base64: 0,
        url: 0,
        xor: 0
    }
};

// Freeze config to prevent accidental modification
Object.freeze(CONFIG);
Object.freeze(DEFAULT_SETTINGS);
Object.freeze(DEFAULT_STATS);
