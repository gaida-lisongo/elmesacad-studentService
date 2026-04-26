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
  /**
   * Envoie un email stylisé avec le lien de téléchargement du document
   */
  static async sendDocumentReadyEmail(studentEmail: string, studentName: string, documentType: string, downloadUrl: string, verificationUrl: string) {
    const subject = `Votre ${documentType} est prêt - INBTP`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1a5f7a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">INBTP - Student Service</h1>
        </div>
        <div style="padding: 30px; color: #333; line-height: 1.6;">
          <p style="font-size: 18px;">Bonjour <strong>${studentName}</strong>,</p>
          <p>Nous avons le plaisir de vous informer que votre <strong>${documentType}</strong> est désormais disponible.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${downloadUrl}" style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Télécharger mon document (PDF)</a>
          </div>
          
          <p style="font-size: 14px; color: #666; background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #1a5f7a;">
            <strong>Note de sécurité :</strong> Ce document contient un QR Code permettant sa vérification officielle. Vous pouvez également vérifier son authenticité via ce lien : <br>
            <a href="${verificationUrl}" style="color: #1a5f7a;">${verificationUrl}</a>
          </p>
          
          <p style="margin-top: 30px;">Si vous avez des questions, n'hésitez pas à contacter le secrétariat de votre section.</p>
          <p>Cordialement,<br>L'administration de l'INBTP</p>
        </div>
        <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px;">
          &copy; ${new Date().getFullYear()} INBTP - Tous droits réservés.
        </div>
      </div>
    `;

    return this.sendEmail({
      to: studentEmail,
      subject,
      html
    });
  }
}
