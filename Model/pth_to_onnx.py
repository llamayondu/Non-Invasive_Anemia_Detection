import torch
import json
import segmentation_models_pytorch as smp
from safetensors.torch import load_file
from torch.serialization import safe_globals

# === CONFIG ===
CONFIG_PATH = "config.json"
WEIGHTS_PATH = "best_model.pth"  # or .safetensors
ONNX_OUTPUT_PATH = "segmentation_model.onnx"
INPUT_SIZE = (1, 3, 320, 320)  # Batch size, Channels, Height, Width

device = torch.device("cpu")

# Load model config from JSON
def load_model_config(config_path):
    with open(config_path, "r") as f:
        return json.load(f)

# Build the model
def get_model_from_config(config):
    return smp.UnetPlusPlus(
        encoder_name=config["encoder_name"],
        encoder_depth=config["encoder_depth"],
        encoder_weights=config["encoder_weights"],
        decoder_use_batchnorm=config["decoder_use_batchnorm"],
        decoder_attention_type=config.get("decoder_attention_type", None),
        in_channels=config["in_channels"],
        classes=config["classes"],
        activation=None
    )

# Fix state_dict keys from torch.compile artifacts
def fix_state_dict(state_dict):
    return {
        (k[len("_orig_mod."):] if k.startswith("_orig_mod.") else k): v
        for k, v in state_dict.items()
    }

# Load weights into the model
def load_weights(model, path):
    if path.endswith(".safetensors"):
        weights = fix_state_dict(load_file(path))
        model.load_state_dict(weights, strict=False)
    else:
        # Use safe unpickling context (optional)
        with safe_globals(["numpy.core.multiarray.scalar"]):
            checkpoint = torch.load(path, map_location="cpu", weights_only=False)

        if "model_state_dict" in checkpoint:
            state_dict = fix_state_dict(checkpoint["model_state_dict"])
        else:
            state_dict = fix_state_dict(checkpoint)
        model.load_state_dict(state_dict, strict=False)

    model.eval()
    return model

# Export the model to ONNX
def export_model_to_onnx(model, output_path, input_size):
    dummy_input = torch.randn(*input_size, device=device)
    torch.onnx.export(
        model, dummy_input, output_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size", 2: "height", 3: "width"},
            "output": {0: "batch_size", 2: "height", 3: "width"}
        }
    )
    print(f"✅ Model exported to ONNX format at: {output_path}")

# Main script
if __name__ == "__main__":
    config = load_model_config(CONFIG_PATH)
    model = get_model_from_config(config).to(device)
    model = load_weights(model, WEIGHTS_PATH)
    export_model_to_onnx(model, ONNX_OUTPUT_PATH, INPUT_SIZE)
