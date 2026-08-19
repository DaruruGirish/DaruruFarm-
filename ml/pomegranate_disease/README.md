Daruru Farms pomegranate disease detection (EfficientNet-B0).

This is a training and inference pipeline. Do not treat results as accurate until
the models are trained on a labeled dataset with hundreds of images per class.

Gallery demo photos are for inference testing only. Do not use them as the training set.

Train a starter model (downloads a public fruit-disease subset first):
  python download_subset.py
  python train.py

Do not train on the five Gallery demo photos.

Run API:
  uvicorn api:app --host 0.0.0.0 --port 8000

NestJS proxies:
  POST /disease-management/vision/leaf
  POST /disease-management/vision/fruit
  POST /disease-management/vision-gallery/:id
