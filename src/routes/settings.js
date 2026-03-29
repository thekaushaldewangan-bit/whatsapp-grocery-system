import express from 'express';
import Settings, { DEFAULT_SETTINGS } from '../models/Settings.js';
import { adminMiddleware } from '../middlewares/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', adminMiddleware, async (req, res) => {
  try {
    const docs = await Settings.find().sort('group key');

    const existingKeys = new Set(docs.map(d => d.key));
    const merged = [...docs.map(d => d.toObject())];
    for (const def of DEFAULT_SETTINGS) {
      if (!existingKeys.has(def.key)) {
        merged.push({ ...def, _id: null });
      }
    }

    res.json({ success: true, data: merged });
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/', adminMiddleware, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'settings object is required' });
    }

    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      const def = DEFAULT_SETTINGS.find(d => d.key === key);
      const doc = await Settings.set(key, String(value), {
        label: def?.label,
        group: def?.group
      });
      results.push(doc);
    }

    logger.info(`Settings updated by admin: ${Object.keys(settings).join(', ')}`);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
