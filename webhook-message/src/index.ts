import * as sdk from '@botpress/sdk';
import * as bp from '.botpress';
import axios from 'axios';
import { sendMessageToMixitup } from './messageHandler';
import { upsertUser } from './upsertUser'; 

const reqBodySchema = sdk.z.object({
  userId: sdk.z.string(),
  conversationId: sdk.z.string(),
  text: sdk.z.string(),
});

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    const { webhookUrl, endpointUrl } = ctx.configuration;
    try {
      await axios.post(webhookUrl, { text: 'Sending test message to Mixitup webhook' });
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

  actions: {},

  channels: {
    webhook: {
      messages: {
        text: async (props) => {
          const { conversation, user, payload, ctx } = props;
          const requestBody = { userId: user.id, conversationId: conversation.id, text: payload.text };
          await sendMessageToMixitup(ctx.configuration.webhookUrl, requestBody);
        },
      },
    },
    endpoint: {
      messages: {
        text: async ({ payload, ctx, conversation, ack }) => {
          const tags = conversation.tags as Partial<Record<'id' | 'mixitupUserId', string>>;
          const mixitupUserId = tags.mixitupUserId;
          const requestBody = { userId: mixitupUserId, conversationId: conversation.id, text: payload.text };
          const messageResponse = await axios.post(`${ctx.configuration.endpointUrl}/messages`, requestBody);
          await ack({ tags: { id: messageResponse.data.message_id } });
        },
      },
    },
  },

  handler: async (props) => {
    const {
        client,
        req,
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

            // Call upsertUser and return response
            const upsertResponse = await upsertUser(mixitupUserId);
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
