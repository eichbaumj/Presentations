/**
 * CYPHER ARENA - Supabase Client
 * MWA201 Malware Analysis Training
 *
 * Handles database operations, authentication, and realtime sync
 */

const SupabaseClient = {
    client: null,
    currentPlayer: null,
    currentRoom: null,
    currentMatch: null,
    roomChannel: null,
    matchChannel: null,

    /**
     * Initialize Supabase client
     */
    init: function() {
        if (!CONFIG.SUPABASE.URL || !CONFIG.SUPABASE.ANON_KEY) {
            console.warn('[Supabase] No credentials configured');
            return false;
        }

        try {
            this.client = supabase.createClient(
                CONFIG.SUPABASE.URL,
                CONFIG.SUPABASE.ANON_KEY
            );
            console.log('[Supabase] Client initialized');
            return true;
        } catch (e) {
            console.error('[Supabase] Failed to initialize:', e);
            return false;
        }
    },

    /**
     * Check if Supabase is available
     */
    isAvailable: function() {
        return this.client !== null;
    },

    // ==================== PLAYER FUNCTIONS ====================

    /**
     * Register or login a player by username
     * @param {string} username
     * @returns {object|null} Player object or null on error
     */
    registerPlayer: async function(username) {
        if (!this.client) return null;

        try {
            // Check if player exists
            var { data: existing, error: fetchError } = await this.client
                .from('players')
                .select('*')
                .eq('username', username)
                .single();

            if (existing) {
                this.currentPlayer = existing;
                console.log('[Supabase] Player logged in:', username);
                return existing;
            }

            // Create new player
            var { data: newPlayer, error: insertError } = await this.client
                .from('players')
                .insert({ username: username })
                .select()
                .single();

            if (insertError) {
                console.error('[Supabase] Failed to create player:', insertError);
                return null;
            }

            this.currentPlayer = newPlayer;
            console.log('[Supabase] Player registered:', username);
            return newPlayer;

        } catch (e) {
            console.error('[Supabase] registerPlayer error:', e);
            return null;
        }
    },

    /**
     * Update player stats
     * @param {object} stats - Stats to update
     */
    updatePlayerStats: async function(stats) {
        if (!this.client || !this.currentPlayer) return;

        try {
            await this.client
                .from('players')
                .update(stats)
                .eq('id', this.currentPlayer.id);
        } catch (e) {
            console.error('[Supabase] updatePlayerStats error:', e);
        }
    },

    // ==================== ROOM FUNCTIONS ====================

    /**
     * Generate a random room code
     */
    generateRoomCode: function() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var code = '';
        for (var i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    /**
     * Create a new room
     * @returns {object|null} Room object
     */
    createRoom: async function() {
        if (!this.client || !this.currentPlayer) return null;

        try {
            var code = this.generateRoomCode();

            // Create room
            var { data: room, error: roomError } = await this.client
                .from('rooms')
                .insert({
                    code: code,
                    host_id: this.currentPlayer.id
                })
                .select()
                .single();

            if (roomError) {
                console.error('[Supabase] Failed to create room:', roomError);
                return null;
            }

            // Join as member
            await this.client
                .from('room_members')
                .insert({
                    room_id: room.id,
                    player_id: this.currentPlayer.id,
                    status: 'idle'
                });

            this.currentRoom = room;
            await this.subscribeToRoom(room.code);

            console.log('[Supabase] Room created:', code);
            return room;

        } catch (e) {
            console.error('[Supabase] createRoom error:', e);
            return null;
        }
    },

    /**
     * Join an existing room by code
     * @param {string} code - Room code
     * @returns {object|null} Room object
     */
    joinRoom: async function(code) {
        if (!this.client || !this.currentPlayer) return null;

        try {
            // Find room
            var { data: room, error: roomError } = await this.client
                .from('rooms')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('is_active', true)
                .single();

            if (roomError || !room) {
                console.error('[Supabase] Room not found:', code);
                return null;
            }

            // Check if already a member
            var { data: existing } = await this.client
                .from('room_members')
                .select('*')
                .eq('room_id', room.id)
                .eq('player_id', this.currentPlayer.id)
                .single();

            if (!existing) {
                // Join as member
                await this.client
                    .from('room_members')
                    .insert({
                        room_id: room.id,
                        player_id: this.currentPlayer.id,
                        status: 'idle'
                    });
            }

            this.currentRoom = room;
            await this.subscribeToRoom(room.code);

            console.log('[Supabase] Joined room:', code);
            return room;

        } catch (e) {
            console.error('[Supabase] joinRoom error:', e);
            return null;
        }
    },

    /**
     * Leave current room
     */
    leaveRoom: async function() {
        if (!this.client || !this.currentRoom || !this.currentPlayer) return;

        try {
            await this.client
                .from('room_members')
                .delete()
                .eq('room_id', this.currentRoom.id)
                .eq('player_id', this.currentPlayer.id);

            if (this.roomChannel) {
                this.client.removeChannel(this.roomChannel);
                this.roomChannel = null;
            }

            this.currentRoom = null;
            console.log('[Supabase] Left room');

        } catch (e) {
            console.error('[Supabase] leaveRoom error:', e);
        }
    },

    /**
     * Get members in current room
     * @returns {array} List of room members with player info
     */
    getRoomMembers: async function() {
        if (!this.client || !this.currentRoom) return [];

        try {
            var { data: members, error } = await this.client
                .from('room_members')
                .select('*, players(*)')
                .eq('room_id', this.currentRoom.id);

            return members || [];
        } catch (e) {
            console.error('[Supabase] getRoomMembers error:', e);
            return [];
        }
    },

    /**
     * Update player status in room
     * @param {string} status - 'idle', 'searching', 'in_match'
     */
    updateStatus: async function(status) {
        if (!this.client || !this.currentRoom || !this.currentPlayer) return;

        try {
            await this.client
                .from('room_members')
                .update({ status: status })
                .eq('room_id', this.currentRoom.id)
                .eq('player_id', this.currentPlayer.id);
        } catch (e) {
            console.error('[Supabase] updateStatus error:', e);
        }
    },

    // ==================== REALTIME SUBSCRIPTIONS ====================

    /**
     * Subscribe to room updates
     * @param {string} roomCode
     */
    subscribeToRoom: async function(roomCode) {
        if (!this.client) return;

        // Unsubscribe from previous room
        if (this.roomChannel) {
            this.client.removeChannel(this.roomChannel);
        }

        this.roomChannel = this.client
            .channel('room:' + roomCode)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'room_members' },
                function(payload) {
                    console.log('[Supabase] Room update:', payload);
                    if (typeof MultiplayerUI !== 'undefined') {
                        MultiplayerUI.onRoomUpdate(payload);
                    }
                }
            )
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'matches' },
                function(payload) {
                    console.log('[Supabase] New match:', payload);
                    if (typeof MultiplayerUI !== 'undefined') {
                        MultiplayerUI.onMatchCreated(payload);
                    }
                }
            )
            .on('broadcast',
                { event: 'chat' },
                function(payload) {
                    console.log('[Supabase] Chat message:', payload);
                    if (typeof MultiplayerUI !== 'undefined') {
                        MultiplayerUI.onChatMessage(payload);
                    }
                }
            )
            .subscribe();

        console.log('[Supabase] Subscribed to room:', roomCode);
    },

    /**
     * Send a chat message to the room
     * @param {string} message - The message to send
     */
    sendChatMessage: function(message) {
        if (!this.roomChannel || !this.currentPlayer) return;

        this.roomChannel.send({
            type: 'broadcast',
            event: 'chat',
            payload: {
                username: this.currentPlayer.username,
                message: message,
                timestamp: Date.now()
            }
        });
    },

    /**
     * Subscribe to match updates
     * @param {string} matchId
     */
    subscribeToMatch: async function(matchId) {
        if (!this.client) return;

        if (this.matchChannel) {
            this.client.removeChannel(this.matchChannel);
        }

        this.matchChannel = this.client
            .channel('match:' + matchId)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'matches', filter: 'id=eq.' + matchId },
                function(payload) {
                    console.log('[Supabase] Match update:', payload);
                    if (typeof MultiplayerGame !== 'undefined') {
                        MultiplayerGame.onMatchUpdate(payload);
                    }
                }
            )
            .on('broadcast',
                { event: 'answer' },
                function(payload) {
                    console.log('[Supabase] Answer broadcast:', payload);
                    if (typeof MultiplayerGame !== 'undefined') {
                        MultiplayerGame.onOpponentAnswer(payload);
                    }
                }
            )
            .subscribe();

        console.log('[Supabase] Subscribed to match:', matchId);
    },

    // ==================== MATCHMAKING ====================

    /**
     * Find an opponent (simple matchmaking)
     * @returns {object|null} Match object if found
     */
    findMatch: async function() {
        if (!this.client || !this.currentRoom || !this.currentPlayer) return null;

        try {
            // Set status to searching
            await this.updateStatus('searching');

            // Look for another player searching in the same room
            var { data: searchers, error } = await this.client
                .from('room_members')
                .select('*, players(*)')
                .eq('room_id', this.currentRoom.id)
                .eq('status', 'searching')
                .neq('player_id', this.currentPlayer.id)
                .limit(1);

            if (error || !searchers || searchers.length === 0) {
                console.log('[Supabase] No opponents found, waiting...');
                return null;
            }

            var opponent = searchers[0];

            // Create match
            var { data: match, error: matchError } = await this.client
                .from('matches')
                .insert({
                    room_id: this.currentRoom.id,
                    player1_id: this.currentPlayer.id,
                    player2_id: opponent.player_id,
                    status: 'active'
                })
                .select()
                .single();

            if (matchError) {
                console.error('[Supabase] Failed to create match:', matchError);
                return null;
            }

            // Update both players to in_match
            await this.updateStatus('in_match');
            await this.client
                .from('room_members')
                .update({ status: 'in_match' })
                .eq('room_id', this.currentRoom.id)
                .eq('player_id', opponent.player_id);

            this.currentMatch = match;
            await this.subscribeToMatch(match.id);

            console.log('[Supabase] Match created:', match.id);
            return match;

        } catch (e) {
            console.error('[Supabase] findMatch error:', e);
            return null;
        }
    },

    /**
     * Broadcast answer to opponent
     * @param {object} answerData
     */
    broadcastAnswer: async function(answerData) {
        if (!this.matchChannel) return;

        this.matchChannel.send({
            type: 'broadcast',
            event: 'answer',
            payload: answerData
        });
    },

    /**
     * Update match state
     * @param {object} updates
     */
    updateMatch: async function(updates) {
        if (!this.client || !this.currentMatch) return;

        try {
            await this.client
                .from('matches')
                .update(updates)
                .eq('id', this.currentMatch.id);
        } catch (e) {
            console.error('[Supabase] updateMatch error:', e);
        }
    },

    /**
     * End current match
     * @param {string} winnerId
     */
    endMatch: async function(winnerId) {
        if (!this.client || !this.currentMatch) return;

        try {
            await this.client
                .from('matches')
                .update({
                    status: 'finished',
                    winner_id: winnerId
                })
                .eq('id', this.currentMatch.id);

            // Update player statuses back to idle
            await this.updateStatus('idle');

            if (this.matchChannel) {
                this.client.removeChannel(this.matchChannel);
                this.matchChannel = null;
            }

            this.currentMatch = null;

        } catch (e) {
            console.error('[Supabase] endMatch error:', e);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    SupabaseClient.init();
});

// Make available globally
window.SupabaseClient = SupabaseClient;
