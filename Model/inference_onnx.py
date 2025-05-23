import onnxruntime as ort
import numpy as np
import cv2
import matplotlib.pyplot as plt
import albumentations as A
from albumentations.pytorch import ToTensorV2

# === CONFIG ===
ONNX_MODEL_PATH = "segmentation_model.onnx"
IMAGE_PATH = "bhatia.jpeg"
TARGET_SIZE = (320, 320)
THRESHOLD = 0.5

# === Load ONNX model ===
session = ort.InferenceSession(ONNX_MODEL_PATH)
input_name = session.get_inputs()[0].name
output_name = session.get_outputs()[0].name

# === Image preprocessing (same as training pipeline) ===
def preprocess(image_path, target_size=(320, 320)):
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to load image: {image_path}")
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    transform = A.Compose([
        A.Resize(*target_size),
        A.Normalize(mean=(0.485, 0.456, 0.406),
                    std=(0.229, 0.224, 0.225)),
        ToTensorV2()
    ])
    
    transformed = transform(image=image)
    tensor_image = transformed['image'].unsqueeze(0).numpy()  # Shape: (1, 3, H, W)
    return image, tensor_image

# === Postprocessing ===
def postprocess(output, original_size):
    pred = output.squeeze()  # shape: (H, W)
    pred_binary = (pred > THRESHOLD).astype(np.uint8) * 255
    pred_resized = cv2.resize(pred_binary, (original_size[1], original_size[0]), interpolation=cv2.INTER_NEAREST)
    return pred_resized

# === Run Inference ===
original_image, input_tensor = preprocess(IMAGE_PATH, TARGET_SIZE)
outputs = session.run([output_name], {input_name: input_tensor.astype(np.float32)})
seg_mask = postprocess(outputs[0], original_image.shape[:2])

# === Visualization ===
def show_result(image, mask):
    plt.figure(figsize=(12, 6))
    plt.subplot(1, 2, 1)
    plt.imshow(image)
    plt.title("Original Image")
    plt.axis("off")

    plt.subplot(1, 2, 2)
    plt.imshow(image)
    plt.imshow(mask, cmap='Reds', alpha=0.4)
    plt.title("Overlayed Segmentation")
    plt.axis("off")

    plt.tight_layout()
    plt.show()

show_result(original_image, seg_mask)

# === Optional: Save the mask
cv2.imwrite("segmentation_mask.png", seg_mask)
print("✅ Segmentation mask saved to segmentation_mask.png")
