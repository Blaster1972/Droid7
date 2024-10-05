import torch
from transformers import GPT2LMHeadModel, GPT2Tokenizer

# Specify the path to your local model
model_path = r'C:\wamp64\www\Droid7\webhook-message\models\gpt2'

# Load your GPT-2 model and tokenizer
model = GPT2LMHeadModel.from_pretrained(model_path)
tokenizer = GPT2Tokenizer.from_pretrained(model_path, clean_up_tokenization_spaces=True)

# Check if the model is in evaluation mode
model.eval()

# Define input text for testing
input_text = "Once upon a time in a distant kingdom, where magic was real and dragons soared in the sky."

# Tokenize the input text
input_ids = tokenizer.encode(input_text, return_tensors='pt')
attention_mask = torch.ones(input_ids.shape, dtype=torch.long)  # Create an attention mask

# Generate output from the model
with torch.no_grad():  # Disable gradient calculation for efficiency
    output = model.generate(
        input_ids,
        attention_mask=attention_mask,
        max_length=100,      # Increase max length for more content
        num_return_sequences=1,
        pad_token_id=tokenizer.eos_token_id,
        do_sample=True,      # Enable sampling
        top_k=50,           # Top-k sampling
        top_p=0.95,         # Nucleus sampling
        temperature=0.7     # Adjust temperature for creativity
    )

# Decode the generated output to text
generated_text = tokenizer.decode(output[0], skip_special_tokens=True)

# Print the generated text
print("Generated text:", generated_text)
