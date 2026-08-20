# syntax=docker/dockerfile:1
# CPU TensorFlow + Keras 3 for DenseNet121 + Grad-CAM++ + HBDS inference
# Models were saved as Keras 3 .keras — TF 2.15 (Keras 2) cannot load them.

FROM tensorflow/tensorflow:2.17.0

WORKDIR /app

COPY requirements.docker.txt ./requirements.txt
# Base image includes TensorFlow/Keras. Only install inference extras.
# blinker: distutils copy in some TF images cannot be uninstalled cleanly.
RUN pip install --no-cache-dir --ignore-installed blinker \
    && pip install --no-cache-dir -r requirements.txt

COPY infer.py serve.py ./
COPY models ./models

ENV TF_CPP_MIN_LOG_LEVEL=3
ENV POMEGRANATE_INFER_HOST=0.0.0.0
ENV POMEGRANATE_INFER_PORT=8001
ENV OMP_NUM_THREADS=4
ENV TF_NUM_INTRAOP_THREADS=4
ENV TF_NUM_INTEROP_THREADS=2

EXPOSE 8001
CMD ["python", "serve.py"]
