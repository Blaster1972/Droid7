
# Language Model Integration Application

This application is a Flask-based web service that integrates multiple language models for tasks such as sentiment classification and text generation. It provides RESTful API endpoints for clients to interact with the models dynamically.

## Features

- **Sentiment Analysis:** Utilizes DistilBERT for classifying input text into sentiment categories.
- **Text Generation:** Supports GPT-2 and DialoGPT for generating text based on user prompts.
- **Dynamic Model Loading:** Loads models on-demand to optimize resource usage.
- **Parameter Configuration:** Allows customization of model parameters through API requests.
- **Device Management:** Automatically assigns models to available computational devices (CPU or CUDA).

## Getting Started

### Prerequisites

- Python 3.x
- Flask
- Transformers
- torch (with CUDA support if using GPU)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

### Usage

1. Start the Flask application:
   ```bash
   python app.py
   ```

2. Send requests to the API endpoints:

   - **Classify Text:**
     - **Endpoint:** `/classify`
     - **Method:** POST
     - **Request Body:**
       ```json
       {
         "text": "<your-input-text>",
         "model": {
           "id": "distilbert-base-uncased-finetuned-sst-2-english",
           "description": {
             "url": "<model-path>",
             "params": {
               "torch_dtype": "float16",
               "temperature": 2.0,
               "max_length": 1000,
               "top_k": 50,
               "top_p": 0.95
             }
           }
         },
         "device": "cuda:0"
       }
       ```
     - **Response:**
       ```json
       {
         "predicted_class": <predicted-class-value>
       }
       ```

   - **Generate Text:**
     - **Endpoint:** `/generate`
     - **Method:** POST
     - **Request Body:**
       ```json
       {
         "prompt": "<your-prompt-text>",
         "model": {
           "id": "<model-id>",
           "description": {
             "url": "<model-path>",
             "params": {
               "torch_dtype": "float16",
               "temperature": 1.0,
               "max_length": 150
             }
           }
         },
         "device": "cuda:0"
       }
       ```
     - **Response:**
       ```json
       {
         "generated_text": "<generated-text-output>"
       }
       ```

## Logging

The application logs important events and errors to assist with debugging. Logs will indicate model loading status, prediction results, and any issues encountered during processing.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
