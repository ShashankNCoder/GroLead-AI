import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN) {
  throw new Error('WhatsApp API credentials are not properly configured in .env file');
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  private readonly apiUrl: string;
  private readonly token: string;

  private constructor() {
    this.apiUrl = WHATSAPP_API_URL as string;
    this.token = WHATSAPP_API_TOKEN as string;
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  async sendMessage(phoneNumber: string, message: string) {
    try {
      const url = `${this.apiUrl}messages/chat?token=${this.token}`;
      const payload = {
        to: String(phoneNumber).replace(/[^0-9+]/g, ''), // only digits and plus
        body: String(message)
      };

      console.log('UltraMsg Payload:', payload);
      const response = await axios.post(
        url,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      if ((error as any).response) {
        console.error('UltraMsg API Error Response:', JSON.stringify((error as any).response.data, null, 2));
      } else {
        console.error('Error sending WhatsApp message:', error);
      }
      throw error;
    }
  }

  async sendTemplate(phoneNumber: string, templateName: string, parameters: any[]) {
    try {
      const url = `${this.apiUrl}messages/template?token=${this.token}`;
      const payload = {
        to: String(phoneNumber).replace(/[^0-9+]/g, ''),
        template: templateName,
        parameters: parameters
      };

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp template:', error);
      throw error;
    }
  }

  async getMessageStatus(messageId: string) {
    try {
      const url = `${this.apiUrl}messages/${messageId}?token=${this.token}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting message status:', error);
      throw error;
    }
  }
} 