from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer, DistilBertForSequenceClassification, DistilBertTokenizer
import torch
import os

# Set environment variables for CUDA debugging
os.environ["CUDA_LAUNCH_BLOCKING"] = "1"
os.environ["TORCH_USE_CUDA_DSA"] = "1"


app = Flask(__name__)

# Load model and tokenizer based on the selected model with dynamic params
def load_model(model_info, device=None):
    # Access the URL from the 'description' field
    try:
        path = model_info['description']['url']
        params = model_info['description'].get('params', {})

        # Set torch_dtype
        torch_dtype = torch.float32
        if 'torch_dtype' in params:
            dtype_str = params['torch_dtype']
            torch_dtype = getattr(torch, dtype_str, torch.float32)

        # Load the model and tokenizer
        if 'distilbert' in path.lower():
            model = DistilBertForSequenceClassification.from_pretrained(path).to(device)
            tokenizer = DistilBertTokenizer.from_pretrained(path)
        elif 'dialogpt' in path.lower():
            model = AutoModelForCausalLM.from_pretrained(path, torch_dtype=torch_dtype).to(device)
            tokenizer = AutoTokenizer.from_pretrained(path)
        else:
            model = AutoModelForCausalLM.from_pretrained(path, torch_dtype=torch_dtype).to(device)
            tokenizer = AutoTokenizer.from_pretrained(path)

        return model, tokenizer  # Return exactly two items

    except Exception as e:
        print(f"Error loading model from path '{path}': {str(e)}")  # Enhanced error logging
        raise e  # Re-raise for further handling





def generate_text(prompt, model_info, chat_history_ids=None, device=None):
    input_text = prompt

    try:
        model, tokenizer = load_model(model_info)  # Ensure this line is correct
        if device is not None:
            model.to(device)  # Move model to the specified device
    except Exception as e:
        print(f"Failed to load model: {str(e)}")
        return "Error loading model.", None  # Return error message and None for chat history

    # Initialize chat_history_ids if it's None
    if chat_history_ids is None:
        chat_history_ids = None  # Initialize if not provided

    if 'dialogpt' in model_info['id'].lower():  # Check if the model is DialoGPT
        new_user_input_ids = tokenizer.encode(input_text + tokenizer.eos_token, return_tensors='pt').to(device)
        bot_input_ids = torch.cat([chat_history_ids, new_user_input_ids], dim=-1).to(device) if chat_history_ids is not None else new_user_input_ids
        attention_mask = torch.ones(bot_input_ids.shape, dtype=torch.long).to(device)

        chat_history_ids = model.generate(bot_input_ids, max_length=1000, attention_mask=attention_mask, pad_token_id=tokenizer.eos_token_id)
        generated_text = tokenizer.decode(chat_history_ids[:, bot_input_ids.shape[-1]:][0], skip_special_tokens=True)

        return generated_text, chat_history_ids  # Return generated text and updated chat history
    else:
        # Tokenization and generation for other models
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

        return tokenizer.decode(output[0], skip_special_tokens=True), None  # Return only the generated text and None for chat history


@app.route('/generate', methods=['POST'])
def generate_content():
    try:
        data = request.json
        if not data or 'text' not in data or 'model' not in data:
            return jsonify({'error': 'Missing required fields: text or model'}), 400

        # Extract model info and generate content
        model_info = data['model']
        chat_history_ids = data.get('chat_history_ids', None)  # Optional: chat history IDs from request
        device = data.get('device', None)  # Get device info from request if provided
        generated_text, chat_history_ids = generate_text(data['text'], model_info, chat_history_ids, device)

        # Convert chat_history_ids to a list if it's not None
        if chat_history_ids is not None:
            chat_history_ids = chat_history_ids.tolist()  # Convert tensor to list

        return jsonify({'generated_text': generated_text, 'chat_history_ids': chat_history_ids}), 200

    except Exception as e:
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500



def classify_text(input_text, model_info):
    model, tokenizer = load_model(model_info)
    
    # Tokenize input text
    inputs = tokenizer(input_text, return_tensors='pt')
    with torch.no_grad():
        logits = model(**inputs).logits
    predicted_class = logits.argmax().item()
    
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
        
        predicted_class = classify_text(data['text'], model_info)

        return jsonify({'predicted_class': predicted_class}), 200

    except Exception as e:
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
