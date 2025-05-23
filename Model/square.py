import os
from PIL import Image

def asymmetric_crop(image_path, size=640):
    img = Image.open(image_path)
    width, height = img.size

    if width < size or height < size:
        raise ValueError(f"Image '{image_path}' is too small to crop a {size}x{size} square.")

    # Calculate excess to be cropped
    excess_w = width - size
    excess_h = height - size

    # Apply asymmetric crop ratios
    left = int(excess_w * 0.47)
    right = width - int(excess_w * 0.53)
    top = int(excess_h * 0.45)
    bottom = height - int(excess_h * 0.55)

    return img.crop((left, top, right, bottom))

def crop_images_in_folder(input_folder, output_folder, size=640):
    os.makedirs(output_folder, exist_ok=True)

    for filename in os.listdir(input_folder):
        if filename.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".gif", ".tiff")):
            input_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, filename)
            try:
                cropped_img = asymmetric_crop(input_path, size=size)
                cropped_img.save(output_path)
                print(f"Saved cropped image: {output_path}")
            except Exception as e:
                print(f"Skipping '{filename}': {e}")

# Example usage
crop_images_in_folder("bhatia", "bhatia_square")