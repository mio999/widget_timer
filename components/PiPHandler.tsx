import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, PictureInPicture2 } from 'lucide-react';

interface PiPHandlerProps {
  timeLeftFormatted: string;
  progress: number; // 0 to 1
  taskName: string;
  isActive: boolean;
}

const PiPHandler: React.FC<PiPHandlerProps> = ({ timeLeftFormatted, progress, taskName, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPipActive, setIsPipActive] = useState(false);

  // Draw the timer on the hidden canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Set canvas size (high res for crisp PiP)
    canvas.width = 512;
    canvas.height = 512;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = 200;

      // Clear
      ctx.fillStyle = '#0f172a'; // Dark background
      ctx.fillRect(0, 0, w, h);

      // Background Circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 40;
      ctx.stroke();

      // Progress Arc
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (2 * Math.PI * (1 - progress));
      
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle, false);
      ctx.strokeStyle = '#f97316'; // Primary Orange
      ctx.lineWidth = 40;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Text - Time
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(timeLeftFormatted, cx, cy - 20);

      // Text - Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(taskName.toUpperCase(), cx, cy + 80);
    };

    const interval = setInterval(draw, 100); // Update 10 times a second is enough for timer
    draw();

    return () => clearInterval(interval);
  }, [timeLeftFormatted, progress, taskName]);

  // Initialize Video Stream from Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (canvas && video && !video.srcObject) {
      const stream = canvas.captureStream(30);
      video.srcObject = stream;
      video.muted = true;
      video.play().catch(e => console.log("Auto-play prevented", e));
    }
  }, []);

  // Handle PiP Toggle
  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else {
        await video.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (error) {
      console.error("PiP failed:", error);
      alert("PiP nie je podporované alebo bolo zablokované.");
    }
  };

  // Listen for PiP close event (e.g. user closes it via system control)
  useEffect(() => {
    const video = videoRef.current;
    const onLeave = () => setIsPipActive(false);
    
    if (video) {
      video.addEventListener('leavepictureinpicture', onLeave);
      return () => video.removeEventListener('leavepictureinpicture', onLeave);
    }
  }, []);

  if (!isActive) return null;

  return (
    <>
      {/* Hidden elements for generating the stream */}
      <canvas ref={canvasRef} className="hidden" />
      <video ref={videoRef} className="hidden" playsInline autoPlay muted loop />

      {/* Toggle Button */}
      <button
        onClick={togglePip}
        className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full backdrop-blur-sm transition-colors"
        title="Otvoriť plávajúci widget"
      >
        {isPipActive ? <Minimize2 size={24} /> : <PictureInPicture2 size={24} />}
      </button>
    </>
  );
};

export default PiPHandler;
