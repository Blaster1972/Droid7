import { ModelSchema } from './llmIntegrationSchemas';
import { z } from '@botpress/sdk';
import { llm } from './llmIntegrationSchemas';  // Import the llm namespace

// Function to list language models
export async function listLanguageModels(): Promise<llm.Model[]> {  // Use llm.Model[] from the namespace
    const models: llm.Model[] = [   // Specify the model type
        {
            id: 'gpt2',
            name: 'GPT-2',
            description: 'A powerful language model from OpenAI',
            tags: ['general-purpose'],
            input: {
                costPer1MTokens: 0.0000,
                maxTokens: 0,
            },
            output: {
                costPer1MTokens: 0.000,
                maxTokens: 0,
            },
        },
    ];

    // Validate models against ModelSchema before returning
    const validatedModels = models.map(model => {
        const parsedModel = ModelSchema.safeParse(model);  // Use ModelSchema from the schemas
        if (!parsedModel.success) {
            throw new Error(`Model validation failed: ${parsedModel.error}`);
        }
        return parsedModel.data;
    });

    return validatedModels; // Return models that match the ModelSchema
}
