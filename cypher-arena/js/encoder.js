/**
 * CYPHER ARENA - Encoding/Decoding Functions
 * MWA201 Malware Analysis Training
 *
 * Supports: ROT13, Hex, Base64, URL Encoding, XOR (single-byte)
 */

const Encoder = {
    /**
     * ROT13 Encoding/Decoding
     * Same function works for both encode and decode (symmetric)
     * @param {string} str - Input string
     * @returns {string} - ROT13 transformed string
     */
    rot13: function(str) {
        return str.replace(/[a-zA-Z]/g, function(c) {
            const base = c <= 'Z' ? 65 : 97;
            return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
        });
    },

    /**
     * Hex Encoding
     * Converts string to hexadecimal representation
     * @param {string} str - Input string
     * @returns {string} - Hex encoded string (lowercase)
     */
    hexEncode: function(str) {
        return str.split('').map(function(c) {
            return c.charCodeAt(0).toString(16).padStart(2, '0');
        }).join('');
    },

    /**
     * Hex Decoding
     * Converts hexadecimal string back to text
     * @param {string} hex - Hex encoded string
     * @returns {string} - Decoded string
     */
    hexDecode: function(hex) {
        // Remove any spaces or common separators
        hex = hex.replace(/[\s:-]/g, '').toLowerCase();

        // Validate hex string
        if (!/^[0-9a-f]*$/i.test(hex) || hex.length % 2 !== 0) {
            throw new Error('Invalid hex string');
        }

        return hex.match(/.{2}/g).map(function(h) {
            return String.fromCharCode(parseInt(h, 16));
        }).join('');
    },

    /**
     * Base64 Encoding
     * @param {string} str - Input string
     * @returns {string} - Base64 encoded string
     */
    base64Encode: function(str) {
        try {
            // Handle Unicode characters
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            return btoa(str);
        }
    },

    /**
     * Base64 Decoding
     * @param {string} str - Base64 encoded string
     * @returns {string} - Decoded string
     */
    base64Decode: function(str) {
        try {
            // Handle Unicode characters
            return decodeURIComponent(escape(atob(str)));
        } catch (e) {
            try {
                return atob(str);
            } catch (e2) {
                throw new Error('Invalid Base64 string');
            }
        }
    },

    /**
     * URL Encoding
     * @param {string} str - Input string
     * @returns {string} - URL encoded string
     */
    urlEncode: function(str) {
        return encodeURIComponent(str);
    },

    /**
     * URL Decoding
     * @param {string} str - URL encoded string
     * @returns {string} - Decoded string
     */
    urlDecode: function(str) {
        try {
            return decodeURIComponent(str);
        } catch (e) {
            throw new Error('Invalid URL encoded string');
        }
    },

    /**
     * XOR Encoding with single-byte key
     * Returns hex-encoded result
     * @param {string} str - Input string
     * @param {number} key - XOR key (0-255)
     * @returns {string} - Hex encoded XOR result
     */
    xorEncode: function(str, key) {
        if (key < 0 || key > 255) {
            throw new Error('XOR key must be 0-255');
        }
        return str.split('').map(function(c) {
            return (c.charCodeAt(0) ^ key).toString(16).padStart(2, '0');
        }).join('');
    },

    /**
     * XOR Decoding with single-byte key
     * Input is hex-encoded XOR result
     * @param {string} hex - Hex encoded XOR result
     * @param {number} key - XOR key (0-255)
     * @returns {string} - Decoded string
     */
    xorDecode: function(hex, key) {
        if (key < 0 || key > 255) {
            throw new Error('XOR key must be 0-255');
        }

        // Remove spaces and validate
        hex = hex.replace(/[\s:-]/g, '').toLowerCase();

        if (!/^[0-9a-f]*$/i.test(hex) || hex.length % 2 !== 0) {
            throw new Error('Invalid hex string');
        }

        return hex.match(/.{2}/g).map(function(h) {
            return String.fromCharCode(parseInt(h, 16) ^ key);
        }).join('');
    },

    /**
     * Encode a string using specified encoding type
     * @param {string} str - Input string
     * @param {string} type - Encoding type: 'rot13', 'hex', 'base64', 'url', 'xor'
     * @param {number} [xorKey] - XOR key (required for 'xor' type)
     * @returns {object} - { encoded: string, key?: number }
     */
    encode: function(str, type, xorKey) {
        switch (type.toLowerCase()) {
            case 'rot13':
                return { encoded: this.rot13(str) };
            case 'hex':
                return { encoded: this.hexEncode(str) };
            case 'base64':
                return { encoded: this.base64Encode(str) };
            case 'url':
                return { encoded: this.urlEncode(str) };
            case 'xor':
                // Generate random key if not provided
                if (xorKey === undefined) {
                    xorKey = Math.floor(Math.random() * 200) + 1; // 1-200 to avoid null bytes
                }
                return { encoded: this.xorEncode(str, xorKey), key: xorKey };
            default:
                throw new Error('Unknown encoding type: ' + type);
        }
    },

    /**
     * Decode a string using specified encoding type
     * @param {string} str - Encoded string
     * @param {string} type - Encoding type
     * @param {number} [xorKey] - XOR key (required for 'xor' type)
     * @returns {string} - Decoded string
     */
    decode: function(str, type, xorKey) {
        switch (type.toLowerCase()) {
            case 'rot13':
                return this.rot13(str);
            case 'hex':
                return this.hexDecode(str);
            case 'base64':
                return this.base64Decode(str);
            case 'url':
                return this.urlDecode(str);
            case 'xor':
                if (xorKey === undefined) {
                    throw new Error('XOR key required for decoding');
                }
                return this.xorDecode(str, xorKey);
            default:
                throw new Error('Unknown encoding type: ' + type);
        }
    },

    /**
     * Get display name for encoding type
     * @param {string} type - Encoding type
     * @returns {string} - Display name
     */
    getDisplayName: function(type) {
        const names = {
            'rot13': 'ROT13',
            'hex': 'HEX',
            'base64': 'BASE64',
            'url': 'URL',
            'xor': 'XOR'
        };
        return names[type.toLowerCase()] || type.toUpperCase();
    },

    /**
     * Validate an answer against expected decoded value
     * @param {string} answer - User's answer
     * @param {string} expected - Expected decoded value
     * @param {boolean} caseSensitive - Whether comparison is case-sensitive
     * @returns {boolean}
     */
    validateAnswer: function(answer, expected, caseSensitive = false) {
        if (caseSensitive) {
            return answer.trim() === expected.trim();
        }
        return answer.trim().toLowerCase() === expected.trim().toLowerCase();
    },

    /**
     * Get a hint for the decoded string
     * @param {string} decoded - The decoded string
     * @param {number} revealCount - Number of characters to reveal
     * @returns {string} - Hint string with remaining chars as underscores
     */
    getHint: function(decoded, revealCount = 2) {
        if (decoded.length <= revealCount) {
            return decoded;
        }
        const revealed = decoded.substring(0, revealCount);
        const hidden = decoded.substring(revealCount).replace(/./g, '_');
        return revealed + hidden;
    }
};

// Make Encoder globally available
window.Encoder = Encoder;
