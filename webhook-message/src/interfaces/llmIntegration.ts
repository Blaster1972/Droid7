import { ModelSchema } from './llmIntegrationSchemas';
import { z } from '@botpress/sdk';
import { llm } from './llmIntegrationSchemas';  // Import the llm namespace

// Function to list language models
// Function to list language models
export async function listLanguageModels(): Promise<llm.Model[]> {
    const models: llm.Model[] = [
        {
            id: 'gpt2',
            name: 'GPT-2',
            description: 'C:\\wamp64\\www\\Droid7\\webhook-message\\models\\gpt2',  // Local path to GPT-2
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
        {
            id: 'distilgpt2',
            name: 'DistilGPT-2',
            description: 'https://huggingface.co/distilgpt2',  // Online model from Hugging Face
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
        {
            id: 'distilbert-base-uncased',  // ID for DistilBERT
            name: 'DistilBERT',
            description: 'distilbert-base-uncased',  // Hugging Face model ID
            tags: ['roleplay'],  // Tags for clarity
            input: {
                costPer1MTokens: 0.0000,  // Update this as necessary
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
