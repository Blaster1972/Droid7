import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { integrationName } from './package.json'

// Constructor that accepts an object with a bunch of properties that will be sent to botpress
// when deploying the integration.  Press ctrl + space for intellisense of what can be defined.
export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      webhookUrl: z.string().describe('The Mixituip webhook url to post the bot answers to.'),
      endpointUrl: z.string().describe('The Mixitup endpoint url to post the bot answers to.')
    }),
  },
  channels: {
    webhook: {
      // messages: messages.defaults,  // use this to support all message types supported in Botpress Studio
      messages: {
        text: messages.defaults.text, // For our example, we'll specify text messages only
      },
      message: {
        tags: {
          id: {}, // Add this line to tag messages
        },
      },
      conversation: {
        tags: {
          id: {}, // Add this line to tag conversations
        },
      },
    },
    endpoint: {
      // messages: messages.defaults,  // use this to support all message types supported in Botpress Studio
      messages: {
        text: messages.defaults.text, // For our example, we'll specify text messages only
      },
      message: {
        tags: {
          id: {}, // Add this line to tag messages
        },
      },
      conversation: {
        tags: {
          id: {}, // Add this line to tag conversations
        },
      },
    },
  },
  user: {
    tags: {
      id: {}, // Add this line to tag users
    },
  },
  actions: {},
  events: {
    incommingUser: {
      schema: z.object({
        mixitupUserId: z.string().describe('The Mixitup user ID to be upserted.'),
        conversationId: z.string().describe('ID of the conversation related to the user.'),
      }),
    },
  },
})
