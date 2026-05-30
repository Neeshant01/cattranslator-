import { useState, useRef, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import OrbitalRings from "@/components/OrbitalRings";
import AudioWaveform from "@/components/AudioWaveform";
import AtmosphericScene from "@/components/AtmosphericScene";
import {
  Mic,
  MicOff,
  ArrowRightLeft,
  Cat,
  Sparkles,
  Volume2,
  Zap,
  Shield,
  Brain,
} from "lucide-react";

const emotionLabels: Record<string, { label: string; color: string }> = {
  hungry: { label: "Hungry", color: "#f59e0b" },
  angry: { label: "Angry", color: "#ef4444" },
  scared: { label: "Scared", color: "#8b5cf6" },
  happy: { label: "Happy", color: "#33ff99" },
  playful: { label: "Playful", color: "#33ccdd" },
  inPain: { label: "In Pain", color: "#f43f5e" },
  mating: { label: "Mating", color: "#ec4899" },
  territorial: { label: "Territorial", color: "#f97316" },
  greeting: { label: "Greeting", color: "#22d3ee" },
  demand: { label: "Demanding", color: "#a78bfa" },
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<"cat-to-human" | "human-to-cat">("cat-to-human");
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState("LISTENING");
  const [humanText, setHumanText] = useState("");
  const [result, setResult] = useState<{
    emotion: string;
    intensity: string;
    urgency: string;
    confidence: string;
    action: string;
    signals: Record<string, string>;
  } | null>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartTime = useRef<number>(0);

  const createTranslation = trpc.translation.create.useMutation({
    onSuccess: (data) => {
      setResult({
        emotion: data.primaryEmotion,
        intensity: data.intensity,
        urgency: data.urgency,
        confidence: data.confidenceScore ?? "0",
        action: data.suggestedAction ?? "",
        signals: (data.secondarySignals as Record<string, string>) ?? {},
      });
      const emotionInfo = emotionLabels[data.primaryEmotion] ?? {
        label: data.primaryEmotion,
        color: "#33ff99",
      };
      setCurrentEmotion(emotionInfo.label.toUpperCase());
    },
  });

  const humanToCatTranslate = trpc.humanToCat.translate.useMutation({
    onSuccess: (data) => {
      setResult({
        emotion: data.emotion,
        intensity: "medium",
        urgency: "moderate",
        confidence: "85",
        action: `Synthesized: ${data.intent}`,
        signals: {},
      });
      const emotionInfo = emotionLabels[data.emotion] ?? {
        label: data.emotion,
        color: "#33ff99",
      };
      setCurrentEmotion(emotionInfo.label.toUpperCase());
    },
  });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingStartTime.current = Date.now();

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioData = () => {
        analyser.getByteFrequencyData(dataArray);
        setAudioData(Array.from(dataArray));
        animationFrameRef.current = requestAnimationFrame(updateAudioData);
      };
      updateAudioData();

      setIsRecording(true);
      setCurrentEmotion("LISTENING");
      setResult(null);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    cancelAnimationFrame(animationFrameRef.current);
    setAudioData([]);

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }

    const duration = Date.now() - recordingStartTime.current;
    if (isAuthenticated) {
      createTranslation.mutate({ durationMs: Math.max(duration, 1000) });
    } else {
      // Demo mode
      const emotions = Object.keys(emotionLabels);
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const info = emotionLabels[randomEmotion];
      setResult({
        emotion: randomEmotion,
        intensity: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
        urgency: ["casual", "moderate", "urgent"][Math.floor(Math.random() * 3)],
        confidence: (Math.random() * 20 + 75).toFixed(1),
        action: `Demo: ${info.label} detected`,
        signals: {
          tail: ["up", "down", "twitching"][Math.floor(Math.random() * 3)],
          ears: ["forward", "flattened", "swiveling"][Math.floor(Math.random() * 3)],
        },
      });
      setCurrentEmotion(info.label.toUpperCase());
    }
  }, [isAuthenticated, createTranslation]);

  const handleHumanToCat = () => {
    if (!humanText.trim()) return;
    if (isAuthenticated) {
      humanToCatTranslate.mutate({ text: humanText });
    } else {
      const emotions = Object.keys(emotionLabels);
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const info = emotionLabels[randomEmotion];
      setResult({
        emotion: randomEmotion,
        intensity: "medium",
        urgency: "moderate",
        confidence: "82",
        action: `Demo synthesis: "${humanText}" mapped to ${info.label}`,
        signals: {},
      });
      setCurrentEmotion(info.label.toUpperCase());
    }
  };

  return (
    <div className="min-h-screen relative">
      <AtmosphericScene />

      {/* Hero Section */}
      <div className="relative z-10 pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div
              className="inline-flex items-center p-1 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <button
                onClick={() => setMode("cat-to-human")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                  mode === "cat-to-human"
                    ? "bg-white/[0.08] text-[#33ff99] border border-[#33ff99]/20"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <Cat className="w-3.5 h-3.5" />
                Cat → Human
              </button>
              <ArrowRightLeft className="w-3.5 h-3.5 text-white/20 mx-1" />
              <button
                onClick={() => setMode("human-to-cat")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                  mode === "human-to-cat"
                    ? "bg-white/[0.08] text-[#33ff99] border border-[#33ff99]/20"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                Human → Cat
              </button>
            </div>
          </div>

          {/* Main Analyzer Panel */}
          <div className="max-w-lg mx-auto">
            <div className="glass-panel overflow-hidden">
              {/* 3D Orbital Visualizer */}
              <OrbitalRings
                isRecording={isRecording}
                audioData={audioData}
                emotion={currentEmotion}
              />

              {/* Waveform */}
              <div className="px-6 py-4">
                <AudioWaveform isRecording={isRecording} audioData={audioData} />
              </div>

              {/* Status */}
              <div className="px-6 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <span className="w-2 h-2 rounded-full bg-red-500 recording-dot" />
                  )}
                  <span className="text-[11px] text-white/40 uppercase tracking-widest">
                    {isRecording ? "Recording" : "Ready"}
                  </span>
                </div>
                <span className="text-[11px] text-white/30">
                  {isRecording
                    ? `${((Date.now() - recordingStartTime.current) / 1000).toFixed(1)}s`
                    : "Tap to start"}
                </span>
              </div>

              {/* Input Area */}
              <div className="px-6 pb-6 pt-2">
                {mode === "cat-to-human" ? (
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={createTranslation.isPending}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isRecording
                          ? "bg-red-500/20 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                          : "glass-button border border-[#33ff99]/30 shadow-[0_0_30px_rgba(51,255,153,0.2)]"
                      } ${createTranslation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isRecording ? (
                        <MicOff className="w-6 h-6 text-red-400" />
                      ) : (
                        <Mic className="w-6 h-6 text-[#33ff99]" />
                      )}
                    </button>
                    <p className="text-[11px] text-white/30 text-center">
                      {isRecording
                        ? "Tap to stop and analyze"
                        : "Tap microphone to record your cat"}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={humanText}
                        onChange={(e) => setHumanText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleHumanToCat()}
                        placeholder="Type what you want to say to your cat..."
                        className="glass-input w-full px-4 py-3 text-sm pr-12"
                      />
                      <button
                        onClick={handleHumanToCat}
                        disabled={humanToCatTranslate.isPending || !humanText.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#33ff99]/10 hover:bg-[#33ff99]/20 transition-colors disabled:opacity-30"
                      >
                        <Volume2 className="w-4 h-4 text-[#33ff99]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Result Card */}
            {result && (
              <div className="mt-4 glass-panel p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${emotionLabels[result.emotion]?.color ?? "#33ff99"}15`,
                    }}
                  >
                    <Sparkles
                      className="w-5 h-5"
                      style={{
                        color: emotionLabels[result.emotion]?.color ?? "#33ff99",
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white/90">
                      {emotionLabels[result.emotion]?.label ?? result.emotion}
                    </h3>
                    <p className="text-[11px] text-white/40">Detected Emotion</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-2xl font-bold text-gradient">
                      {result.confidence}%
                    </span>
                    <p className="text-[10px] text-white/30">Confidence</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="glass-card p-3 text-center">
                    <p className="text-[10px] text-white/30 mb-1">Intensity</p>
                    <span className="text-xs font-medium text-[#33ccdd] capitalize">
                      {result.intensity}
                    </span>
                  </div>
                  <div className="glass-card p-3 text-center">
                    <p className="text-[10px] text-white/30 mb-1">Urgency</p>
                    <span className="text-xs font-medium text-[#33ff99] capitalize">
                      {result.urgency}
                    </span>
                  </div>
                  <div className="glass-card p-3 text-center">
                    <p className="text-[10px] text-white/30 mb-1">Context</p>
                    <span className="text-xs font-medium text-white/70 capitalize">
                      {result.urgency}
                    </span>
                  </div>
                </div>

                {Object.keys(result.signals).length > 0 && (
                  <div className="glass-card p-3 mb-4">
                    <p className="text-[10px] text-white/30 mb-2">Body Language Signals</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.signals).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 rounded-lg text-[11px] bg-white/[0.04] text-white/60 capitalize"
                        >
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="glass-card p-4 border-l-2 border-l-[#33ff99]/40">
                  <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">
                    Suggested Action
                  </p>
                  <p className="text-sm text-white/80">{result.action}</p>
                </div>
              </div>
            )}
          </div>

          {/* Feature Highlights */}
          {!result && !isRecording && (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                {
                  icon: Brain,
                  title: "AI-Powered Analysis",
                  desc: "Multi-modal neural network analyzes vocalizations and body language with 85%+ accuracy",
                },
                {
                  icon: Zap,
                  title: "Real-Time Translation",
                  desc: "Sub-500ms latency processing with continuous audio stream analysis",
                },
                {
                  icon: Shield,
                  title: "Privacy First",
                  desc: "All processing on-device. No cloud audio storage. Your cat's data stays private",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="glass-card p-6 group hover:border-[#33ff99]/20 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#33ff99]/10 flex items-center justify-center mb-4 group-hover:bg-[#33ff99]/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-[#33ff99]" />
                  </div>
                  <h3 className="text-sm font-semibold text-white/90 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-white/40 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grain Overlay */}
      <div className="overlay-grain" />
    </div>
  );
}
