/**
 * CYPHER ARENA - Game Logic
 * MWA201 Malware Analysis Training
 *
 * Handles practice mode, scoring, achievements, and game state
 * NOTE: Uses explicit Game.* references instead of this.* to avoid context issues
 */

const Game = {
    state: null,
    timerInterval: null,
    roundStartTime: null,

    /**
     * Initialize a new practice session
     */
    startPractice: function() {
        // Reset question manager
        QuestionManager.reset();

        // Initialize game state
        Game.state = {
            mode: 'practice',
            round: 1,
            hp: CONFIG.STARTING_HP,
            score: 0,
            combo: 0,
            bestCombo: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            totalTime: 0,
            roundTimes: [],
            powerups: {
                hint: CONFIG.POWERUPS.HINT.startCount,
                skip: CONFIG.POWERUPS.SKIP.startCount
            },
            currentQuestion: null,
            canSubmit: true,
            encodingsDecoded: {
                rot13: false,
                hex: false,
                base64: false,
                url: false,
                xor: false
            },
            rot13Streak: 0,
            tookDamage: false,
            fastestDecode: Infinity
        };

        // Show practice screen
        UI.showScreen('practice');
        UI.clearAnswer();

        // Start first round
        Game.startRound();

        console.log('[Game] Practice started');
    },

    /**
     * Start a new round
     */
    startRound: function() {
        if (Game.state.round > CONFIG.TOTAL_ROUNDS) {
            Game.endPractice(true);
            return;
        }

        // Get new question
        Game.state.currentQuestion = QuestionManager.getQuestion(Game.state.round);
        Game.state.canSubmit = true;

        // Update UI
        UI.updatePracticeUI(Game.state);
        UI.showEncodedString(Game.state.currentQuestion.encoded);
        UI.clearAnswer();

        // Show/hide ASCII table based on encoding type
        if (Game.state.currentQuestion.encoding === 'hex') {
            UI.showAsciiTable();
        } else {
            UI.hideAsciiTable();
        }

        // Start timer
        Game.roundStartTime = Date.now();
        Game.startTimer();

        // Play sound
        AudioManager.playRoundStart();

        console.log('[Game] Round ' + Game.state.round + ': ' + Game.state.currentQuestion.encoding + ' - "' + Game.state.currentQuestion.plain + '"');
    },

    /**
     * Start the round timer
     */
    startTimer: function() {
        if (Game.timerInterval) {
            clearInterval(Game.timerInterval);
        }

        var startTime = Date.now();
        UI.updateTimer(0);

        Game.timerInterval = setInterval(function() {
            var elapsed = (Date.now() - startTime) / 1000;
            UI.updateTimer(elapsed);
        }, 100);
    },

    /**
     * Stop the timer
     */
    stopTimer: function() {
        if (Game.timerInterval) {
            clearInterval(Game.timerInterval);
            Game.timerInterval = null;
        }
    },

    /**
     * Submit an answer
     */
    submitAnswer: function() {
        if (!Game.state || !Game.state.canSubmit || !Game.state.currentQuestion) {
            return;
        }

        var input = document.getElementById('answer-input');
        var answer = input.value.trim();

        if (!answer) {
            UI.showNotification('Enter an answer!');
            return;
        }

        // Calculate time taken
        var timeTaken = (Date.now() - Game.roundStartTime) / 1000;

        // Validate answer
        var isCorrect = Encoder.validateAnswer(answer, Game.state.currentQuestion.plain);

        if (isCorrect) {
            Game.handleCorrectAnswer(timeTaken);
        } else {
            Game.handleWrongAnswer();
        }
    },

    /**
     * Handle correct answer
     */
    handleCorrectAnswer: function(timeTaken) {
        Game.state.canSubmit = false;
        Game.stopTimer();

        // Update stats
        Game.state.correctAnswers++;
        Game.state.combo++;
        Game.state.totalTime += timeTaken;
        Game.state.roundTimes.push(timeTaken);

        // Track best combo
        if (Game.state.combo > Game.state.bestCombo) {
            Game.state.bestCombo = Game.state.combo;
        }

        // Track fastest decode
        if (timeTaken < Game.state.fastestDecode) {
            Game.state.fastestDecode = timeTaken;
        }

        // Track encoding types decoded
        Game.state.encodingsDecoded[Game.state.currentQuestion.encoding] = true;

        // Track ROT13 streak
        if (Game.state.currentQuestion.encoding === 'rot13') {
            Game.state.rot13Streak++;
        } else {
            Game.state.rot13Streak = 0;
        }

        // Calculate points
        var points = CONFIG.BASE_POINTS;
        points += Game.state.combo * CONFIG.COMBO_MULTIPLIER;

        // Time bonus
        if (timeTaken * 1000 < CONFIG.TIME_BONUS_THRESHOLD) {
            points += CONFIG.TIME_BONUS_POINTS;
        }

        Game.state.score += points;

        // Play sounds
        AudioManager.playCorrect();
        if (Game.state.combo > 1) {
            setTimeout(function() { AudioManager.playCombo(Game.state.combo); }, 200);
        }

        // Show feedback
        var message = 'CORRECT! +' + points + ' points';
        if (Game.state.combo > 1) {
            message += ' (' + Game.state.combo + 'x COMBO!)';
        }
        if (timeTaken < 2) {
            message += ' SPEED BONUS!';
        }
        UI.showFeedback(true, message);
        UI.pulse('challenge-area');

        // Update UI
        UI.updatePracticeUI(Game.state);

        // Next round after delay
        Game.state.round++;
        setTimeout(function() { Game.startRound(); }, CONFIG.ROUND_DELAY);
    },

    /**
     * Handle wrong answer
     */
    handleWrongAnswer: function() {
        // Reset combo
        Game.state.combo = 0;
        Game.state.wrongAnswers++;
        Game.state.rot13Streak = 0;

        // Take damage
        Game.state.hp--;
        Game.state.tookDamage = true;

        // Play sounds
        AudioManager.playWrong();
        AudioManager.playHit();

        // Show feedback with correct answer
        UI.showFeedback(false, 'INCORRECT! The answer was: ' + Game.state.currentQuestion.plain);
        UI.shake('practice-hearts');

        // Update UI
        UI.updatePracticeUI(Game.state);

        // Check for game over
        if (Game.state.hp <= 0) {
            Game.state.canSubmit = false;
            Game.stopTimer();
            setTimeout(function() { Game.endPractice(false); }, CONFIG.FEEDBACK_DURATION);
        } else {
            // Brief cooldown then allow retry
            Game.state.canSubmit = false;
            setTimeout(function() {
                Game.state.canSubmit = true;
                UI.clearAnswer();
            }, CONFIG.WRONG_ANSWER_COOLDOWN);
        }
    },

    /**
     * Use a power-up
     */
    usePowerup: function(type) {
        if (!Game.state || !Game.state.currentQuestion) return;

        switch (type) {
            case 'hint':
                if (Game.state.powerups.hint > 0) {
                    Game.state.powerups.hint--;
                    var hint = Encoder.getHint(
                        Game.state.currentQuestion.plain,
                        CONFIG.POWERUPS.HINT.revealChars
                    );
                    UI.applyHint(hint);
                    AudioManager.playPowerup();
                    UI.updatePracticeUI(Game.state);
                }
                break;

            case 'skip':
                if (Game.state.powerups.skip > 0) {
                    Game.state.powerups.skip--;
                    Game.state.combo = 0; // Reset combo on skip
                    Game.state.round++;
                    AudioManager.playPowerup();
                    UI.updatePracticeUI(Game.state);
                    Game.stopTimer();
                    setTimeout(function() { Game.startRound(); }, 500);
                }
                break;
        }
    },

    /**
     * Quit practice mode
     */
    quitPractice: function() {
        Game.stopTimer();
        UI.hideAsciiTable();
        UI.showScreen('menu');
        Game.state = null;
    },

    /**
     * End practice session
     */
    endPractice: function(won) {
        Game.stopTimer();
        UI.hideAsciiTable();

        // Calculate statistics
        var totalAttempts = Game.state.correctAnswers + Game.state.wrongAnswers;
        var accuracy = totalAttempts > 0
            ? (Game.state.correctAnswers / totalAttempts) * 100
            : 0;
        var avgTime = Game.state.roundTimes.length > 0
            ? Game.state.totalTime / Game.state.roundTimes.length
            : 0;

        // Get and update persistent stats
        var stats = UI.getStats();
        stats.totalSessions++;
        stats.totalPoints += Game.state.score;
        stats.totalDecodes += Game.state.correctAnswers;

        if (won) {
            stats.totalWins++;
        } else {
            stats.totalLosses++;
        }

        if (Game.state.bestCombo > stats.bestCombo) {
            stats.bestCombo = Game.state.bestCombo;
        }

        if (Game.state.fastestDecode < stats.fastestDecode) {
            stats.fastestDecode = Game.state.fastestDecode;
        }

        // Update encoding counts
        Object.keys(Game.state.encodingsDecoded).forEach(function(enc) {
            if (Game.state.encodingsDecoded[enc]) {
                stats.encodingsDecoded[enc] = (stats.encodingsDecoded[enc] || 0) + 1;
            }
        });

        UI.saveStats(stats);

        // Check for new achievements
        var newAchievements = Game.checkAchievements(stats, won);

        // Play end sound
        if (won) {
            AudioManager.playVictory();
        } else {
            AudioManager.playDefeat();
        }

        // Show results
        UI.showResults({
            won: won,
            score: Game.state.score,
            roundsCompleted: Game.state.round - 1,
            bestCombo: Game.state.bestCombo,
            accuracy: accuracy,
            avgTime: avgTime,
            newAchievements: newAchievements
        });

        console.log('[Game] Practice ended:', won ? 'Victory' : 'Defeat');
    },

    /**
     * Check and award achievements
     */
    checkAchievements: function(stats, won) {
        var current = UI.getAchievements();
        var newAchievements = [];

        var checkAndAward = function(id, condition) {
            if (current.indexOf(id) === -1 && condition) {
                newAchievements.push(id);
                current.push(id);
            }
        };

        // First Blood - Win first match
        checkAndAward('first_blood', won && stats.totalWins === 1);

        // Perfect - Complete without losing HP
        checkAndAward('perfect', won && !Game.state.tookDamage);

        // Speed Demon - Decode under 2 seconds
        checkAndAward('speed_demon', Game.state.fastestDecode < 2);

        // ROT13 Master - 10 consecutive ROT13 decodes
        checkAndAward('rot13_master', Game.state.rot13Streak >= 10);

        // Comeback Kid - Win with 1 HP
        checkAndAward('comeback_kid', won && Game.state.hp === 1);

        // Veteran - Play 25 sessions
        checkAndAward('veteran', stats.totalSessions >= 25);

        // Champion - 10 wins
        checkAndAward('champion', stats.totalWins >= 10);

        // Decoder - 100 total decodes
        checkAndAward('decoder', stats.totalDecodes >= 100);

        // On Fire - 5x combo
        checkAndAward('streak_5', Game.state.bestCombo >= 5);

        // Polyglot - Decode all encoding types
        var allEncodings = true;
        Object.keys(Game.state.encodingsDecoded).forEach(function(key) {
            if (!Game.state.encodingsDecoded[key]) {
                allEncodings = false;
            }
        });
        checkAndAward('all_encodings', allEncodings);

        // Save achievements
        if (newAchievements.length > 0) {
            UI.saveAchievements(current);
            console.log('[Game] New achievements:', newAchievements);
        }

        return newAchievements;
    }
};

// Make available globally
window.Game = Game;

// Log ready state
console.log('[Game] Module loaded');
