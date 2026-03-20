import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Download, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const BAR_COUNT = 40;

export default function AudioPlayer({ audioUrl, title }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const seekBarRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Expose togglePlay via a ref so App.jsx can call it for Space shortcut
  const togglePlayRef = useRef(null);

  // Setup Web Audio API analyser
  const setupAnalyser = useCallback(() => {
    if (analyserRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch {
      // Web Audio API not available
    }
  }, []);

  // Draw waveform visualization
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (analyser && isPlaying) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      const barW = W / BAR_COUNT;
      const step = Math.floor(data.length / BAR_COUNT);

      for (let i = 0; i < BAR_COUNT; i++) {
        const val = data[i * step] / 255;
        const barH = Math.max(2, val * H * 0.85);
        const x = i * barW;
        const y = (H - barH) / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + barH);
        gradient.addColorStop(0, 'rgba(20, 184, 166, 0.9)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.4)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, barW - 2, barH, 2);
        ctx.fill();
      }
    } else {
      // Idle waveform
      for (let i = 0; i < BAR_COUNT; i++) {
        const barW = W / BAR_COUNT;
        const barH = 2 + Math.sin(i * 0.3 + Date.now() * 0.001) * 3;
        const x = i * barW;
        const y = (H - barH) / 2;
        ctx.fillStyle = 'rgba(100, 116, 139, 0.3)';
        ctx.beginPath();
        ctx.roundRect(x + 1, y, barW - 2, barH, 1);
        ctx.fill();
      }
    }

    animRef.current = requestAnimationFrame(drawWaveform);
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    }
    animRef.current = requestAnimationFrame(drawWaveform);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [drawWaveform]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  function togglePlay() {
    setupAnalyser();
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    const audio = audioRef.current;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  }

  // Keep a stable ref for external callers (keyboard shortcut in App.jsx)
  useEffect(() => {
    togglePlayRef.current = togglePlay;
  });

  // Expose togglePlay on the audio element's DOM node as a custom property
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current._togglePlay = () => togglePlay();
    }
  });

  function skip(seconds) {
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  }

  function handleSeek(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  }

  // Keyboard seek support on seek bar
  function handleSeekKeyDown(e) {
    if (!duration) return;
    const step5 = duration * 0.05; // 5% jump
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      skip(step5);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      skip(-step5);
    } else if (e.key === 'Home') {
      e.preventDefault();
      audioRef.current.currentTime = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      audioRef.current.currentTime = duration;
    }
  }

  function handleVolumeChange(e) {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    audioRef.current.volume = vol;
  }

  function toggleMute() {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.volume = newMuted ? 0 : volume || 0.8;
    if (!newMuted && volume === 0) setVolume(0.8);
  }

  function handleSpeedChange(s) {
    setSpeed(s);
    audioRef.current.playbackRate = s;
  }

  function formatTime(secs) {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s2 = Math.floor(secs % 60);
    return `${m}:${s2.toString().padStart(2, '0')}`;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveVolume = isMuted ? 0 : volume;
  const volumePct = Math.round(effectiveVolume * 100);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      role="region"
      aria-label={title ? `Audio player: ${title}` : 'Audio player'}
    >
      {/* Background with glassmorphism */}
      <div className="absolute inset-0 bg-white/[0.03]" />
      <div className="absolute inset-0 bg-[#14B8A6]/[0.03]" />

      {/* Glow orbs */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#14B8A6]/10 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative border border-white/[0.06] rounded-2xl backdrop-blur-sm">
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          crossOrigin="anonymous"
          aria-label={title ? `Audio: ${title}` : 'Converted audio'}
        />

        {/* Waveform visualization */}
        <div className="px-6 pt-6 pb-2" aria-hidden="true">
          <canvas
            ref={canvasRef}
            className="w-full h-16 rounded-lg"
            aria-hidden="true"
          />
        </div>

        <div className="px-6 pb-6">
          {/* Title */}
          {title && (
            <h3 className="text-sm font-semibold text-white/90 mb-4 line-clamp-2 leading-snug text-center">
              {title}
            </h3>
          )}

          {/* Seek bar */}
          <div
            ref={seekBarRef}
            role="slider"
            tabIndex={0}
            aria-label="Seek audio position"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration) || 0}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            className="group h-1.5 bg-white/[0.08] rounded-full cursor-pointer relative hover:h-2.5 transition-all duration-200 mb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60"
            onClick={handleSeek}
            onKeyDown={handleSeekKeyDown}
          >
            <div
              className="h-full bg-gradient-to-r from-[#14B8A6] to-emerald-400 rounded-full transition-all relative overflow-hidden"
              style={{ width: `${progress}%` }}
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg shadow-[#14B8A6]/30 opacity-0 group-hover:opacity-100 transition-all -ml-1.5 ring-2 ring-[#14B8A6]/50"
              style={{ left: `${progress}%` }}
              aria-hidden="true"
            />
          </div>

          {/* Time */}
          <div className="flex justify-between text-[10px] font-mono text-white/30 mb-5" aria-hidden="true">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          {/* Screen-reader time announcement */}
          <span className="sr-only" aria-live="off" aria-atomic="true">
            {formatTime(currentTime)} of {formatTime(duration)}
          </span>

          {/* Main controls */}
          <div className="flex items-center justify-center gap-6 mb-6" role="group" aria-label="Playback controls">
            <button
              onClick={() => skip(-10)}
              aria-label="Skip back 10 seconds"
              className="text-white/30 hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60 rounded-md"
            >
              <SkipBack className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              aria-pressed={isPlaying}
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60',
                isPlaying
                  ? 'bg-white/10 text-white hover:bg-white/15 backdrop-blur-sm border border-white/10'
                  : 'bg-gradient-to-br from-[#14B8A6] to-emerald-500 text-white shadow-xl shadow-[#14B8A6]/25 hover:shadow-2xl hover:shadow-[#14B8A6]/30 hover:scale-105'
              )}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" aria-hidden="true" />
              ) : (
                <Play className="w-6 h-6 ml-1" fill="currentColor" aria-hidden="true" />
              )}
            </button>

            <button
              onClick={() => skip(10)}
              aria-label="Skip forward 10 seconds"
              className="text-white/30 hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60 rounded-md"
            >
              <SkipForward className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Volume */}
            <div className="flex items-center gap-2" role="group" aria-label="Volume controls">
              <button
                onClick={toggleMute}
                aria-label={isMuted || effectiveVolume === 0 ? 'Unmute audio' : 'Mute audio'}
                aria-pressed={isMuted || effectiveVolume === 0}
                className="text-white/30 hover:text-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60 rounded-md"
              >
                {isMuted || effectiveVolume === 0 ? (
                  <VolumeX className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={effectiveVolume}
                onChange={handleVolumeChange}
                aria-label={`Volume: ${volumePct}%`}
                aria-valuetext={`${volumePct}%`}
                className="w-20 h-1 appearance-none rounded-full bg-white/10 cursor-pointer accent-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60"
              />
            </div>

            {/* Speed */}
            <div
              className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]"
              role="group"
              aria-label="Playback speed"
            >
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  aria-label={`Set playback speed to ${s}x`}
                  aria-pressed={speed === s}
                  className={cn(
                    'px-2 py-1 text-[10px] rounded-md font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60',
                    speed === s
                      ? 'bg-[#14B8A6] text-white shadow-md shadow-[#14B8A6]/20'
                      : 'text-white/30 hover:text-white/60'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Download */}
            <a
              href={audioUrl}
              download
              aria-label={title ? `Download audio: ${title}` : 'Download audio file'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-white/30 border border-white/[0.06] rounded-lg hover:border-[#14B8A6]/30 hover:text-[#14B8A6] transition-all bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60"
            >
              <Download className="w-3 h-3" aria-hidden="true" />
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
