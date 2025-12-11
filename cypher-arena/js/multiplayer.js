/**
 * CYPHER ARENA - Multiplayer Module
 * MWA201 Malware Analysis Training
 *
 * Handles multiplayer duel logic, UI callbacks, and real-time synchronization
 */

/**
 * MultiplayerUI - Callbacks for Supabase realtime subscriptions
 */
const MultiplayerUI = {
    /**
     * Called when room_members table changes
     * @param {object} payload - Supabase realtime payload
     */
    onRoomUpdate: function(payload) {
        console.log('[MultiplayerUI] Room update:', payload);
        UI.refreshPlayerList();
    },

    /**
     * Called when a new match is created in the room
     * This is how the OTHER player finds out they've been matched
     * @param {object} payload - Supabase realtime payload
     */
    onMatchCreated: function(payload) {
        console.log('[MultiplayerUI] Match created:', payload);

        var match = payload.new;
        var currentPlayerId = SupabaseClient.currentPlayer ? SupabaseClient.currentPlayer.id : null;

        if (!currentPlayerId) {
            console.warn('[MultiplayerUI] No current player ID');
            return;
        }

        // Check if this match involves us
        if (match.player1_id === currentPlayerId || match.player2_id === currentPlayerId) {
            // Check if we're already in this match (we created it)
            if (SupabaseClient.currentMatch && SupabaseClient.currentMatch.id === match.id) {
                console.log('[MultiplayerUI] Already in this match');
                return;
            }

            console.log('[MultiplayerUI] Joining match as participant');
            SupabaseClient.currentMatch = match;
            SupabaseClient.subscribeToMatch(match.id);
            MultiplayerGame.startMatch(match);
        }
    },

    /**
     * Called when a chat message is received
     * @param {object} payload - Broadcast payload
     */
    onChatMessage: function(payload) {
        console.log('[MultiplayerUI] Chat message:', payload);

        var data = payload.payload;
        if (!data || !data.username || !data.message) return;

        var messagesDiv = document.getElementById('chat-messages');
        if (!messagesDiv) return;

        var msgEl = document.createElement('div');
        msgEl.className = 'chat-message';

        // Check if this is the current user's message
        var currentUsername = SupabaseClient.currentPlayer ? SupabaseClient.currentPlayer.username : null;
        if (data.username === currentUsername) {
            msgEl.classList.add('is-self');
        }

        msgEl.innerHTML = '<span class="username">' + this.escapeHtml(data.username) + ':</span> ' +
            '<span class="text">' + this.escapeHtml(data.message) + '</span>';

        messagesDiv.appendChild(msgEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    },

    /**
     * Escape HTML special characters
     */
    escapeHtml: function(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

/**
 * MultiplayerGame - Handles multiplayer duel gameplay
 */
const MultiplayerGame = {
    state: null,
    timerInterval: null,
    roundStartTime: null,
    opponentName: null,
    myName: null,

    /**
     * Start a multiplayer match
     * @param {object} match - Match object from database
     */
    startMatch: async function(match) {
        console.log('[MultiplayerGame] Starting match:', match.id);

        var currentPlayerId = SupabaseClient.currentPlayer.id;
        var isPlayer1 = match.player1_id === currentPlayerId;

        // Get opponent info
        var members = await SupabaseClient.getRoomMembers();
        var opponentId = isPlayer1 ? match.player2_id : match.player1_id;
        var opponent = members.find(function(m) { return m.player_id === opponentId; });

        this.myName = SupabaseClient.currentPlayer.username;
        this.opponentName = opponent && opponent.players ? opponent.players.username : 'Opponent';

        // Initialize game state
        this.state = {
            matchId: match.id,
            isPlayer1: isPlayer1,
            myHP: CONFIG.STARTING_HP,
            opponentHP: CONFIG.STARTING_HP,
            round: 1,
            currentQuestion: null,
            roundAnswered: false,
            canSubmit: false,
            score: 0,
            combo: 0
        };

        // Update UI with player names
        this.updateDuelUI();

        // Show duel screen
        UI.showScreen('duel');
        UI.showNotification('Match started! Good luck!');

        // Play start sound
        AudioManager.playRoundStart();

        // Player1 generates and broadcasts the first question
        if (isPlayer1) {
            setTimeout(function() {
                MultiplayerGame.generateAndBroadcastQuestion();
            }, 1500);
        }
    },

    /**
     * Generate a question and broadcast to both players via database
     */
    generateAndBroadcastQuestion: function() {
        if (!this.state) return;

        console.log('[MultiplayerGame] Generating question for round', this.state.round);

        // Use QuestionManager to get a question
        var question = QuestionManager.getQuestion(this.state.round);

        // Store in database so both players see the same question
        SupabaseClient.updateMatch({
            current_question: question,
            current_round: this.state.round
        });
    },

    /**
     * Called when match state changes in database
     * @param {object} payload - Supabase realtime payload
     */
    onMatchUpdate: function(payload) {
        if (!this.state) return;

        var match = payload.new;
        console.log('[MultiplayerGame] Match update:', match);

        // New question arrived
        if (match.current_question) {
            var newQuestionJson = JSON.stringify(match.current_question);
            var currentQuestionJson = this.state.currentQuestion ? JSON.stringify(this.state.currentQuestion) : '';

            if (newQuestionJson !== currentQuestionJson) {
                this.state.currentQuestion = match.current_question;
                this.state.roundAnswered = false;
                this.state.canSubmit = true;
                this.displayQuestion();
                this.startRoundTimer();
            }
        }

        // HP updates
        var prevMyHP = this.state.myHP;
        var prevOpponentHP = this.state.opponentHP;

        this.state.myHP = this.state.isPlayer1 ? match.player1_hp : match.player2_hp;
        this.state.opponentHP = this.state.isPlayer1 ? match.player2_hp : match.player1_hp;

        // Play damage sound if HP changed
        if (this.state.myHP < prevMyHP) {
            AudioManager.playHit();
            UI.shake('duel-player1-hp');
        }
        if (this.state.opponentHP < prevOpponentHP) {
            AudioManager.playCorrect();
        }

        this.updateDuelUI();

        // Check for match end
        if (match.status === 'finished') {
            this.endMatch(match.winner_id);
        } else if (this.state.myHP <= 0 || this.state.opponentHP <= 0) {
            // Someone ran out of HP
            var winnerId = this.state.myHP <= 0 ?
                (this.state.isPlayer1 ? match.player2_id : match.player1_id) :
                SupabaseClient.currentPlayer.id;

            SupabaseClient.endMatch(winnerId);
        }
    },

    /**
     * Called when opponent submits an answer (via broadcast)
     * @param {object} payload - Broadcast payload
     */
    onOpponentAnswer: function(payload) {
        if (!this.state) return;

        var data = payload.payload;
        console.log('[MultiplayerGame] Opponent answer:', data);

        // Opponent answered correctly first
        if (data.correct && !this.state.roundAnswered) {
            this.state.roundAnswered = true;
            this.state.canSubmit = false;
            this.state.combo = 0;
            this.stopTimer();

            // Show feedback
            this.showRoundResult(false, data.answer);

            // Move to next round after delay
            this.state.round++;
            if (this.state.round <= CONFIG.TOTAL_ROUNDS) {
                if (this.state.isPlayer1) {
                    setTimeout(function() {
                        MultiplayerGame.generateAndBroadcastQuestion();
                    }, CONFIG.ROUND_DELAY);
                }
            }
        }
    },

    /**
     * Display the current question
     */
    displayQuestion: function() {
        if (!this.state || !this.state.currentQuestion) return;

        var q = this.state.currentQuestion;

        // Update encoding type display
        document.getElementById('duel-encoding').textContent = Encoder.getDisplayName(q.encoding);

        // Update round display
        document.getElementById('duel-round').textContent = this.state.round;

        // Show encoded string
        var encodedEl = document.getElementById('duel-encoded-string');
        encodedEl.textContent = '>>> ' + q.encoded + ' <<<';
        encodedEl.classList.add('glitch');
        setTimeout(function() { encodedEl.classList.remove('glitch'); }, 300);

        // Clear input and focus
        var input = document.getElementById('duel-answer-input');
        input.value = '';
        input.focus();

        // Play sound
        AudioManager.playRoundStart();
    },

    /**
     * Start the round timer
     */
    startRoundTimer: function() {
        this.stopTimer();

        this.roundStartTime = Date.now();
        var timerEl = document.getElementById('duel-timer');

        this.timerInterval = setInterval(function() {
            var elapsed = (Date.now() - MultiplayerGame.roundStartTime) / 1000;
            var mins = Math.floor(elapsed / 60);
            var secs = Math.floor(elapsed % 60);
            timerEl.textContent = mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
        }, 100);
    },

    /**
     * Stop the round timer
     */
    stopTimer: function() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    /**
     * Submit an answer
     */
    submitAnswer: function() {
        if (!this.state || !this.state.canSubmit || !this.state.currentQuestion) {
            return;
        }

        var input = document.getElementById('duel-answer-input');
        var answer = input.value.trim();

        if (!answer) {
            UI.showNotification('Enter an answer!');
            return;
        }

        var timeTaken = Date.now() - this.roundStartTime;
        var correct = Encoder.validateAnswer(answer, this.state.currentQuestion.plain);

        // Broadcast answer to opponent
        SupabaseClient.broadcastAnswer({
            playerId: SupabaseClient.currentPlayer.id,
            answer: answer,
            correct: correct,
            time: timeTaken
        });

        if (correct && !this.state.roundAnswered) {
            this.state.roundAnswered = true;
            this.state.canSubmit = false;
            this.state.combo++;
            this.stopTimer();

            // We won the round - deal damage
            this.dealDamage();
            this.showRoundResult(true, answer);

            // Calculate score
            var points = CONFIG.BASE_POINTS + (this.state.combo * CONFIG.COMBO_MULTIPLIER);
            if (timeTaken < CONFIG.TIME_BONUS_THRESHOLD) {
                points += CONFIG.TIME_BONUS_POINTS;
            }
            this.state.score += points;

            // Move to next round after delay
            this.state.round++;
            if (this.state.round <= CONFIG.TOTAL_ROUNDS && this.state.opponentHP > 1) {
                if (this.state.isPlayer1) {
                    setTimeout(function() {
                        MultiplayerGame.generateAndBroadcastQuestion();
                    }, CONFIG.ROUND_DELAY);
                }
            }
        } else if (!correct) {
            // Wrong answer feedback
            this.state.combo = 0;
            UI.shake('duel-answer-input');
            AudioManager.playWrong();
            input.value = '';
            input.focus();
        }
    },

    /**
     * Deal damage to opponent
     */
    dealDamage: function() {
        var updates = {};
        if (this.state.isPlayer1) {
            updates.player2_hp = this.state.opponentHP - 1;
        } else {
            updates.player1_hp = this.state.opponentHP - 1;
        }
        SupabaseClient.updateMatch(updates);
    },

    /**
     * Show round result feedback
     * @param {boolean} won - Did we win this round
     * @param {string} answer - The correct answer
     */
    showRoundResult: function(won, answer) {
        var feedbackArea = document.getElementById('duel-feedback-area');
        var feedbackMsg = feedbackArea.querySelector('.feedback-message');

        feedbackArea.classList.remove('hidden', 'correct', 'incorrect');
        feedbackArea.classList.add(won ? 'correct' : 'incorrect');

        if (won) {
            var msg = 'CORRECT! You dealt damage!';
            if (this.state.combo > 1) {
                msg += ' (' + this.state.combo + 'x COMBO!)';
            }
            feedbackMsg.textContent = msg;
            AudioManager.playCorrect();
        } else {
            feedbackMsg.textContent = 'Opponent got it: ' + answer;
            AudioManager.playHit();
        }

        setTimeout(function() {
            feedbackArea.classList.add('hidden');
        }, CONFIG.FEEDBACK_DURATION);
    },

    /**
     * Update the duel screen UI
     */
    updateDuelUI: function() {
        if (!this.state) return;

        // Player names
        document.getElementById('duel-player1-name').textContent = this.myName || 'YOU';
        document.getElementById('duel-player2-name').textContent = this.opponentName || 'OPPONENT';

        // HP hearts
        var myHearts = '';
        var opponentHearts = '';

        for (var i = 0; i < CONFIG.STARTING_HP; i++) {
            myHearts += i < this.state.myHP ? '&#9829;' : '&#9825;';
            opponentHearts += i < this.state.opponentHP ? '&#9829;' : '&#9825;';
        }

        document.getElementById('duel-player1-hp').innerHTML = myHearts;
        document.getElementById('duel-player2-hp').innerHTML = opponentHearts;

        // Round
        document.getElementById('duel-round').textContent = this.state.round;
    },

    /**
     * End the match
     * @param {string} winnerId - ID of the winner
     */
    endMatch: function(winnerId) {
        this.stopTimer();
        this.state.canSubmit = false;

        var won = winnerId === SupabaseClient.currentPlayer.id;

        console.log('[MultiplayerGame] Match ended. Won:', won);

        // Play end sound
        if (won) {
            AudioManager.playVictory();
        } else {
            AudioManager.playDefeat();
        }

        // Update stats
        var stats = UI.getStats();
        stats.totalPoints += this.state.score;
        if (won) {
            stats.totalWins++;
        } else {
            stats.totalLosses++;
        }
        UI.saveStats(stats);

        // Show results
        UI.showResults({
            won: won,
            score: this.state.score,
            roundsCompleted: this.state.round - 1,
            bestCombo: this.state.combo,
            accuracy: 0,
            avgTime: 0,
            newAchievements: []
        });

        // Clean up
        this.state = null;
        SupabaseClient.currentMatch = null;
    },

    /**
     * Quit the current match
     */
    quitMatch: function() {
        this.stopTimer();

        if (SupabaseClient.currentMatch) {
            // Forfeit - opponent wins
            var opponentId = this.state.isPlayer1 ?
                SupabaseClient.currentMatch.player2_id :
                SupabaseClient.currentMatch.player1_id;
            SupabaseClient.endMatch(opponentId);
        }

        this.state = null;
        UI.showScreen('lobby');
    }
};

// Make available globally
window.MultiplayerUI = MultiplayerUI;
window.MultiplayerGame = MultiplayerGame;

console.log('[Multiplayer] Module loaded');
