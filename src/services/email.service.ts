import axios from 'axios';
import logger from 'jet-logger';

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: any[];
}

export class EmailService {
  /**
   * Envoie un email via le service externe
   */
  static async sendEmail(payload: EmailPayload) {
    const emailApiUrl = process.env.EMAIL_API_URL || '';
    try {
      if (!emailApiUrl) {
        logger.warn('EMAIL_API_URL non configurée. Email non envoyé.');
        return;
      }

      const response = await axios.post(emailApiUrl, payload);
      logger.info(`Email envoyé avec succès à : ${payload.to}`);
      return response.data;
    } catch (error: any) {
      logger.err(`Erreur lors de l'envoi de l'email : ${error.message}`);
      throw error;
    }
  }
}
