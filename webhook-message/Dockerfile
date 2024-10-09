FROM nvidia/cuda:12.6.1-runtime-ubuntu24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV NV_CUDNN_VERSION=9.3.0.75-1
ENV NV_CUDNN_PACKAGE_NAME=libcudnn9-cuda-12
ENV NV_CUDNN_PACKAGE=libcudnn9-cuda-12=${NV_CUDNN_VERSION}
ENV PYTHONPATH="/app/droid7"

RUN apt-get update && apt-get install -y curl && \
    curl https://sh.rustup.rs -sSf | sh -s -- -y && \
    apt-get install -y --no-install-recommends \
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

RUN [ ! -e /usr/bin/python ] && ln -s /usr/bin/python3 /usr/bin/python || echo "Symbolic link for python already exists."

WORKDIR /app

COPY requirements.txt .  
COPY droid7 /app/droid7  

ENV PATH="/app/venv/bin:${PATH}"

RUN python3 -m venv ./venv

RUN ./venv/bin/pip install --upgrade pip setuptools wheel && \
    ./venv/bin/pip install --no-cache-dir -r requirements.txt

RUN ./venv/bin/pip list

EXPOSE 8000

CMD ["./venv/bin/python", "droid7/manage.py", "runserver", "0.0.0.0:8000"]  # Specify the correct path to manage.py
