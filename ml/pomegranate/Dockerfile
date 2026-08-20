# syntax=docker/dockerfile:1
# CPU TensorFlow image for DenseNet121 + Grad-CAM++ + HBDS inference

FROM tensorflow/tensorflow:2.15.0

WORKDIR /app

COPY requirements.docker.txt ./requirements.txt
# Base image already includes TensorFlow; install only inference extras.
RUN pip install --no-cache-dir -r requirements.txt

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
