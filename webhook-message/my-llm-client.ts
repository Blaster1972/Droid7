import axios from 'axios'; // Ensure axios is imported for HTTP requests

export class MyLLMClient {
  private flaskEndpoint: string; // Property to hold the Flask endpoint

  constructor(flaskEndpoint: string) {
    this.flaskEndpoint = flaskEndpoint; // Initialize the Flask endpoint
  }

  // Update the generateText method
  public async generateText(prompt: string, device: number, modelId: string): Promise<string> {
    try {
      const response = await axios.post(this.flaskEndpoint, {
        text: prompt,
        modelId, // Pass the selected model ID here
        device,   // Optionally pass the device ID if needed
      });

      console.log("Response from Flask API:", response.data);
      return response.data; // Send back the generated text
    } catch (error) {
      console.error('Error generating text:', error);
      throw new Error("Failed to generate text");
    }
  }
}
