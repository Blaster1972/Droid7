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


let myLLMClientInstance: MyLLMClient | null = null; // Declare a variable to hold the singleton instance

// Function to get the LLM client
export const getLLMClient = (endpointUrl: string): MyLLMClient => {
  if (!myLLMClientInstance) {
    myLLMClientInstance = new MyLLMClient(endpointUrl); // Create a new instance if it doesn't exist
  }
  return myLLMClientInstance; // Return the singleton instance
};

// Define the llm namespace with necessary types
export namespace llm {
  export type GenerateContentInput = z.infer<typeof GenerateContentInputBaseSchema>;
  export type GenerateContentOutput = z.infer<typeof GenerateContentOutputSchema>;
  export type Model = z.infer<typeof ModelSchema>;
}

// Instantiate MyLLMClient and set the Flask endpoint
//const flaskEndpoint = 'https://duckling-mighty-rhino.ngrok-free.app/llm/generate';
//const flaskEndpoint = 'http://mixitup-endpoint.ddns.net/llm/generate';
//const myLLM = new MyLLMClient(flaskEndpoint);



const reqBodySchema = sdk.z.object({
  userId: sdk.z.string(),
  conversationId: sdk.z.string(),
  text: sdk.z.string(),
});

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    const { webhookUrl, endpointUrl } = ctx.configuration;

    // Instantiate the LLM client with the endpoint URL from the ctx configuration
    const myLLM = getLLMClient(endpointUrl); // Use the singleton function to get the LLM client

    try {
      await axios.post(webhookUrl, { text: "Testing Webhook" });
      const statusResponseEndpoint = await axios.get(`${endpointUrl}/mixitup/api/v2/status/version`);

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
    generateContent: async ({ input, ctx }): Promise<llm.GenerateContentOutput> => {
      try {
          // Extract the endpoint URL from the context
          const { endpointUrl } = ctx.configuration; // Use the context to get the endpoint URL
  
          // Validate the input
          const validatedInput = GenerateContentInputBaseSchema.safeParse(input);
          if (!validatedInput.success) {
              throw new Error('Input validation failed');
          }
  
          const { model, messages } = validatedInput.data;
          const message = messages?.[0];
          let text: string;
  
          if (message && typeof message.content === 'string') {
              text = message.content;
          } else {
              throw new Error('Invalid message content');
          }
  
          // Call listLanguageModels to retrieve available models
          const availableModels = await listLanguageModels();
          const currentModel = availableModels.find(m => m.id === model?.id);
  
          // Pass the correct endpoint to the MyLLMClient
          const myLLM = new MyLLMClient(endpointUrl); // Initialize with the extracted endpoint URL
  
          // Generate content using the validated input
          const result = await myLLM.generateText(text, 0, model?.id || '');
    
        console.log("Generated content result", result);
        
        // Calculate token counts (example logic)
        const inputTokens = text.split(' ').length; // Count of input tokens (rough estimate)
        const outputTokens = result.split(' ').length; // Count of output tokens
    
        // Define cost per token (example values)
        const costPerInputToken = 0.01; // Example cost per input token
        const costPerOutputToken = 0.02; // Example cost per output token
    
        // Calculate costs
        const inputCost = inputTokens * costPerInputToken;
        const outputCost = outputTokens * costPerOutputToken;
        const totalCost = inputCost + outputCost;
    
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
            inputTokens: inputTokens,            // Actual token count
            inputCost: inputCost,                // Actual input cost
            outputTokens: outputTokens,           // Actual token count
            outputCost: outputCost,              // Actual output cost
          },
          botpress: {
            cost: totalCost,                     // Total cost of the content generation
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
        text: async ({ ctx, payload, conversation, ack }) => {
          const tags = conversation.tags as Partial<Record<'id' | 'mixitupUserId', string>>;
          const mixitupUserId = tags.mixitupUserId;

            // Call the new sendMessageToEndpoint function
            await sendMessageToEndpoint(ctx, payload.text, 'Twitch', false); // Adjust platform and sendAsStreamer as needed
            
            await ack({ tags: { id: mixitupUserId } }); // Acknowledge the message, handling ID as needed
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
