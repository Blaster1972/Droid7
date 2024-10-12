FROM nvidia/cuda:12.6.1-runtime-ubuntu24.04

# Set non-interactive mode for apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Set CuDNN version and package details
ENV NV_CUDNN_VERSION=9.3.0.75-1
ENV NV_CUDNN_PACKAGE_NAME=libcudnn9-cuda-12
ENV NV_CUDNN_PACKAGE=libcudnn9-cuda-12=${NV_CUDNN_VERSION}
ENV PYTHONPATH="/app"

# Update and install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    python3 \
    python3-pip \
    python3-venv \
    git \
    python3-dev \
    default-libmysqlclient-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create symbolic link for Python
RUN ln -s /usr/bin/python3 /usr/bin/python || echo "Symbolic link for python already exists."

# Set the working directory
WORKDIR /app

# Copy the requirements file and application code
COPY requirements.txt .  
COPY droid7 /app/droid7  

# Set up the virtual environment
RUN python3 -m venv .venv && ls -l /app/.venv/bin/

RUN ls -l /app/.venv/bin/  # To verify contents again

# Upgrade pip and install dependencies
RUN ./.venv/bin/pip install --upgrade pip setuptools wheel && \
    ./.venv/bin/pip install --no-cache-dir -r requirements.txt && \
    ./.venv/bin/pip list

# Expose the application port
EXPOSE 8000

# Start the Django server
CMD ["/app/.venv/bin/python", "/app/droid7/manage.py", "runserver", "0.0.0.0:8000"]
