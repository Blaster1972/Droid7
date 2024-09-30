# Droid7

## Current File Purposes

### `llmIntegration.ts`
- **Purpose**: Manages communication with the Flask application for content generation and language model listing. It validates inputs and outputs with schemas and handles API requests to the Flask endpoint.
- **Key Functions**:
  - `generateContent(input: unknown)`: Validates input, sends a POST request to the Flask API, processes the response, and validates the output against the schema.
  - `listLanguageModels()`: Returns a predefined list of available models.

### `llmIntegrationSchemas.ts`
- **Purpose**: Centralizes schema definitions using Zod for validating input and output structures, ensuring data integrity in API interactions.
- **Key Exports**:
  - Various schemas for message structures, models, and generation requests.
  - `llm`: Defines the interface for language model integration with Botpress.

### `validateSchemas.ts`
- **Purpose**: Provides validation functions to check inputs and outputs against the schemas in `llmIntegrationSchemas.ts`, enhancing error handling and data integrity.

### `index.ts`
- **Purpose**: Main entry point for Botpress actions, integrating functions from `llmIntegration.ts` during action execution.
- **Key Actions**:
  - `generateContent`: Calls `generateContent` after validating input.
  - `listLanguageModels`: Retrieves and validates available model data.

## Considerations

- **`llmIntegration.ts`**:
  - **Pros**: 
    - **Separation of Concerns**: Keeps communication and validation logic distinct for easier debugging and testing.
    - **Flexibility**: Allows for API communication adjustments without altering `index.ts`.
  - **Cons**:
    - **Complexity**: Introduces an additional layer that may be unnecessary for primarily local functions.

## Flask Integration

- **Minimal Validation**: In `app.py`, only perform basic checks for required fields (e.g., text, modelId). 
- **Forwarding Logic**: Process incoming requests and forward them to the relevant API endpoints managed by the TypeScript layer.

## Key Files and Their Roles

- **`index.ts`**: Initializes Botpress integration, handling incoming messages and invoking the local GPT-2 model for text generation.
  - **Important Functions**:
    - `generateContent`: Processes user input to generate text using the LLM.
    - `listLanguageModels`: Fetches and validates available language models.

- **`llmIntegration.ts`**: Handles the logic for interacting with the local language model (GPT-2).
  - **Important Functions**:
    - `listLanguageModels`: Provides a list of selectable models.
    - `generateContent`: Generates responses based on user input.

- **`llmIntegrationSchemas.ts`**: Defines schemas for validating input and output structures used in LLM integration.

- **`app.py`**: Flask application serving as an API endpoint for text generation.
  - **Important Functions**: 
    - `/generate`: Receives input from Botpress and forwards it to the GPT-2 model.

## Overview of the Conversation Flow

1. **User Interaction**: A user sends a message through Mixitup, routed to Botpress.
2. **Botpress Handling**: Processes the incoming message and invokes the handler in `index.ts`.
3. **Model Selection**: Retrieves available models via `listLanguageModels` in `index.ts`.
4. **Text Generation**: Passes the selected model's ID to `generateContent`, which invokes the local model for response generation.
5. **Response Handling**: The generated text is returned to `index.ts`, formatted, and sent back to Botpress.
6. **Final Output**: Botpress returns the generated response to the user in the Mixitup interface.

