import { useRef, useEffect, useCallback } from "react";

interface AudioWaveformProps {
  isRecording: boolean;
  audioData: number[];
}

export default function AudioWaveform({ isRecording, audioData }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!isRecording || audioData.length === 0) {
      // Draw idle line
      ctx.strokeStyle = "rgba(51, 255, 153, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw small dots
      for (let i = 0; i < 50; i++) {
        const x = (i / 50) * width;
        const dotHeight = Math.sin(Date.now() * 0.001 + i * 0.5) * 3;
        ctx.fillStyle = "rgba(51, 255, 153, 0.2)";
        ctx.fillRect(x - 0.5, height / 2 - dotHeight / 2, 1, dotHeight);
      }
      return;
    }

    // Draw waveform
    const barWidth = width / audioData.length;

    for (let i = 0; i < audioData.length; i++) {
      const value = audioData[i] / 255;
      const barHeight = value * height * 0.8;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "rgba(51, 255, 153, 0.1)");
      gradient.addColorStop(0.5, `rgba(51, 255, 153, ${0.3 + value * 0.5})`);
      gradient.addColorStop(1, "rgba(51, 204, 221, 0.1)");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 0.5, barHeight);
    }

    // Draw center line
    ctx.strokeStyle = "rgba(51, 255, 153, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, [isRecording, audioData]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={80}
      className="w-full h-20 rounded-xl"
    />
  );
}
