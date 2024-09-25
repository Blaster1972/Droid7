import axios, { AxiosError } from 'axios';
import { MixItUpChatMessage, Configuration, UserApi } from '../mixitup-client'; // Adjust the import path if needed
import { Payload } from './types';

import { PayloadSchema } from './types'; // Adjust the path as necessary
import { isTextPayload, isAudioPayload, isCardPayload, isChoicePayload } from './types';

import { z } from 'zod';



const config = new Configuration({
    basePath: 'https://duckling-mighty-rhino.ngrok-free.app/api/v2', // Replace with your API base path
});

// Function to send a message to Mixitup webhook.
export async function sendMessageToWebhook(webhookUrl: string, payload: unknown): Promise<void> {
  try {
      // Validate the payload against the Zod schema
      const validatedPayload = PayloadSchema.parse(payload);

      await axios.post(webhookUrl, validatedPayload);
      console.log('Message sent to Mixitup successfully');
  } catch (error) {
      if (error instanceof z.ZodError) {
          console.error('Validation error:', error.errors);
      } else {
          console.error('Error sending message to Mixitup:', error);
          throw error;
      }
  }
}

// Function to send a message to the MixItUp endpoint.
export async function sendMessageToEndpoint(payload: unknown) {
  try {
      // Validate the payload using Zod before proceeding
      const validatedPayload = PayloadSchema.parse(payload);
      
      const response = await axios.post(`${config.basePath}/chat/message`, validatedPayload, {
          headers: {
              'Content-Type': 'application/json',
          },
      });      
      console.log('Message sent successfully:', response.data);
      return response.data; // Return the response

  } catch (error) {
      if (error instanceof z.ZodError) {
          console.error('Validation error:', error.errors);
      } else {
          const axiosError = error as AxiosError;

          if (axiosError.response) {
              console.error('Error sending message:', axiosError.response.data);
          } else {
              console.error('Error sending message:', axiosError.message);
          }
      }
  }
}

// Helper function to convert payload to a MixItUpChatMessage
function createChatMessageFromPayload(payload: Payload): MixItUpChatMessage {
    if (isTextPayload(payload)) {
        return {
            Message: payload.text,
            Platform: 'Twitch',
            SendAsStreamer: false,
        };
    } else if (isAudioPayload(payload)) {
        return {
            Message: `Audio message: ${payload.audioUrl}`,
            Platform: 'Twitch',
            SendAsStreamer: false,
        };
    } else if (isCardPayload(payload)) {
        return {
            Message: `Card: ${payload.title}, ${payload.subtitle || ''}`,
            Platform: 'Twitch',
            SendAsStreamer: false,
            // You may need to adjust how you format card messages
        };
    } else if (isChoicePayload(payload)) {
        return {
            Message: `Choice: ${payload.text}`,
            Platform: 'Twitch',
            SendAsStreamer: false,
            // You can format choices as needed
        };
    }
    throw new Error('Unsupported payload type');
}
