import axios from 'axios'; // Ensure axios is imported for HTTP requests
import { ModelSchema } from 'src/interfaces/llmIntegrationSchemas';
import { listLanguageModels } from 'src/interfaces/llmIntegration';

export class MyLLMClient {
  private flaskEndpoint: string; // Property to hold the Flask endpoint

  constructor(flaskEndpoint: string) {
    this.flaskEndpoint = flaskEndpoint; // Initialize the Flask endpoint
  }

  // Update the generateText method
  public async generateText(prompt: string, device: number, modelId: string): Promise<string> {
    try {
      // Retrieve available models
      const availableModels = await listLanguageModels(); 
      // Find the model in the list
      const modelInfo = availableModels.find(m => m.id === modelId); 

      // Check if modelInfo is defined
      if (!modelInfo) {
        throw new Error(`Model with ID ${modelId} not found.`);
      }

      // Validate modelInfo against ModelSchema
      const parsedModel = ModelSchema.safeParse(modelInfo);
      if (!parsedModel.success) {
        throw new Error(`Model validation failed: ${parsedModel.error}`);
      }

      // Assuming that modelInfo.description is defined as an object with a params property
      const modelDescription = typeof modelInfo.description === 'string' ? JSON.parse(modelInfo.description) : modelInfo.description;

      // Prepare the model data with device included in params
      const modelData = {
          id: modelInfo.id,
          description: modelDescription,
          params: {
              ...modelDescription.params, // Include existing params if any
              device,  // Add the device parameter here
          },
      };

      const response = await axios.post(this.flaskEndpoint, {
        text: prompt,
        model: modelData,  // Pass the updated model data
      });

      console.log("Response from Flask API:", response.data);
      return response.data; // Send back the generated text
    } catch (error) {
      console.error('Error generating text:', error);
      throw new Error("Failed to generate text");
    }
  }
}
