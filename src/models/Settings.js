import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: String, required: true },
  label: { type: String },
  group: { type: String, default: 'general' }
}, { timestamps: true });

settingsSchema.statics.get = async function (key, fallback = '') {
  const doc = await this.findOne({ key });
  return doc ? doc.value : fallback;
};

settingsSchema.statics.set = async function (key, value, meta = {}) {
  return this.findOneAndUpdate(
    { key },
    { value, ...meta },
    { upsert: true, new: true }
  );
};

settingsSchema.statics.getAll = async function () {
  const docs = await this.find().sort('group key');
  const result = {};
  docs.forEach(d => { result[d.key] = d.value; });
  return result;
};

const Settings = mongoose.model('Settings', settingsSchema);

export const SETTING_KEYS = {
  TWILIO_WHATSAPP_NUMBER: 'twilio_whatsapp_number',
  UPI_ID: 'upi_id',
  SHOP_NAME: 'shop_name',
  SHOP_PHONE: 'shop_phone',
  WELCOME_MESSAGE: 'welcome_message',
};

export const DEFAULT_SETTINGS = [
  { key: SETTING_KEYS.TWILIO_WHATSAPP_NUMBER, value: '+14155238886', label: 'Twilio WhatsApp Number', group: 'whatsapp' },
  { key: SETTING_KEYS.UPI_ID, value: 'merchant@bank', label: 'UPI ID', group: 'payment' },
  { key: SETTING_KEYS.SHOP_NAME, value: 'Grocery Store', label: 'Shop Name', group: 'general' },
  { key: SETTING_KEYS.SHOP_PHONE, value: '', label: 'Shop Phone', group: 'general' },
  { key: SETTING_KEYS.WELCOME_MESSAGE, value: '', label: 'Custom Welcome Message', group: 'general' },
];

export default Settings;
