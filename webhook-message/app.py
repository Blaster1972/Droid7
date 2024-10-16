from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer, DistilBertForSequenceClassification, DistilBertTokenizer
import torch
import os
import logging

# Determine base model path based on OS
model_base_path = "C:\\wamp64\\www\\Droid7\\webhook-message\\models" if os.name == "nt" else "/app/models"
#model_base_path = "\\app\\models"
logging.info(f"Model base path: {model_base_path}")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

print(torch.cuda.is_available())
print(torch.__version__)

# Set device automatically
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# Set environment variables for CUDA debugging
os.environ["CUDA_LAUNCH_BLOCKING"] = "1"
os.environ["TORCH_USE_CUDA_DSA"] = "1"
os.environ["USE_FLASH_ATTENTION"] = "1"

app = Flask(__name__)

# Global variables to hold the model and tokenizer
model = None
tokenizer = None

def load_model(model_info):
    global device
    try:
        # Normalize the model path for compatibility
        path = os.path.normpath(model_info['description']['url'])  # Normalize path
        params = model_info['description'].get('params', {})
        
        torch_dtype = torch.float32
        if 'torch_dtype' in params:
            dtype_str = params['torch_dtype']
            torch_dtype = getattr(torch, dtype_str, torch.float32)

        logging.info(f"Loading model from {path}.")  

        # Load models based on path
        if 'distilbert' in path.lower():
            model = DistilBertForSequenceClassification.from_pretrained(path).to(device)
            tokenizer = DistilBertTokenizer.from_pretrained(path)
        elif 'dialogpt' in path.lower():
            model = AutoModelForCausalLM.from_pretrained(path, torch_dtype=torch_dtype).to(device)
            tokenizer = AutoTokenizer.from_pretrained(path)
        else:
            model = AutoModelForCausalLM.from_pretrained(path, torch_dtype=torch_dtype).to(device)
            tokenizer = AutoTokenizer.from_pretrained(path)

        logging.info(f"Model '{path}' loaded successfully on device: {device}.")
        return model, tokenizer

    except Exception as e:
        logging.error(f"Failed to load model {model_info['description']['url']}: {str(e)}")
        return None, None


def classify_text(input_text, model_info):  # Removed device parameter
    logging.info(f"Classifying text with model: {model_info['description']['url']}")
    model, tokenizer = load_model(model_info)  # Adjusted to use global device
    inputs = tokenizer(input_text, return_tensors='pt').to(device)  # Ensure inputs are on the same device
    with torch.no_grad():
        logits = model(**inputs).logits
    predicted_class = logits.argmax().item()
    logging.info("Classification successful.")
    return predicted_class

@app.route('/classify', methods=['POST'])
def classify_content():
    try:
        data = request.json
        if not data or 'text' not in data or 'model' not in data:
            return jsonify({'error': 'Missing required fields: text or model'}), 400

        model_info = data['model']
        
        if not isinstance(model_info, dict):
            return jsonify({'error': 'Model information must be a dictionary.'}), 400
        
        # Ensure classify_text receives all required arguments
        predicted_class = classify_text(data['text'], model_info)  # Removed device parameter
        return jsonify({'predicted_class': predicted_class}), 200

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

# Generate text based on the model and user input
def generate_text(prompt, model_info, chat_history_ids=None):
    input_text = prompt
    try:
        model, tokenizer = load_model(model_info)  # No need to pass device
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        print(f"Failed to load model: {str(e)}")
        return "Error loading model.", None

    # Use 'url' instead of 'id' to access model information
    if 'dialogpt' in model_info['description']['url'].lower():
        new_user_input_ids = tokenizer.encode(input_text + tokenizer.eos_token, return_tensors='pt').to(device)
        bot_input_ids = torch.cat([chat_history_ids, new_user_input_ids], dim=-1).to(device) if chat_history_ids is not None else new_user_input_ids
        attention_mask = torch.ones(bot_input_ids.shape, dtype=torch.long).to(device)

        chat_history_ids = model.generate(bot_input_ids, max_length=1000, attention_mask=attention_mask, pad_token_id=tokenizer.eos_token_id)
        generated_text = tokenizer.decode(chat_history_ids[:, bot_input_ids.shape[-1]:][0], skip_special_tokens=True)

        return generated_text, chat_history_ids
    else:
        input_ids = tokenizer.encode(input_text, return_tensors='pt').to(device)
        attention_mask = torch.ones(input_ids.shape, dtype=torch.long).to(device)
        pad_token_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id

        output = model.generate(
            input_ids,
            max_length=model_info['description']['params'].get('max_length', 50),
            num_return_sequences=1,
            do_sample=True,
            temperature=model_info['description']['params'].get('temperature', 0.7),
            top_k=model_info['description']['params'].get('top_k', 50),
            top_p=model_info['description']['params'].get('top_p', 0.95),
            attention_mask=attention_mask,
        )

        return tokenizer.decode(output[0], skip_special_tokens=True), None

@app.route('/process', methods=['POST'])
def process_content():
    data = request.json
    input_text = data.get('text')

    if not input_text:
        return jsonify({"error": "Input text is required"}), 400

    # First classify the text using DistilBERT
    sentiment_model_info = {
        "description": {
            "url": f"{model_base_path}\\distilbert-base-uncased-finetuned-sst-2-english",
            #"url": os.path.join(model_base_path, "distilbert-base-uncased-finetuned-sst-2-english"),
            "params": {
                "torch_dtype": "float16",
                "temperature": 5,
                "max_length": 150,
                "top_k": 50,
                "top_p": 0.95,
                "num_return_sequences": 1,
                "repetition_penalty": 1.2,
                "do_sample": True
            }
        }
    }

    try:
        predicted_class = classify_text(input_text, sentiment_model_info)  # Removed device parameter
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return jsonify({"error": f"Classification error: {str(e)}"}), 500

    # Determine which model to use based on the predicted class
    if predicted_class == 1:  # Assuming 1 means positive sentiment
        response_model_info = {
            "description": {
                #"url": os.path.join(model_base_path, "DialoGPT-medium"),
                "url": f"{model_base_path}\\DialoGPT-medium",
                "params": {
                    "torch_dtype": "float16",
                    "temperature": 5,
                    "max_length": 150,
                    "top_k": 50,
                    "top_p": 0.95,
                    "num_return_sequences": 1,
                    "repetition_penalty": 1.2,
                    "do_sample": True
                }
            }
        }
    else:  # For negative or neutral sentiment
        response_model_info = {
            "description": {
                #"url": os.path.join(model_base_path, "gpt2"),
                "url": f"{model_base_path}\\gpt2",
                "params": {
                    "torch_dtype": "float16",
                    "temperature": 0.8,
                    "max_length": 128,
                    "top_k": 50,
                    "top_p": 0.85
                }
            }
        }

    # Generate text using the appropriate model
    try:
        generated_text, chat_history_ids = generate_text(input_text, response_model_info)  # Removed device parameter
        return jsonify({
            "input": input_text,
            "predicted_class": predicted_class,
            "generated_text": generated_text
        }), 200
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return jsonify({"error": f"Text generation error: {str(e)}"}), 500

@app.route('/generate', methods=['POST'])
def generate_content():
    try:
        # Extract input data from request
        data = request.json
        if not data or 'text' not in data or 'model' not in data:
            return jsonify({'error': 'Missing required fields: text or model'}), 400

        # Extract model information
        model_info = data.get('model', {})
        model_id = model_info.get('id', None)

        # Generate text using the specified model
        generated_text, _ = generate_text(data['text'], model_info)  # Removed device parameter

        return jsonify({'generated_text': generated_text}), 200

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )
