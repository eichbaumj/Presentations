/**
 * CYPHER ARENA - UI Manager
 * MWA201 Malware Analysis Training
 *
 * Handles DOM manipulation, screen transitions, and UI updates
 */

const UI = {
    screens: {},
    currentScreen: null,

    /**
     * Initialize UI
     */
    init: function() {
        // Cache screen elements
        this.screens = {
            login: document.getElementById('screen-login'),
            menu: document.getElementById('screen-menu'),
            lobby: document.getElementById('screen-lobby'),
            duel: document.getElementById('screen-duel'),
            practice: document.getElementById('screen-practice'),
            results: document.getElementById('screen-results'),
            achievements: document.getElementById('screen-achievements'),
            settings: document.getElementById('screen-settings')
        };

        this.bindEvents();
        this.bindLobbyEvents();
        this.loadSettings();
        this.checkExistingUser();

        console.log('[UI] Initialized');
    },

    /**
     * Bind all UI event listeners
     */
    bindEvents: function() {
        // Login screen
        const btnLogin = document.getElementById('btn-login');
        const usernameInput = document.getElementById('username-input');

        btnLogin.addEventListener('click', () => this.handleLogin());
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Menu screen
        document.getElementById('btn-practice').addEventListener('click', () => {
            AudioManager.playClick();
            Game.startPractice();
        });

        document.getElementById('btn-multiplayer').addEventListener('click', () => {
            AudioManager.playClick();
            if (SupabaseClient.isAvailable()) {
                this.showLobby();
            } else {
                this.showNotification('Multiplayer unavailable - Supabase not configured');
            }
        });

        document.getElementById('btn-achievements').addEventListener('click', () => {
            AudioManager.playClick();
            this.showAchievements();
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            AudioManager.playClick();
            this.showScreen('settings');
        });

        document.getElementById('btn-logout').addEventListener('click', () => {
            AudioManager.playClick();
            this.handleLogout();
        });

        // Practice screen
        document.getElementById('btn-submit').addEventListener('click', () => {
            Game.submitAnswer();
        });

        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') Game.submitAnswer();
        });

        document.getElementById('answer-input').addEventListener('input', () => {
            AudioManager.playKeystroke();
        });

        document.getElementById('btn-quit-practice').addEventListener('click', () => {
            AudioManager.playClick();
            Game.quitPractice();
        });

        document.getElementById('btn-toggle-ref').addEventListener('click', () => {
            this.toggleReferenceTable();
        });

        // Power-ups
        document.getElementById('powerup-hint').addEventListener('click', () => {
            Game.usePowerup('hint');
        });

        document.getElementById('powerup-skip').addEventListener('click', () => {
            Game.usePowerup('skip');
        });

        // Results screen
        document.getElementById('btn-play-again').addEventListener('click', () => {
            AudioManager.playClick();
            Game.startPractice();
        });

        document.getElementById('btn-back-menu').addEventListener('click', () => {
            AudioManager.playClick();
            this.showScreen('menu');
        });

        // Achievements screen
        document.getElementById('btn-back-from-achievements').addEventListener('click', () => {
            AudioManager.playClick();
            this.showScreen('menu');
        });

        // Settings screen
        document.getElementById('btn-back-from-settings').addEventListener('click', () => {
            AudioManager.playClick();
            this.saveSettings();
            this.showScreen('menu');
        });

        document.getElementById('setting-volume').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('volume-value').textContent = value + '%';
            AudioManager.setVolume(value / 100);
        });

        document.getElementById('setting-sfx').addEventListener('change', (e) => {
            AudioManager.setEnabled(e.target.checked);
        });

        // Audio toggle button
        document.getElementById('btn-audio-toggle').addEventListener('click', () => {
            const btn = document.getElementById('btn-audio-toggle');
            const icon = document.getElementById('audio-icon');
            AudioManager.enabled = !AudioManager.enabled;

            if (AudioManager.enabled) {
                btn.classList.remove('muted');
                icon.innerHTML = '&#128266;';
            } else {
                btn.classList.add('muted');
                icon.innerHTML = '&#128263;';
            }
        });
    },

    /**
     * Bind lobby-related event listeners
     */
    bindLobbyEvents: function() {
        var self = this;

        // Create room button
        document.getElementById('btn-create-room').addEventListener('click', async function() {
            AudioManager.playClick();
            var room = await SupabaseClient.createRoom();
            if (room) {
                self.onRoomJoined(room);
            } else {
                self.showNotification('Failed to create room');
            }
        });

        // Join room button
        document.getElementById('btn-join-room').addEventListener('click', async function() {
            AudioManager.playClick();
            var code = document.getElementById('room-code-input').value.trim();
            if (code.length !== 6) {
                self.showNotification('Enter a 6-character room code');
                return;
            }
            var room = await SupabaseClient.joinRoom(code);
            if (room) {
                self.onRoomJoined(room);
            } else {
                self.showNotification('Room not found');
            }
        });

        // Room code input - auto uppercase
        document.getElementById('room-code-input').addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });

        // Leave room button
        document.getElementById('btn-leave-room').addEventListener('click', async function() {
            AudioManager.playClick();
            await SupabaseClient.leaveRoom();
            self.onRoomLeft();
        });

        // Back to menu button
        document.getElementById('btn-back-to-menu').addEventListener('click', function() {
            AudioManager.playClick();
            if (SupabaseClient.currentRoom) {
                SupabaseClient.leaveRoom();
            }
            self.showScreen('menu');
        });

        // Find match button
        document.getElementById('btn-find-match').addEventListener('click', async function() {
            AudioManager.playClick();
            document.getElementById('btn-find-match').classList.add('hidden');
            document.getElementById('matchmaking-status').classList.remove('hidden');

            var match = await SupabaseClient.findMatch();
            if (match) {
                self.startDuel(match);
            } else {
                // Keep searching - will be notified via realtime
                self.showNotification('Searching for opponent...');
            }
        });

        // Chat events
        document.getElementById('btn-send-chat').addEventListener('click', function() {
            self.sendChatMessage();
        });

        document.getElementById('chat-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') self.sendChatMessage();
        });

        // Duel screen events
        document.getElementById('btn-duel-submit').addEventListener('click', function() {
            if (typeof MultiplayerGame !== 'undefined') {
                MultiplayerGame.submitAnswer();
            }
        });

        document.getElementById('duel-answer-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && typeof MultiplayerGame !== 'undefined') {
                MultiplayerGame.submitAnswer();
            }
        });

        document.getElementById('duel-answer-input').addEventListener('input', function() {
            AudioManager.playKeystroke();
        });

        // Abandon match button
        document.getElementById('btn-abandon-match').addEventListener('click', function() {
            AudioManager.playClick();
            if (confirm('Are you sure you want to abandon this match?\n\nYou will forfeit the game and your opponent will win.')) {
                if (typeof MultiplayerGame !== 'undefined') {
                    MultiplayerGame.quitMatch();
                }
            }
        });
    },

    /**
     * Send a chat message
     */
    sendChatMessage: function() {
        var input = document.getElementById('chat-input');
        var message = input.value.trim();

        if (message && SupabaseClient.currentPlayer) {
            // Add message locally so sender sees their own message
            MultiplayerUI.onChatMessage({
                payload: {
                    username: SupabaseClient.currentPlayer.username,
                    message: message
                }
            });
            // Send to others via broadcast
            SupabaseClient.sendChatMessage(message);
            input.value = '';
        }
        input.focus();
    },

    /**
     * Show lobby screen
     */
    showLobby: async function() {
        var username = localStorage.getItem(CONFIG.STORAGE.USERNAME);
        document.getElementById('lobby-username').textContent = username;

        // Register player with Supabase if not already
        if (!SupabaseClient.currentPlayer) {
            await SupabaseClient.registerPlayer(username);
        }

        this.showScreen('lobby');
    },

    /**
     * Called when successfully joined a room
     */
    onRoomJoined: function(room) {
        document.getElementById('room-code-display').textContent = room.code;
        document.getElementById('room-actions').classList.add('hidden');
        document.getElementById('player-list-section').classList.remove('hidden');
        document.getElementById('btn-leave-room').classList.remove('hidden');

        this.refreshPlayerList();
    },

    /**
     * Called when left a room
     */
    onRoomLeft: function() {
        document.getElementById('room-code-display').textContent = '------';
        document.getElementById('room-actions').classList.remove('hidden');
        document.getElementById('player-list-section').classList.add('hidden');
        document.getElementById('btn-leave-room').classList.add('hidden');
        document.getElementById('btn-find-match').classList.remove('hidden');
        document.getElementById('matchmaking-status').classList.add('hidden');
    },

    /**
     * Refresh the player list in lobby
     */
    refreshPlayerList: async function() {
        var members = await SupabaseClient.getRoomMembers();
        var listEl = document.getElementById('player-list');
        var currentPlayerId = SupabaseClient.currentPlayer ? SupabaseClient.currentPlayer.id : null;

        listEl.innerHTML = '';

        members.forEach(function(member) {
            var div = document.createElement('div');
            div.className = 'player-item';
            if (member.player_id === currentPlayerId) {
                div.classList.add('is-you');
            }

            var playerName = member.players ? member.players.username : 'Unknown';
            div.innerHTML =
                '<span class="player-name">' + playerName + '</span>' +
                '<span class="player-status ' + member.status + '">' + member.status + '</span>';

            listEl.appendChild(div);
        });

        if (members.length === 0) {
            listEl.innerHTML = '<div class="player-item"><span class="player-name" style="color: var(--text-dim)">No players in room</span></div>';
        }
    },

    /**
     * Start a multiplayer duel
     */
    startDuel: function(match) {
        console.log('[UI] Starting duel:', match);

        // Use MultiplayerGame to handle the match
        if (typeof MultiplayerGame !== 'undefined') {
            MultiplayerGame.startMatch(match);
        } else {
            console.error('[UI] MultiplayerGame not available');
            this.showNotification('Error starting duel');
        }
    },

    /**
     * Check for existing user in localStorage
     */
    checkExistingUser: function() {
        const username = localStorage.getItem(CONFIG.STORAGE.USERNAME);
        if (username) {
            this.setUsername(username);
            this.showScreen('menu');
        } else {
            this.showScreen('login');
        }
    },

    /**
     * Handle login
     */
    handleLogin: function() {
        const input = document.getElementById('username-input');
        const username = input.value.trim();

        if (username.length < 2) {
            this.showNotification('Callsign must be at least 2 characters!');
            input.focus();
            return;
        }

        if (username.length > 20) {
            this.showNotification('Callsign too long! Max 20 characters.');
            input.focus();
            return;
        }

        // Valid username
        localStorage.setItem(CONFIG.STORAGE.USERNAME, username);
        this.setUsername(username);
        AudioManager.playClick();
        this.showScreen('menu');
    },

    /**
     * Handle logout
     */
    handleLogout: function() {
        localStorage.removeItem(CONFIG.STORAGE.USERNAME);
        document.getElementById('username-input').value = '';
        this.showScreen('login');
    },

    /**
     * Set username display
     */
    setUsername: function(username) {
        document.getElementById('display-username').textContent = username;
        this.updateStats();
    },

    /**
     * Show a specific screen
     */
    showScreen: function(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const target = this.screens[screenName];
        if (target) {
            target.classList.add('active');
            this.currentScreen = screenName;

            // Focus appropriate element
            if (screenName === 'login') {
                document.getElementById('username-input').focus();
            } else if (screenName === 'practice') {
                document.getElementById('answer-input').focus();
            }
        }
    },

    /**
     * Update stats display in menu
     */
    updateStats: function() {
        const stats = this.getStats();
        document.getElementById('stat-wins').textContent = stats.totalWins;
        document.getElementById('stat-losses').textContent = stats.totalLosses;
        document.getElementById('stat-points').textContent = stats.totalPoints.toLocaleString();
    },

    /**
     * Get stats from localStorage
     */
    getStats: function() {
        const stored = localStorage.getItem(CONFIG.STORAGE.STATS);
        if (stored) {
            return JSON.parse(stored);
        }
        return { ...DEFAULT_STATS };
    },

    /**
     * Save stats to localStorage
     */
    saveStats: function(stats) {
        localStorage.setItem(CONFIG.STORAGE.STATS, JSON.stringify(stats));
        this.updateStats();
    },

    /**
     * Get achievements from localStorage
     */
    getAchievements: function() {
        const stored = localStorage.getItem(CONFIG.STORAGE.ACHIEVEMENTS);
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    },

    /**
     * Save achievements to localStorage
     */
    saveAchievements: function(achievements) {
        localStorage.setItem(CONFIG.STORAGE.ACHIEVEMENTS, JSON.stringify(achievements));
    },

    /**
     * Show achievements screen
     */
    showAchievements: function() {
        const grid = document.getElementById('achievements-grid');
        const unlocked = this.getAchievements();

        grid.innerHTML = '';

        Object.values(CONFIG.ACHIEVEMENTS).forEach(ach => {
            const isUnlocked = unlocked.includes(ach.id);
            const card = document.createElement('div');
            card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="ach-icon">${ach.icon}</div>
                <div class="ach-info">
                    <div class="ach-name">${ach.name}</div>
                    <div class="ach-desc">${ach.description}</div>
                </div>
            `;
            grid.appendChild(card);
        });

        this.showScreen('achievements');
    },

    /**
     * Load settings from localStorage
     */
    loadSettings: function() {
        const stored = localStorage.getItem(CONFIG.STORAGE.SETTINGS);
        const settings = stored ? JSON.parse(stored) : { ...DEFAULT_SETTINGS };

        document.getElementById('setting-volume').value = settings.volume;
        document.getElementById('volume-value').textContent = settings.volume + '%';
        document.getElementById('setting-sfx').checked = settings.sfxEnabled;
        document.getElementById('setting-music').checked = settings.musicEnabled;
        document.getElementById('setting-animations').checked = settings.animationsEnabled;
        document.getElementById('setting-difficulty').value = settings.difficulty;

        AudioManager.setVolume(settings.volume / 100);
        AudioManager.setEnabled(settings.sfxEnabled);
    },

    /**
     * Save settings to localStorage
     */
    saveSettings: function() {
        const settings = {
            volume: parseInt(document.getElementById('setting-volume').value),
            sfxEnabled: document.getElementById('setting-sfx').checked,
            musicEnabled: document.getElementById('setting-music').checked,
            animationsEnabled: document.getElementById('setting-animations').checked,
            difficulty: document.getElementById('setting-difficulty').value
        };
        localStorage.setItem(CONFIG.STORAGE.SETTINGS, JSON.stringify(settings));
    },

    /**
     * Toggle reference table visibility
     */
    toggleReferenceTable: function() {
        const table = document.getElementById('reference-table');
        table.classList.toggle('collapsed');
    },

    /**
     * Update practice game UI
     */
    updatePracticeUI: function(state) {
        // Round
        document.getElementById('practice-round').textContent = state.round;

        // Encoding type
        document.getElementById('encoding-type').textContent =
            Encoder.getDisplayName(state.currentQuestion?.encoding || 'ROT13');

        // Score
        document.getElementById('practice-score').textContent = state.score.toLocaleString();

        // Combo
        document.getElementById('practice-combo').textContent = state.combo;

        // Health
        const healthPercent = (state.hp / CONFIG.STARTING_HP) * 100;
        document.getElementById('practice-health-bar').style.width = healthPercent + '%';

        // Hearts
        const hearts = document.getElementById('practice-hearts');
        let heartStr = '';
        for (let i = 0; i < CONFIG.STARTING_HP; i++) {
            heartStr += i < state.hp ? '♥' : '♡';
        }
        hearts.innerHTML = heartStr;

        // XOR key display
        const xorDisplay = document.getElementById('xor-key-display');
        if (state.currentQuestion?.encoding === 'xor' && state.currentQuestion.key !== undefined) {
            xorDisplay.classList.remove('hidden');
            document.getElementById('xor-key-value').textContent =
                '0x' + state.currentQuestion.key.toString(16).toUpperCase().padStart(2, '0') +
                ' (' + state.currentQuestion.key + ')';
        } else {
            xorDisplay.classList.add('hidden');
        }

        // Power-up counts
        document.getElementById('hint-count').textContent = state.powerups.hint;
        document.getElementById('skip-count').textContent = state.powerups.skip;

        // Disable power-ups if exhausted
        document.getElementById('powerup-hint').classList.toggle('disabled', state.powerups.hint <= 0);
        document.getElementById('powerup-skip').classList.toggle('disabled', state.powerups.skip <= 0);
    },

    /**
     * Display encoded string
     */
    showEncodedString: function(encoded) {
        const el = document.getElementById('encoded-string');
        el.textContent = '>>> ' + encoded + ' <<<';
        el.classList.add('glitch');
        setTimeout(() => el.classList.remove('glitch'), 300);
    },

    /**
     * Show feedback message
     */
    showFeedback: function(correct, message) {
        const area = document.getElementById('feedback-area');
        area.classList.remove('hidden', 'correct', 'incorrect');
        area.classList.add(correct ? 'correct' : 'incorrect');
        area.querySelector('.feedback-message').textContent = message;

        setTimeout(() => {
            area.classList.add('hidden');
        }, CONFIG.FEEDBACK_DURATION);
    },

    /**
     * Clear answer input
     */
    clearAnswer: function() {
        const input = document.getElementById('answer-input');
        input.value = '';
        input.focus();
    },

    /**
     * Update timer display
     */
    updateTimer: function(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        document.getElementById('practice-timer').textContent =
            mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
    },

    /**
     * Show results screen
     */
    showResults: function(results) {
        document.getElementById('results-title').textContent =
            results.won ? 'MISSION COMPLETE' : 'SYSTEM COMPROMISED';
        document.getElementById('results-title').classList.toggle('defeat', !results.won);

        document.getElementById('result-score').textContent = results.score.toLocaleString();
        document.getElementById('result-rounds').textContent = results.roundsCompleted + '/' + CONFIG.TOTAL_ROUNDS;
        document.getElementById('result-combo').textContent = 'x' + results.bestCombo;
        document.getElementById('result-accuracy').textContent = Math.round(results.accuracy) + '%';
        document.getElementById('result-avgtime').textContent = results.avgTime.toFixed(1) + 's';

        // Show new achievements
        const newAchDiv = document.getElementById('new-achievements');
        const achList = document.getElementById('achievement-list');

        if (results.newAchievements && results.newAchievements.length > 0) {
            newAchDiv.classList.remove('hidden');
            achList.innerHTML = '';
            results.newAchievements.forEach(achId => {
                const ach = CONFIG.ACHIEVEMENTS[achId.toUpperCase()];
                if (ach) {
                    const badge = document.createElement('div');
                    badge.className = 'achievement-badge';
                    badge.innerHTML = `${ach.icon} ${ach.name}`;
                    achList.appendChild(badge);
                }
            });
        } else {
            newAchDiv.classList.add('hidden');
        }

        this.showScreen('results');
    },

    /**
     * Shake element (for wrong answers)
     */
    shake: function(elementId) {
        var el = document.getElementById(elementId);
        if (!el) {
            console.warn('[UI] shake: element not found:', elementId);
            return;
        }
        el.classList.add('shake');
        setTimeout(function() { el.classList.remove('shake'); }, 500);
    },

    /**
     * Pulse element (for correct answers)
     */
    pulse: function(elementId) {
        var el = document.getElementById(elementId);
        if (!el) {
            console.warn('[UI] pulse: element not found:', elementId);
            return;
        }
        el.classList.add('correct-pulse');
        setTimeout(function() { el.classList.remove('correct-pulse'); }, 500);
    },

    /**
     * Show notification toast
     */
    showNotification: function(message) {
        // Create notification element if it doesn't exist
        let notif = document.getElementById('notification-toast');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'notification-toast';
            notif.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--bg-panel);
                border: 1px solid var(--text-secondary);
                color: var(--text-secondary);
                padding: 0.75rem 1.5rem;
                border-radius: 4px;
                font-family: var(--font-mono);
                font-size: 0.85rem;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(notif);
        }

        notif.textContent = message;
        notif.style.opacity = '1';

        setTimeout(() => {
            notif.style.opacity = '0';
        }, 3000);
    },

    /**
     * Apply hint to the answer input
     * Only puts the revealed characters, not the underscores
     */
    applyHint: function(hint) {
        var input = document.getElementById('answer-input');
        // Strip underscores - only show revealed characters
        var revealed = hint.replace(/_/g, '');
        input.value = revealed;
        input.focus();
        // Put cursor at end
        input.setSelectionRange(revealed.length, revealed.length);
    },

    /**
     * Generate the ASCII reference table HTML
     * Creates a 16-column hex grid for printable ASCII (32-126)
     */
    generateAsciiTable: function() {
        var table = document.getElementById('ascii-table');
        if (!table) return;

        var html = '';

        // Header row (0-F)
        html += '<div class="ascii-cell header"></div>'; // Empty corner
        for (var col = 0; col < 16; col++) {
            html += '<div class="ascii-cell header">' + col.toString(16).toUpperCase() + '</div>';
        }

        // Data rows (2-7 for printable ASCII 0x20-0x7E)
        for (var row = 2; row <= 7; row++) {
            // Row header
            html += '<div class="ascii-cell row-header">' + row + '</div>';

            // Cells in this row
            for (var col = 0; col < 16; col++) {
                var charCode = row * 16 + col;
                var char = '';
                var dataAttr = '';

                if (charCode >= 32 && charCode <= 126) {
                    if (charCode === 32) {
                        char = 'SP';
                        dataAttr = ' data-char="SP"';
                    } else {
                        char = String.fromCharCode(charCode);
                        // Escape HTML special characters
                        if (char === '<') char = '&lt;';
                        else if (char === '>') char = '&gt;';
                        else if (char === '&') char = '&amp;';
                        else if (char === '"') char = '&quot;';
                    }
                }

                html += '<div class="ascii-cell"' + dataAttr + '>' + char + '</div>';
            }
        }

        table.innerHTML = html;
    },

    /**
     * Show ASCII table with Matrix falling animation
     */
    showAsciiTable: function() {
        var container = document.getElementById('ascii-table-container');
        if (!container) return;

        // Generate table if not already done
        var table = document.getElementById('ascii-table');
        if (table && table.children.length === 0) {
            this.generateAsciiTable();
        }

        // Show container
        container.classList.remove('hidden');

        // Get all data cells (not headers)
        var cells = table.querySelectorAll('.ascii-cell:not(.header):not(.row-header)');

        // Reset and animate each cell with random delay
        cells.forEach(function(cell, index) {
            cell.classList.remove('falling', 'visible', 'fade-out');
            // Force reflow
            void cell.offsetWidth;

            // Random delay between 0-800ms for Matrix effect
            var delay = Math.random() * 800;
            setTimeout(function() {
                cell.classList.add('falling');
            }, delay);
        });

        // Play a subtle sound
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playNotification();
        }
    },

    /**
     * Hide ASCII table with fade out animation
     */
    hideAsciiTable: function() {
        var container = document.getElementById('ascii-table-container');
        if (!container || container.classList.contains('hidden')) return;

        var table = document.getElementById('ascii-table');
        var cells = table.querySelectorAll('.ascii-cell:not(.header):not(.row-header)');

        // Fade out all cells
        cells.forEach(function(cell) {
            cell.classList.remove('falling');
            cell.classList.add('fade-out');
        });

        // Hide container after animation
        setTimeout(function() {
            container.classList.add('hidden');
            // Reset cells for next show
            cells.forEach(function(cell) {
                cell.classList.remove('fade-out', 'visible');
            });
        }, 350);
    },

    /**
     * Check if ASCII table is currently visible
     */
    isAsciiTableVisible: function() {
        var container = document.getElementById('ascii-table-container');
        return container && !container.classList.contains('hidden');
    }
};

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    UI.init();
});

// Make available globally
window.UI = UI;
