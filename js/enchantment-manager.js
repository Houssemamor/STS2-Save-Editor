import { dataStore } from './data-store.js';
import { resolveImageUrl } from './utils.js';
import { stripPrefix } from './constants.js';

/**
 * EnchantmentManager provides centralized access to enchantment metadata and utilities.
 * Responsibility: Enchantment data lookups, image URL resolution, stackability detection.
 */
class EnchantmentManagerClass {
    constructor() {
        this.enchantmentCache = null;
    }

    /**
     * Get all enchantments from data store.
     */
    getAllEnchantments() {
        if (this.enchantmentCache === null) {
            this.enchantmentCache = dataStore.getAllEnchantments() || [];
        }
        return this.enchantmentCache;
    }

    /**
     * Get enchantment by ID (handles both prefixed and unprefixed IDs).
     * @param {string} id - Enchantment ID (e.g., "SLITHER" or "ENCHANTMENT.SLITHER")
     * @returns {Object|null} Enchantment data or null if not found
     */
    getEnchantmentById(id) {
        if (!id) return null;

        // Strip prefix if present (ENCHANTMENT.SLITHER -> SLITHER)
        const dataId = stripPrefix(id, 'enchantment');
        const all = this.getAllEnchantments();
        return all.find(e => e.id === dataId) || null;
    }

    /**
     * Check if an enchantment is stackable (can have amounts > 1).
     * Stackable enchantments have {Amount} in description_raw.
     * @param {string} id - Enchantment ID
     * @returns {boolean}
     */
    isStackable(id) {
        const enchantment = this.getEnchantmentById(id);
        if (!enchantment) return false;

        // If is_stackable flag is explicitly set, use it
        if (enchantment.is_stackable !== null && enchantment.is_stackable !== undefined) {
            return enchantment.is_stackable;
        }

        // Otherwise, detect from description_raw containing {Amount}
        if (enchantment.description_raw) {
            return /\{Amount[:\}]/.test(enchantment.description_raw);
        }

        return false;
    }

    /**
     * Get enchantment image URL.
     * Falls back to missing_enchantment.png if image not found.
     * @param {string} id - Enchantment ID (e.g., "SLITHER" or "ENCHANTMENT.SLITHER")
     * @returns {string} Image URL
     */
    getEnchantmentImageUrl(id) {
        if (!id) return this.getFallbackImageUrl();

        // Strip prefix if present (ENCHANTMENT.SLITHER -> SLITHER)
        const dataId = stripPrefix(id, 'enchantment');

        // Convert ID to lowercase for image filename (SLITHER → slither.png)
        const filename = `${dataId.toLowerCase()}.png`;
        const url = `static/images/enchantments/${filename}`;

        // Return as-is; resolveImageUrl will handle if needed
        return resolveImageUrl(url);
    }

    /**
     * Get fallback image URL for missing enchantments.
     */
    getFallbackImageUrl() {
        return resolveImageUrl('static/images/enchantments/missing_enchantment.png');
    }

    /**
     * Get enchantment display label with optional amount.
     * @param {Object} enchantmentData - { id, amount? }
     * @returns {string} Display label (e.g., "Slither" or "Sharp ×5")
     */
    getEnchantmentLabel(enchantmentData) {
        if (!enchantmentData || !enchantmentData.id) return 'Unknown';

        const enchantment = this.getEnchantmentById(enchantmentData.id);
        const name = enchantment ? enchantment.name : enchantmentData.id;

        if (enchantmentData.amount && this.isStackable(enchantmentData.id)) {
            return `${name} ×${enchantmentData.amount}`;
        }

        return name;
    }

    /**
     * Get enchantment description (formatted).
     * @param {string} id - Enchantment ID
     * @returns {string} Description text
     */
    getEnchantmentDescription(id) {
        const enchantment = this.getEnchantmentById(id);
        return enchantment ? enchantment.description : '';
    }

    /**
     * Validate enchantment amount.
     * @param {string} id - Enchantment ID
     * @param {number} amount - Amount value
     * @returns {boolean} True if valid
     */
    isValidAmount(id, amount) {
        if (!this.isStackable(id)) {
            return amount === 1 || amount === undefined || amount === null;
        }

        const num = parseInt(amount, 10);
        return !isNaN(num) && num >= 1 && num <= 20;
    }

    /**
     * Clamp amount to valid range for stackable enchantment.
     * @param {string} id - Enchantment ID
     * @param {number} amount - Amount value
     * @returns {number} Clamped value
     */
    clampAmount(id, amount) {
        if (!this.isStackable(id)) return 1;

        const num = parseInt(amount, 10);
        if (isNaN(num)) return 1;

        return Math.max(1, Math.min(20, num));
    }

    /**
     * Filter enchantments by card type compatibility.
     * @param {string|null} cardType - Card type (e.g., "Attack", "Skill", null for all)
     * @returns {Array} Filtered enchantments
     */
    getEnchantmentsByCardType(cardType) {
        const all = this.getAllEnchantments();

        if (!cardType) return all; // No filter

        return all.filter(e => {
            // Enchantment is compatible if:
            // - card_type is null (universal), OR
            // - card_type matches the requested type
            return e.card_type === null || e.card_type === cardType;
        });
    }

    /**
     * Search enchantments by name or description.
     * @param {string} query - Search query
     * @returns {Array} Matching enchantments
     */
    search(query) {
        if (!query || query.trim() === '') return this.getAllEnchantments();

        const q = query.toLowerCase();
        const all = this.getAllEnchantments();

        return all.filter(e =>
            e.id.toLowerCase().includes(q) ||
            e.name.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q)
        );
    }

    /**
     * Clear cache (for testing or refresh).
     */
    clearCache() {
        this.enchantmentCache = null;
    }
}

// Singleton instance
export const enchantmentManager = new EnchantmentManagerClass();
