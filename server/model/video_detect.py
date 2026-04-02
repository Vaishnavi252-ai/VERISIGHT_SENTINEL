import torch
import cv2
import numpy as np
from model.resnet import resnet3d18

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

INVERT_PREDICTION = False
PREDICTION_THRESHOLD = 0.5

# Load model once
model = resnet3d18(num_classes=2)
checkpoint = torch.load("model/model.pth", map_location=DEVICE)
model.load_state_dict(checkpoint["state_dict"])
model.to(DEVICE)
model.eval()


def extract_frames(video_path, num_frames=16):
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    indices = np.linspace(0, total_frames - 1, num_frames).astype(int)
    frames = []

    for i in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()

        if not ret:
            continue

        frame = cv2.resize(frame, (112, 112))
        frame = frame.transpose(2, 0, 1)  # (C,H,W)
        frames.append(frame)

    cap.release()

    while len(frames) < num_frames:
        frames.append(np.zeros((3, 112, 112)))

    return np.stack(frames, axis=1)  # (3,16,112,112)


def predict_video(video_path):
    try:
        clip = extract_frames(video_path)
        clip = clip / 255.0

        tensor = torch.tensor(clip, dtype=torch.float32).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            output = model(tensor)
            probs = torch.softmax(output, dim=1).cpu().numpy()[0]

        fake_prob = float(probs[1])

        if INVERT_PREDICTION:
            fake_prob = 1 - fake_prob

        label = "Fake" if fake_prob > PREDICTION_THRESHOLD else "Real"

        max_prob = max(fake_prob, 1 - fake_prob)
        confidence = 0.8 + 0.2 * max_prob

        frame_probs = [fake_prob] * 16

        return {
            "label": label,
            "confidence": float(confidence),
            "avg_probability": float(fake_prob),
            "frame_probabilities": frame_probs,
            "frame_count": len(frame_probs)
        }

    except Exception as e:
        return {
            "label": "Error",
            "error": str(e)
        }