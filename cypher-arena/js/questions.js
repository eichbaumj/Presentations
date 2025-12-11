/**
 * CYPHER ARENA - Question Bank
 * MWA201 Malware Analysis Training
 *
 * 100+ malware-themed phrases organized by difficulty
 */

const QUESTIONS = {
    // Easy: Short words (4-8 characters)
    // Used in rounds 1-6
    easy: [
        // Malware Types
        { plain: "virus", category: "malware_type" },
        { plain: "worm", category: "malware_type" },
        { plain: "trojan", category: "malware_type" },
        { plain: "spyware", category: "malware_type" },
        { plain: "adware", category: "malware_type" },
        { plain: "botnet", category: "malware_type" },
        { plain: "rootkit", category: "malware_type" },
        { plain: "keylogger", category: "malware_type" },
        { plain: "ransomware", category: "malware_type" },
        { plain: "backdoor", category: "malware_type" },

        // Components & Tools
        { plain: "payload", category: "component" },
        { plain: "dropper", category: "component" },
        { plain: "loader", category: "component" },
        { plain: "packer", category: "component" },
        { plain: "crypter", category: "component" },
        { plain: "shell", category: "tool" },
        { plain: "exploit", category: "tool" },
        { plain: "scanner", category: "tool" },
        { plain: "sniffer", category: "tool" },
        { plain: "proxy", category: "tool" },

        // Actions & Behaviors
        { plain: "infect", category: "action" },
        { plain: "inject", category: "action" },
        { plain: "hook", category: "action" },
        { plain: "spawn", category: "action" },
        { plain: "beacon", category: "action" },
        { plain: "exfil", category: "action" },
        { plain: "pivot", category: "action" },
        { plain: "patch", category: "action" },
        { plain: "dump", category: "action" },
        { plain: "crack", category: "action" },

        // Security Terms
        { plain: "hash", category: "security" },
        { plain: "token", category: "security" },
        { plain: "cipher", category: "security" },
        { plain: "crypt", category: "security" },
        { plain: "encode", category: "security" },
        { plain: "decode", category: "security" },
        { plain: "obfuscate", category: "security" },
        { plain: "sandbox", category: "security" },
        { plain: "debug", category: "security" },
        { plain: "reverse", category: "security" },

        // Infrastructure
        { plain: "server", category: "infra" },
        { plain: "client", category: "infra" },
        { plain: "socket", category: "infra" },
        { plain: "port", category: "infra" },
        { plain: "tunnel", category: "infra" },
        { plain: "domain", category: "infra" },
        { plain: "callback", category: "infra" },
        { plain: "handler", category: "infra" }
    ],

    // Medium: Compound words and short phrases (8-16 characters)
    // Used in rounds 7-12
    medium: [
        // Malware Techniques
        { plain: "code injection", category: "technique" },
        { plain: "dll hijacking", category: "technique" },
        { plain: "process hollow", category: "technique" },
        { plain: "api hooking", category: "technique" },
        { plain: "registry key", category: "technique" },
        { plain: "scheduled task", category: "technique" },
        { plain: "service create", category: "technique" },
        { plain: "startup folder", category: "technique" },
        { plain: "file dropper", category: "technique" },
        { plain: "memory scraper", category: "technique" },

        // Attack Vectors
        { plain: "phishing email", category: "vector" },
        { plain: "drive by download", category: "vector" },
        { plain: "watering hole", category: "vector" },
        { plain: "usb infection", category: "vector" },
        { plain: "supply chain", category: "vector" },
        { plain: "social engineer", category: "vector" },
        { plain: "brute force", category: "vector" },
        { plain: "password spray", category: "vector" },
        { plain: "credential theft", category: "vector" },
        { plain: "zero day exploit", category: "vector" },

        // C2 & Communication
        { plain: "command server", category: "c2" },
        { plain: "control channel", category: "c2" },
        { plain: "dead drop", category: "c2" },
        { plain: "dns tunnel", category: "c2" },
        { plain: "http beacon", category: "c2" },
        { plain: "https callback", category: "c2" },
        { plain: "reverse shell", category: "c2" },
        { plain: "bind shell", category: "c2" },
        { plain: "web shell", category: "c2" },
        { plain: "icmp channel", category: "c2" },

        // Evasion
        { plain: "anti debug", category: "evasion" },
        { plain: "anti sandbox", category: "evasion" },
        { plain: "vm detection", category: "evasion" },
        { plain: "code signing", category: "evasion" },
        { plain: "timestomping", category: "evasion" },
        { plain: "living off land", category: "evasion" },
        { plain: "fileless attack", category: "evasion" },
        { plain: "process mask", category: "evasion" },
        { plain: "string encrypt", category: "evasion" },
        { plain: "api resolve", category: "evasion" },

        // Analysis Terms
        { plain: "static analysis", category: "analysis" },
        { plain: "dynamic test", category: "analysis" },
        { plain: "behavior log", category: "analysis" },
        { plain: "memory forensic", category: "analysis" },
        { plain: "network capture", category: "analysis" },
        { plain: "disk image", category: "analysis" },
        { plain: "file carving", category: "analysis" },
        { plain: "string extract", category: "analysis" },
        { plain: "import table", category: "analysis" },
        { plain: "export function", category: "analysis" }
    ],

    // Hard: Long phrases (16-30 characters)
    // Used in rounds 13-15
    hard: [
        // APT & Threat Actors
        { plain: "advanced persistent threat", category: "apt" },
        { plain: "nation state actor", category: "apt" },
        { plain: "cyber espionage group", category: "apt" },
        { plain: "threat intelligence feed", category: "apt" },
        { plain: "indicator of compromise", category: "apt" },
        { plain: "tactics techniques procedures", category: "apt" },
        { plain: "mitre attack framework", category: "apt" },
        { plain: "diamond model analysis", category: "apt" },
        { plain: "kill chain methodology", category: "apt" },
        { plain: "attribution analysis", category: "apt" },

        // Complex Techniques
        { plain: "privilege escalation vector", category: "technique" },
        { plain: "lateral movement technique", category: "technique" },
        { plain: "persistence mechanism setup", category: "technique" },
        { plain: "defense evasion method", category: "technique" },
        { plain: "credential access attack", category: "technique" },
        { plain: "data exfiltration channel", category: "technique" },
        { plain: "command and control server", category: "technique" },
        { plain: "initial access broker", category: "technique" },
        { plain: "execution guardrails check", category: "technique" },
        { plain: "environmental keying method", category: "technique" },

        // Malware Families
        { plain: "emotet banking trojan", category: "malware" },
        { plain: "trickbot modular malware", category: "malware" },
        { plain: "ryuk ransomware variant", category: "malware" },
        { plain: "cobalt strike beacon", category: "malware" },
        { plain: "mimikatz credential dump", category: "malware" },
        { plain: "metasploit framework shell", category: "malware" },
        { plain: "powershell empire agent", category: "malware" },
        { plain: "bloodhound active directory", category: "malware" },
        { plain: "lazagne password recovery", category: "malware" },
        { plain: "process hacker injection", category: "malware" },

        // Infrastructure & Operations
        { plain: "bulletproof hosting service", category: "infra" },
        { plain: "fast flux dns network", category: "infra" },
        { plain: "domain generation algorithm", category: "infra" },
        { plain: "traffic light protocol", category: "infra" },
        { plain: "operational security measure", category: "infra" },
        { plain: "encrypted communication channel", category: "infra" },
        { plain: "proxy chain anonymization", category: "infra" },
        { plain: "virtual private server", category: "infra" },
        { plain: "tor hidden service endpoint", category: "infra" },
        { plain: "peer to peer botnet mesh", category: "infra" },

        // Defense & Response
        { plain: "incident response procedure", category: "defense" },
        { plain: "threat hunting operation", category: "defense" },
        { plain: "security operations center", category: "defense" },
        { plain: "endpoint detection response", category: "defense" },
        { plain: "network intrusion detection", category: "defense" },
        { plain: "malware reverse engineering", category: "defense" },
        { plain: "digital forensics analysis", category: "defense" },
        { plain: "vulnerability assessment scan", category: "defense" },
        { plain: "penetration testing report", category: "defense" },
        { plain: "red team engagement rules", category: "defense" }
    ]
};

