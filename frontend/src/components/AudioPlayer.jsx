import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function AudioPlayer({ audioUrl, title }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

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
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Audio play failed:', err);
          setIsPlaying(false);
        });
    }
  }

  function skip(seconds) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
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
      <div className="absolute inset-0 bg-white/[0.03]" />
      <div className="absolute inset-0 bg-[#14B8A6]/[0.03]" />

      <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#14B8A6]/10 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative border border-white/[0.06] rounded-2xl backdrop-blur-sm">
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          aria-label={title ? `Audio: ${title}` : 'Converted audio'}
        />

        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-[#14B8A6] via-emerald-400 to-[#14B8A6]" />

        <div className="px-6 py-6">
          {/* Title */}
          {title && (
            <h3 className="text-sm font-semibold text-white/90 mb-5 line-clamp-2 leading-snug text-center">
              {title}
            </h3>
          )}

          {/* Seek bar */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              audioRef.current.currentTime = time;
              setCurrentTime(time);
            }}
            aria-label="Seek audio position"
            className="w-full h-1.5 appearance-none rounded-full bg-white/[0.08] cursor-pointer accent-[#14B8A6] mb-2"
          />

          {/* Time */}
          <div className="flex justify-between text-[10px] font-mono text-white/30 mb-5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

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
