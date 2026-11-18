
from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import numpy as np
import cv2
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="SmartCentre AI")

# Load pretrained YOLO model
model = YOLO("yolo11n.pt")

# COCO class IDs
TARGET_CLASSES = {
    0: "person",
    56: "chair",
    60: "dining_table",
    63: "laptop",
    62: "tv"
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)
@app.get("/health")
def health():
    return {"status": "AI service running"}

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):

    contents = await file.read()

    image_array = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if frame is None:
        return {"error": "Invalid image"}

    results = model.predict(
        frame,
        conf=0.45,
        verbose=False
    )

    detected = {
        "person": 0,
        "chair": 0,
        "dining_table": 0,
        "laptop": 0,
        "tv": 0
    }

    boxes = []

    for result in results:
        for box in result.boxes:

            class_id = int(box.cls[0])

            if class_id in TARGET_CLASSES:

                name = TARGET_CLASSES[class_id]
                confidence = float(box.conf[0])

                detected[name] += 1

                x1, y1, x2, y2 = map(
                    int, box.xyxy[0].tolist()
                )

                boxes.append({
                    "class": name,
                    "confidence": round(confidence, 3),
                    "box": [x1, y1, x2, y2]
                })

    return {
        "success": True,
        "peopleCount": detected["person"],
        "objects": detected,
        "detections": boxes
    }
