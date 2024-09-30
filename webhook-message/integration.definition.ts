import { z, IntegrationDefinition, InterfaceDeclaration,messages, interfaces } from '@botpress/sdk'
import { integrationName } from './package.json'
import { ModelRefSchema } from 'src/interfaces/llmIntegrationSchemas';
import { 
  GenerateContentInputSchema,
  GenerateContentInputBaseSchema,
  GenerateContentOutputSchema,
  ModelSchema
 } from 'src/interfaces/llmIntegrationSchemas';

// Constructor
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
  entities: {
    modelRef: {
      schema: ModelRefSchema,
    },
  },  
  channels: {
    webhook: {
      // messages: messages.defaults,  // use this to support all message types supported in Botpress Studio
      messages: {
        text: {
          schema: z.object({ text: z.string() })
      },
      image: {
          schema: z.object({
              title: z.string(),
              imageUrl: z.string().url(),
          })
      },
      audio: {
          schema: z.object({ audioUrl: z.string().url() })
      },
      video: {
          schema: z.object({
              title: z.string(),
              videoUrl: z.string().url(),
          })
      },
      file: {
          schema: z.object({
              title: z.string(),
              fileUrl: z.string().url(),
          })
      },
      card: {
          schema: z.object({
              title: z.string(),
              subtitle: z.string().optional(),
              imageUrl: z.string().url().optional(),
              actions: z.array(
                  z.object({
                      action: z.enum(['postback', 'url', 'say']),
                      label: z.string(),
                      value: z.string(),
                  })
              ),
          })
      },
      carousel: {
        schema: z.object({
            cards: z.array(
                z.object({
                    title: z.string(),
                    subtitle: z.string().optional(),
                    imageUrl: z.string().url().optional(),
                    actions: z.array(
                        z.object({
                            action: z.enum(['postback', 'url', 'say']),
                            label: z.string(),
                            value: z.string(),
                        })
                    ),
                })
            ),
        }),
    },
      location: {
          schema: z.object({
              latitude: z.number(),
              longitude: z.number(),
          })
      },
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
        //text: messages.defaults.text, // For our example, we'll specify text messages only
        text:{
          schema: z.object({text: z.string()})
        },
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
events: {
  incomingUser: {
    schema: z.object({
      mixitupUserId: z.string().describe('The Mixitup user ID to be upserted.'),
      conversationId: z.string().describe('ID of the conversation related to the user.'),
    }),
  },
},
  
}).extend(interfaces.llm, ({ modelRef }) => ({
  modelRef,
}));
