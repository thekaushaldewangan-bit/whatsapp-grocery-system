import logger from '../utils/logger.js';

// ==================== PARSE VOICE ORDER ====================
export const parseVoiceOrder = async (transcribedText) => {
  try {
    logger.info(`🔍 Parsing voice order: "${transcribedText}"`);

    const items = [];
    const text = transcribedText.toLowerCase();

    // Common quantity patterns: "2 kg", "1", "2 pieces", etc.
    const itemPatterns = [
      /(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram|gram|grams|g)\s+(?:of\s+)?([a-zA-Z\s]+?)(?:\s+and|\s+,|$)/gi,
      /(\d+(?:\.\d+)?)\s*(?:piece|pieces|pc|pcs)\s+(?:of\s+)?([a-zA-Z\s]+?)(?:\s+and|\s+,|$)/gi,
      /(\d+(?:\.\d+)?)\s*(?:litre|liter|l)\s+(?:of\s+)?([a-zA-Z\s]+?)(?:\s+and|\s+,|$)/gi,
      /(\d+(?:\.\d+)?)\s+(?:of\s+)?([a-zA-Z\s]+?)(?:\s+and|\s+,|$)/gi
    ];

    const matches = new Set();

    for (const pattern of itemPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const quantity = parseFloat(match[1]);
        const itemName = match[2].trim();

        if (itemName && quantity > 0) {
          matches.add(JSON.stringify({ quantity, name: itemName }));
        }
      }
    }

    // Convert set to array of items
    matches.forEach(itemString => {
      try {
        const item = JSON.parse(itemString);
        // Normalize common names
        item.name = normalizeItemName(item.name);
        items.push(item);
      } catch (e) {
        logger.warn('Error parsing item:', itemString);
      }
    });

    logger.info(`✅ Parsed ${items.length} items:`, items);

    return { items, confidence: items.length > 0 ? 'high' : 'low' };
  } catch (error) {
    logger.error('Error parsing voice order:', error);
    return { items: [], confidence: 'low' };
  }
};

// ==================== NORMALIZE ITEM NAMES ====================
const normalizeItemName = (name) => {
  // Mapping of common variations
  const normalizations = {
    apple: ['apple', 'apples', 'aple'],
    milk: ['milk', 'milks'],
    bread: ['bread', 'breads'],
    banana: ['banana', 'bananas'],
    orange: ['orange', 'oranges'],
    carrot: ['carrot', 'carrots'],
    onion: ['onion', 'onions'],
    tomato: ['tomato', 'tomatoes'],
    potato: ['potato', 'potatoes'],
    rice: ['rice'],
    chicken: ['chicken', 'chickens'],
    butter: ['butter'],
    cheese: ['cheese'],
    yogurt: ['yogurt', 'curd'],
    egg: ['egg', 'eggs'],
    coffee: ['coffee'],
    tea: ['tea'],
    sugar: ['sugar'],
    salt: ['salt'],
    oil: ['oil']
  };

  const lowerName = name.toLowerCase().trim();

  for (const [canonical, variations] of Object.entries(normalizations)) {
    if (variations.includes(lowerName)) {
      return canonical;
    }
  }

  return lowerName;
};

export default {
  parseVoiceOrder,
  normalizeItemName
};

