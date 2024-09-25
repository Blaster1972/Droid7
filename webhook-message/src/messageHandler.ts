import axios from 'axios';

/**
 * Sends the message to Mixitup webhook.
 * 
 * @param {string} webhookUrl - The Mixitup webhook URL
 * @param {object} requestBody - The request payload containing userId, conversationId, and text
 * @returns {Promise<void>}
 */
export async function sendMessageToMixitup(webhookUrl: string, requestBody: object): Promise<void> {
  try {
    await axios.post(webhookUrl, requestBody);
    console.log('Message sent to Mixitup successfully');
  } catch (error) {
    console.error('Error sending message to Mixitup:', error);
    throw error;
  }
}
