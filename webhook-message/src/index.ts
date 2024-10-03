import {z} from '@botpress/sdk';
import * as sdk from '@botpress/sdk';
import * as bp from '.botpress';
import axios from 'axios';
import { sendMessageToWebhook, sendMessageToEndpoint } from './messageHandler';
import { upsertUser } from './upsertUser'; 
import { Payload } from './types'; 
import { listLanguageModels } from './interfaces/llmIntegration'; 
import { 
  GenerateContentInputBaseSchema, 
  GenerateContentOutputSchema,
  ModelSchema
} from './interfaces/llmIntegrationSchemas';
import { MyLLMClient } from 'my-llm-client';

// Define the llm namespace with necessary types
export namespace llm {
  export type GenerateContentInput = z.infer<typeof GenerateContentInputBaseSchema>;
  export type GenerateContentOutput = z.infer<typeof GenerateContentOutputSchema>;
  export type Model = z.infer<typeof ModelSchema>;
}

// Instantiate MyLLMClient and set the Flask endpoint
const flaskEndpoint = 'https://duckling-mighty-rhino.ngrok-free.app/llm/generate';
const myLLM = new MyLLMClient(flaskEndpoint);


const reqBodySchema = sdk.z.object({
  userId: sdk.z.string(),
  conversationId: sdk.z.string(),
  text: sdk.z.string(),
});

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    const { webhookUrl, endpointUrl } = ctx.configuration;
    try {
      await axios.post(webhookUrl, {text: "Testing Webhook"});
      const statusResponseEndpoint = await axios.get(`${endpointUrl}/api/v2/status/version`);
      
      if (statusResponseEndpoint.status === 200) {
        logger.forBot().info('Mixitup registered successfully.');
      } else {
        throw new sdk.RuntimeError('Mixitup endpoint URL is not responsive');
      }
    } catch (error) {
      logger.forBot().error('Failed to register:', error);
      throw new sdk.RuntimeError('Failed to register');
    }
  },

  unregister: async () => {
    console.log('Unregistering integration');
  },

  actions: {
    generateContent: async ({ input }): Promise<llm.GenerateContentOutput> => {
      try {
        // Validate the input
        const validatedInput = GenerateContentInputBaseSchema.safeParse(input);
    
        if (!validatedInput.success) {
          throw new Error('Input validation failed');
        }
    
        console.log("Before generating content", validatedInput);
    
        // Extract validated data
        const { model, messages } = validatedInput.data;
    
        // Use optional chaining to safely access content
        const message = messages?.[0]; // Get the first message
        let text: string;
    
        // Check if the message is defined and has a content property
        if (message && typeof message.content === 'string') {
          text = message.content; // Assign the content to text
        } else {
          throw new Error('Invalid message content'); // Handle invalid content
        }
    
        // Call listLanguageModels to retrieve available models
        const availableModels = await listLanguageModels();
        const currentModel = availableModels.find(m => m.id === model?.id); // Match the model ID
    
        // Generate content using the validated input
        const result = await myLLM.generateText(
          text,                  // The prompt
          0,                    // Device number (default to 0 if not available)
          model?.id || ''       // Model ID
        );
    
        console.log("Generated content result", result);
    
        // Construct the output object using the schema
        const output = GenerateContentOutputSchema.parse({
          id: model?.id || 'unknown-model-id', // Use selected model's ID or a fallback
          provider: currentModel?.name || 'Unknown Provider',  // Get the provider name from the matched model
          model: model?.id || '',       // Model name
          choices: [{
            role: 'assistant',
            index: 0,
            content: result,            // The generated text
            stopReason: 'stop'         // Adjust as necessary
          }],
          usage: {
            inputTokens: 0,            // Replace with actual token count
            inputCost: 0.0,            // Replace with actual input cost
            outputTokens: 0,           // Replace with actual token count
            outputCost: 0.0,           // Replace with actual output cost
          },
          botpress: {
            cost: 0.0,                 // Total cost of the content generation
          },
        });
    
        return output; // Return the constructed output object
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Error generating content: ${error.message}`);
        } else {
          throw new Error('Error generating content: An unknown error occurred.');
        }
      }
    },

    listLanguageModels: async () => {
      try {
        const models = await listLanguageModels();
        const validatedModels = models.map(model => ModelSchema.parse(model)); // Validate models directly
        return { models: validatedModels }; // Return the validated models
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Model validation failed: ${error.message}`);
        } else {
          throw new Error('Unknown error during model validation.');
        }
      }
    },
  },

  channels: {
    webhook: {
      messages: {
        text: async (props) => {
            const { payload, ctx } = props;
            const requestBody: Payload = {
                type: 'text',
                text: payload.text,
            };
            await sendMessageToWebhook(ctx.configuration.webhookUrl, requestBody);
        },
        image: async (props) => {
            const { payload, ctx } = props;
            const requestBody: Payload = {
                type: 'image',
                title: payload.title,
                imageUrl: payload.imageUrl,
            };
            await sendMessageToWebhook(ctx.configuration.webhookUrl, requestBody);
        },
        audio: async (props) => {
            const { payload, ctx } = props;
            const requestBody: Payload = {
                type: 'audio',
                audioUrl: payload.audioUrl,
            };
            await sendMessageToWebhook(ctx.configuration.webhookUrl, requestBody);
        },
        video: async (props) => {
            const { payload, ctx } = props;
            const requestBody: Payload = {
                type: 'video',
                title: payload.title,
                videoUrl: payload.videoUrl,
            };
            await sendMessageToWebhook(ctx.configuration.webhookUrl, requestBody);
        },
        file: async (props) => {
            const { payload, ctx } = props;
            const requestBody: Payload = {
                type: 'file',
                title: payload.title,
                fileUrl: payload.fileUrl,
            };
            await sendMessageToWebhook(ctx.configuration.webhookUrl, requestBody);
        },
        card: async (props) => {
            const { payload, ctx } = props;
            const requestBody: Payload = {
                type: 'card',
                title: payload.title,
                subtitle: payload.subtitle,
                imageUrl: payload.imageUrl,
                actions: payload.actions,
            };
            await sendMessageToWebhook(ctx.configuration.webhookUrl, requestBody);
        },
        carousel: async (props) => {
    const { payload, ctx } = props;
    const requestBody: Payload = {
        type: 'carousel',
        cards: payload.cards.map((card) => ({
            type: 'card', // Add the required type field
            title: card.title,
            subtitle: card.subtitle, // Optional
            imageUrl: card.imageUrl, // Optional
            actions: card.actions, // Ensure actions array is properly structured
        })),
    };
    await sendMessageToWebhook(ctx.configuration.webhookUrl, requestBody);
},
        location: async (props) => {
            const { payload, ctx } = props;
            const requestBody: Payload = {
                type: 'location',
                latitude: payload.latitude,
                longitude: payload.longitude,
            };
            await sendMessageToWebhook(ctx.configuration.webhookUrl, requestBody);
        },
    },
  },
  endpoint: {
      messages: {
        text: async ({ payload, conversation, ack }) => {
            const tags = conversation.tags as Partial<Record<'id' | 'mixitupUserId', string>>;
            const mixitupUserId = tags.mixitupUserId;

            // Call the new sendMessageToEndpoint function
            await sendMessageToEndpoint(payload.text, 'Twitch', false); // Adjust platform and sendAsStreamer as needed
            
            await ack({ tags: { id: mixitupUserId } }); // You may want to handle message ID differently if needed
        },
      },
    },
  },
  
  handler: async (props) => {
    const {
      client,
      req,
      ctx,  // Capture ctx here
    } = props;

    // Handle incoming request
    try {
      if (req.path === "/addUser" && req.method === "POST") {
        const data = JSON.parse(req.body || '{}');
        const { mixitupUserId, conversationId } = data;

        // Validate required fields
        if (!mixitupUserId || !conversationId) {
          return { status: 400, body: JSON.stringify({ error: "Missing required fields" }) };
        }

        // Call upsertUser with the additional URLs
        const upsertResponse = await upsertUser(mixitupUserId, ctx.configuration.endpointUrl);
        return {
          status: upsertResponse.success ? 200 : 500,
          body: JSON.stringify(upsertResponse),
        };
      }

      // Existing conversation handling logic
      let parsedBody;
      try {
        parsedBody = JSON.parse(req.body || '{}');
      } catch (thrown) {
        return {
          status: 400,
          body: JSON.stringify({ error: 'Invalid JSON Body' }),
        };
      }

      const parseResult = reqBodySchema.safeParse(parsedBody);
      if (!parseResult.success) {
        return {
          status: 400,
          body: JSON.stringify({ error: 'Invalid body' }),
        };
      }

      const { userId, conversationId, text } = parseResult.data;

      // Construct the messages array according to your MessageSchema
      const messages = [{
        role: 'user',    // Indicates that this message is from the user
        type: 'text',    // Specifies that this is a text message
        content: text,   // The actual content of the message
      }];

      // Handle conversation creation
      const { conversation } = await client.getOrCreateConversation({
        channel: 'webhook',
        tags: {
          id: conversationId,
        },
      });

      const { user } = await client.getOrCreateUser({
        tags: {
          id: userId,
        },
      });
      
      const { message } = await client.createMessage({
        type: 'text',
        conversationId: conversation.id,
        userId: user.id,
        payload: {
          text,
        },
        tags: {},
      });

            return {
        status: 200,
        body: JSON.stringify({ message }),
      };
    } catch (error) {
      console.error('Error in handler:', error);
      return { status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
    }
  },
});