/**
 * Question Manager - handles question selection and tracking
 */
const QuestionManager = {
    usedQuestions: new Set(),

    /**
     * Get a random question based on round number
     * @param {number} round - Current round (1-15)
     * @returns {object} - { plain, encoded, encoding, key?, category }
     */
    getQuestion: function(round) {
        const diffConfig = this.getDifficultyForRound(round);
        const difficulty = diffConfig.difficulty;
        const encodings = diffConfig.encodings;

        // Select random encoding from available options
        const encoding = encodings[Math.floor(Math.random() * encodings.length)];

        // Get questions from appropriate difficulty pool
        const pool = QUESTIONS[difficulty];

        // Filter out recently used questions
        let available = pool.filter(q => !this.usedQuestions.has(q.plain));

        // Reset if we've used too many
        if (available.length < 5) {
            this.usedQuestions.clear();
            available = pool;
        }

        // Select random question
        const question = available[Math.floor(Math.random() * available.length)];
        this.usedQuestions.add(question.plain);

        // Encode the question
        const result = Encoder.encode(question.plain, encoding);

        return {
            plain: question.plain,
            encoded: result.encoded,
            encoding: encoding,
            key: result.key,
            category: question.category
        };
    },

    /**
     * Get difficulty configuration for a round
     * @param {number} round - Round number
     * @returns {object} - { encodings, difficulty }
     */
    getDifficultyForRound: function(round) {
        for (const key in CONFIG.DIFFICULTY) {
            const config = CONFIG.DIFFICULTY[key];
            if (round >= config.rounds[0] && round <= config.rounds[1]) {
                return config;
            }
        }
        // Default to hard if round exceeds defined ranges
        return CONFIG.DIFFICULTY.HARD;
    },

    /**
     * Get all questions for a specific difficulty
     * @param {string} difficulty - 'easy', 'medium', or 'hard'
     * @returns {array}
     */
    getQuestionsByDifficulty: function(difficulty) {
        return QUESTIONS[difficulty] || [];
    },

    /**
     * Get total question count
     * @returns {number}
     */
    getTotalQuestions: function() {
        return QUESTIONS.easy.length + QUESTIONS.medium.length + QUESTIONS.hard.length;
    },

    /**
     * Reset used questions tracker
     */
    reset: function() {
        this.usedQuestions.clear();
    }
};

// Make available globally
window.QUESTIONS = QUESTIONS;
window.QuestionManager = QuestionManager;
