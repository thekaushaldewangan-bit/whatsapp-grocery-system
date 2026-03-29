import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS_DIR = path.join(__dirname, '../../downloads');
fs.ensureDirSync(DOWNLOADS_DIR);

// ==================== DOWNLOAD AUDIO ====================
export const downloadAudio = async (mediaUrl) => {
  try {
    const fileName = `audio-${Date.now()}.ogg`;
    const filePath = path.join(DOWNLOADS_DIR, fileName);

    const response = await axios({
      url: mediaUrl,
      method: 'GET',
      responseType: 'stream',
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN
      }
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        logger.info(`✅ Audio file downloaded: ${filePath}`);
        resolve(filePath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    logger.error('Error downloading audio:', error);
    throw error;
  }
};

// ==================== TRANSCRIBE AUDIO WITH OPENAI WHISPER ====================
export const transcribeAudio = async (audioFilePath) => {
  try {
    const audioData = fs.readFileSync(audioFilePath);
    const formData = new FormData();
    formData.append('file', audioData, 'audio.ogg');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    const transcription = response.data.text;
    logger.info(`📝 Transcription complete: ${transcription}`);

    // Clean up audio file
    fs.removeSync(audioFilePath);

    return transcription;
  } catch (error) {
    logger.error('Error transcribing audio:', error.response?.data || error.message);
    throw error;
  }
};

export default {
  downloadAudio,
  transcribeAudio
};

