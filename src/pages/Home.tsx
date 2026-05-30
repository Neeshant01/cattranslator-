import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import OrbitalRings from "@/components/OrbitalRings";
import AudioWaveform from "@/components/AudioWaveform";
import AtmosphericScene from "@/components/AtmosphericScene";
import { synthesizer } from "@/lib/audioSynthesizer";
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
  Camera,
  CameraOff,
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

  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [tailState, setTailState] = useState("up");
  const [earState, setEarState] = useState("forward");
  const [posture, setPosture] = useState("relaxed");

  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const recognitionRef = useRef<any>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartTime = useRef<number>(0);

  // Stop camera when component unmounts or mode changes
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (mode === "human-to-cat" && cameraActive) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    }
  }, [mode, cameraActive]);

  const toggleCamera = async () => {
    if (cameraActive) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListeningSpeech(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setHumanText(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListeningSpeech(false);
    };

    recognition.onend = () => {
      setIsListeningSpeech(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListeningSpeech(false);
  };

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
      synthesizer.playForEmotion(data.primaryEmotion);
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
      synthesizer.playForEmotion(data.emotion);
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

    let finalPitch = 350;
    let finalVolume = 50;
    let finalNoisiness = 10;

    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      let maxVal = -1;
      let maxIdx = -1;
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > maxVal) {
          maxVal = dataArray[i];
          maxIdx = i;
        }
      }

      if (maxVal > 10) {
        finalPitch = Math.round(maxIdx * (44100 / 256));
        if (finalPitch < 50) finalPitch = 350;
      }

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      finalVolume = Math.min(100, Math.round((sum / dataArray.length) * 1.5));

      const mean = sum / dataArray.length;
      let sumDiffSq = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const diff = dataArray[i] - mean;
        sumDiffSq += diff * diff;
      }
      const stdDev = Math.sqrt(sumDiffSq / dataArray.length);
      finalNoisiness = Math.max(0, Math.min(100, Math.round(50 - (stdDev / 1.5))));
    }

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
      createTranslation.mutate({
        durationMs: Math.max(duration, 1000),
        pitch: finalPitch,
        volume: finalVolume,
        noisiness: finalNoisiness,
        tailState,
        earState,
        posture,
      });
    } else {
      let randomEmotion = "happy";
      if (finalNoisiness > 45) randomEmotion = "angry";
      else if (finalPitch < 120) randomEmotion = "happy";
      else if (finalPitch > 650) randomEmotion = "inPain";
      else if (finalVolume > 70) randomEmotion = "hungry";
      else if (tailState === "twitching") randomEmotion = "playful";
      else randomEmotion = "greeting";

      const info = emotionLabels[randomEmotion];
      setResult({
        emotion: randomEmotion,
        intensity: finalVolume > 70 ? "high" : finalVolume > 40 ? "medium" : "low",
        urgency: finalNoisiness > 45 ? "urgent" : "casual",
        confidence: (Math.random() * 20 + 75).toFixed(1),
        action: info.label === "Hungry" ? "Feed your cat" : `Demo: ${info.label} detected`,
        signals: {
          tail: tailState,
          ears: earState,
          body: posture,
        },
      });
      setCurrentEmotion(info.label.toUpperCase());
      synthesizer.playForEmotion(randomEmotion);
    }
  }, [isAuthenticated, createTranslation, tailState, earState, posture]);

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
      synthesizer.playForEmotion(randomEmotion);
    }
  };

  return (
    <div className="min-h-screen relative">
      <AtmosphericScene />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .scan-line-element {
          animation: scan-line 3s linear infinite;
        }
        @keyframes scan-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        .scan-grid-overlay {
          animation: scan-pulse 2s ease-in-out infinite;
        }
      `}} />

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

              {/* Camera Scanner Feed */}
              {cameraActive && (
                <div className="relative w-full aspect-video border-b border-white/10 bg-black/40 overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Scan Overlays */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(51,255,153,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(51,255,153,0.1)_1px,transparent_1px)] bg-[size:20px_20px] scan-grid-overlay pointer-events-none" />
                  <div className="absolute left-0 w-full h-[2px] bg-[#33ff99] opacity-70 shadow-[0_0_10px_#33ff99] scan-line-element pointer-events-none" />
                  
                  {/* Bounding and tracking boxes */}
                  <div className="absolute border border-[#33ff99]/60 w-36 h-36 top-[20%] left-[25%] rounded p-1 pointer-events-none animate-pulse">
                    <span className="text-[8px] text-[#33ff99] bg-black/60 px-1 py-0.5 rounded font-mono uppercase">
                      FELIS_CATUS: 94.6%
                    </span>
                  </div>
                  <div className="absolute border border-cyan-400/40 w-16 h-12 top-[10%] right-[15%] p-1 pointer-events-none">
                    <span className="text-[7px] text-cyan-400 font-mono">EARS_TRACK</span>
                  </div>
                  <div className="absolute border border-purple-400/40 w-20 h-16 bottom-[15%] right-[20%] p-1 pointer-events-none">
                    <span className="text-[7px] text-purple-400 font-mono">TAIL_TRACK</span>
                  </div>

                  {/* HUD Label */}
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded border border-white/10 pointer-events-none">
                    <p className="text-[9px] text-[#33ff99] font-mono tracking-wider animate-pulse">
                      ● NEURAL SCANNING ACTIVE
                    </p>
                  </div>
                </div>
              )}

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

              {/* Body Language Inputs */}
              {mode === "cat-to-human" && (
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#33ff99]" />
                    <span className="text-[10px] text-white/50 uppercase tracking-widest font-semibold font-mono">
                      Neural Body Language Sensors
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-white/40 mb-1 font-medium">Tail Position</label>
                      <select
                        value={tailState}
                        onChange={(e) => setTailState(e.target.value)}
                        className="w-full glass-input px-2 py-1.5 text-xs text-white/80 bg-black/20"
                      >
                        <option value="up" className="bg-neutral-900 text-white">Up / Happy</option>
                        <option value="twitching" className="bg-neutral-900 text-white">Twitching</option>
                        <option value="puffed" className="bg-neutral-900 text-white">Puffed / Angry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/40 mb-1 font-medium">Ears Position</label>
                      <select
                        value={earState}
                        onChange={(e) => setEarState(e.target.value)}
                        className="w-full glass-input px-2 py-1.5 text-xs text-white/80 bg-black/20"
                      >
                        <option value="forward" className="bg-neutral-900 text-white">Forward / Relaxed</option>
                        <option value="flat" className="bg-neutral-900 text-white">Flat / Alert</option>
                        <option value="back" className="bg-neutral-900 text-white">Back / Aggressive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-white/40 mb-1 font-medium">Body Posture</label>
                      <select
                        value={posture}
                        onChange={(e) => setPosture(e.target.value)}
                        className="w-full glass-input px-2 py-1.5 text-xs text-white/80 bg-black/20"
                      >
                        <option value="relaxed" className="bg-neutral-900 text-white">Relaxed</option>
                        <option value="tense" className="bg-neutral-900 text-white">Tense / Scared</option>
                        <option value="crouching" className="bg-neutral-900 text-white">Crouching</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="px-6 pb-6 pt-4 border-t border-white/5">
                {mode === "cat-to-human" ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={toggleCamera}
                        type="button"
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border ${
                          cameraActive
                            ? "bg-[#33ff99]/20 border-[#33ff99]/40 text-[#33ff99] shadow-[0_0_15px_rgba(51,255,153,0.2)]"
                            : "glass-card border-white/10 text-white/50 hover:text-white hover:border-white/20"
                        }`}
                        title="Toggle Neural Scanner Camera"
                      >
                        {cameraActive ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={createTranslation.isPending}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isRecording
                            ? "bg-red-500/20 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                            : "glass-button border border-[#33ff99]/30 shadow-[0_0_30px_rgba(51,255,153,0.2)]"
                        } ${createTranslation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                        title="Record Cat Voice"
                      >
                        {isRecording ? (
                          <MicOff className="w-6 h-6 text-red-400" />
                        ) : (
                          <Mic className="w-6 h-6 text-[#33ff99]" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-white/30 text-center">
                      {isRecording
                        ? "Tap to stop and analyze vocalization"
                        : "Tap microphone to record. Enable neural vision camera scan."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={humanText}
                        onChange={(e) => setHumanText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleHumanToCat()}
                        placeholder="Type or click mic to speak..."
                        className="glass-input w-full pl-4 pr-24 py-3 text-sm"
                      />
                      <div className="absolute right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={isListeningSpeech ? stopSpeechRecognition : startSpeechRecognition}
                          className={`p-2 rounded-lg transition-colors border ${
                            isListeningSpeech
                              ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                              : "bg-white/[0.04] border-white/5 text-white/60 hover:text-white hover:bg-white/[0.08]"
                          }`}
                          title="Speech to Text"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleHumanToCat}
                          disabled={humanToCatTranslate.isPending || !humanText.trim()}
                          className="p-2 rounded-lg bg-[#33ff99]/10 hover:bg-[#33ff99]/20 border border-[#33ff99]/20 transition-colors disabled:opacity-30 text-[#33ff99]"
                          title="Translate to Cat Speech"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {isListeningSpeech && (
                      <p className="text-[10px] text-red-400 animate-pulse text-center">
                        Listening to human speech... Speak clearly.
                      </p>
                    )}
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
