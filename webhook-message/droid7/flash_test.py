import torch
from torch.nn.functional import scaled_dot_product_attention

# Check if GPU is available
print("CUDA Available: ", torch.cuda.is_available())

# Set up two random tensors (queries, keys, and values) for attention
q = torch.rand((1, 12, 64, 64), device='cuda')  # Query
k = torch.rand((1, 12, 64, 64), device='cuda')  # Key
v = torch.rand((1, 12, 64, 64), device='cuda')  # Value

# Perform scaled dot-product attention
out = scaled_dot_product_attention(q, k, v, None)

# Check result
print("Output shape: ", out.shape)
print("FlashAttention test successful!")
