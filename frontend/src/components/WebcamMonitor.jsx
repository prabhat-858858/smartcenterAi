
import { useEffect, useRef, useState } from "react";
import axios from "axios";

const AI_URL = "http://localhost:8001";
const BACKEND_URL = "http://localhost:8000";

export default function WebcamMonitor({
  centreId,
  classroomId = "ROOM101"
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [count, setCount] = useState(0);
  const [objects, setObjects] = useState({});
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    let stream;
    let interval;
    let active = true;
    let isCapturing = false;

    async function captureFrame() {
      if (!active || isCapturing) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState < 2) return;

      isCapturing = true;

      try {
        canvas.width = 640;
        canvas.height = 480;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, 640, 480);

        const blob = await new Promise((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.75);
        });

        if (!blob || !active) return;

        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");

        // Step 1: Send frame to AI service
        const response = await axios.post(
          `${AI_URL}/detect`,
          formData,
          { timeout: 15000 }
        );

        if (!active) return;

        const result = response.data;

        setCount(result.peopleCount ?? 0);
        setObjects(result.objects ?? {});

        // Step 2: Send results to Node backend
        if (!centreId) {
          setStatus("Centre ID missing");
          return;
        }

        await axios.post(
          `${BACKEND_URL}/api/monitoring/ingest`,
          {
            centreId,
            classroomId,
            peopleCount: result.peopleCount ?? 0,
            objects: result.objects ?? {}
          },
          { timeout: 10000 }
        );

        if (active) {
          setStatus("Monitoring active");
        }

      } catch (error) {
        if (active) {
          if (error.response) {
            console.error(
              "API error:",
              error.response.status,
              error.response.data
            );
            setStatus("Backend/API error");
          } else {
            console.error("Connection error:", error);
            setStatus("AI or backend unavailable");
          }
        }
      } finally {
        isCapturing = false;
      }
    }

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480
          },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (!active) return;

        setStatus("Camera connected");

        interval = setInterval(captureFrame, 2000);

      } catch (error) {
        if (active) {
          setStatus("Camera access failed");
          console.error(error);
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      clearInterval(interval);

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };

  }, [centreId, classroomId]);

  return (
    <div className="p-5 bg-white rounded-xl shadow">

      <h2 className="text-xl font-bold mb-3">
        Live Classroom Monitoring
      </h2>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full rounded-lg"
      />

      <canvas ref={canvasRef} hidden />

      <p className="mt-3">
        Status: {status}
      </p>

      <h3 className="text-lg font-semibold mt-3">
        People detected: {count}
      </h3>

      <div className="mt-3">
        <h4 className="font-semibold">
          Detected objects
        </h4>

        {Object.entries(objects).map(([name, value]) => (
          <p key={name}>
            {name}: {value}
          </p>
        ))}
      </div>

    </div>
  );
}
