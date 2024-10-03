import axios, { AxiosError } from 'axios';
import { MixItUpChatMessage, Configuration, UserApi } from '../mixitup-client'; // Adjust the import path if needed

// Set up the configuration for the API client
const config = new Configuration({
    basePath: 'https://duckling-mighty-rhino.ngrok-free.app/mixitup/api/v2', // Replace with your API base path
});

// Instantiate the UserApi
const userApi = new UserApi(config);

/**
 * Sends the message to Mixitup webhook.
 * 
 * @param {string} webhookUrl - The Mixitup webhook URL
 * @param {object} requestBody - The request payload containing userId, conversationId, and text
 * @returns {Promise<void>}
 */
export async function sendMessageToWebhook(webhookUrl: string, requestBody: object): Promise<void> {
    try {
        await axios.post(webhookUrl, requestBody);
        console.log('Message sent to Mixitup webhook successfully');
    } catch (error) {
        console.error('Error sending message to Mixitup webhook:', error);
        throw error;
    }
}

/**
 * Sends the message to Mixitup endpoint.
 * 
 * @param {string} message - The message to send
 * @param {string} platform - The platform to send the message to
 * @param {boolean} sendAsStreamer - True will force the message to send as the streamer
 * @returns {Promise<void>}
 */
export async function sendMessageToEndpoint(message: string, platform: string = 'Twitch', sendAsStreamer: boolean = false): Promise<void> {
    const chatMessage: MixItUpChatMessage = {
        Message: message,
        Platform: platform,
        SendAsStreamer: sendAsStreamer,
    };

    try {
        const response = await axios.post(`${config.basePath}/chat/message`, chatMessage, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('Message sent to Mixitup endpoint successfully:', response.data);
    } catch (error) {
        // Use type assertion to specify the error as AxiosError
        const axiosError = error as AxiosError;

        // Log the error based on whether it has a response
        if (axiosError.response) {
            console.error('Error sending message to Mixitup endpoint:', axiosError.response.data);
        } else {
            console.error('Error sending message to Mixitup endpoint:', axiosError.message);
        }
    }
}
