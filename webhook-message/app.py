import time
from flask import Flask, request, jsonify
import requests
from transformers import GPT2LMHeadModel, GPT2Tokenizer

app = Flask(__name__)

# Load your GPT-2 model and tokenizer
model = GPT2LMHeadModel.from_pretrained('gpt2')
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')

# Function to generate text using GPT-2
def generate_text(input_text):
    input_ids = tokenizer.encode(input_text, return_tensors='pt')
    output = model.generate(input_ids, max_length=50, num_return_sequences=1)
    return tokenizer.decode(output[0], skip_special_tokens=True)

# Flask endpoint to receive requests
@app.route('/generate', methods=['POST'])
def generate_content():
    try:
        data = request.json
        if not data or 'text' not in data or 'userId' not in data or 'conversationId' not in data:
            return jsonify({'error': 'Missing required fields: text, userId, and conversationId'}), 400

        # Generate content using the local model
        generated_text = generate_text(data['text'])

        payload = {
            'payload': {
                'type': 'text',
                'text': generated_text  # Use the generated text here
            },
            'tags': {},  # Adjust if you have specific tags to add
            'userId': data['userId'],  # Dynamic user ID from request
            'conversationId': data['conversationId'],  # Dynamic conversation ID from request
            'type': 'text'
        }

        botpress_api_url = 'https://api.botpress.cloud/v1/chat/messages'
        
        headers = {
            'Authorization': 'Bearer bp_pat_aXhFebEAEV7QUXVriDsoMnokqLpdVJ0VROcN',  # Replace with your actual token
            'Content-Type': 'application/json',
            'x-integration-id': 'intver_01J8FN9V0W8SNHWJQS7W95TR0H',
            'x-bot-id': '58b4e23e-6f7b-4f79-a937-6a10e6e67446'
        }

        response = requests.post(botpress_api_url, json=payload, headers=headers)

        # Log the response details for debugging
        print(f"Botpress API Response Status Code: {response.status_code}")
        print(f"Botpress API Response Body: {response.text}")

        if response.status_code in (200, 201):
            return jsonify(response.json()), response.status_code
        else:
            return jsonify({'error': 'Failed to generate content via Botpress API'}), response.status_code

    except Exception as e:
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
