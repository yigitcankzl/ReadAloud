import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function AudioPlayer({ audioUrl, title }) {
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
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
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }

  function handleSeek(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const time = pct * duration;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }

  function handleVolumeChange(e) {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    audioRef.current.volume = vol;
  }

  function toggleMute() {
    const audio = audioRef.current;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audio.volume = newMuted ? 0 : volume || 0.8;
    if (!newMuted && volume === 0) setVolume(0.8);
  }

  function handleSpeedChange(newSpeed) {
    setSpeed(newSpeed);
    audioRef.current.playbackRate = newSpeed;
  }

  function formatTime(secs) {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Title */}
      {title && (
        <h3 className="text-base font-semibold text-foreground mb-5 line-clamp-2 leading-snug">
          {title}
        </h3>
      )}

      {/* Play button + Seek bar */}
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={togglePlay}
          className="w-12 h-12 bg-[#14B8A6] text-white rounded-full flex items-center justify-center hover:bg-[#0D9488] active:scale-95 transition-all shadow-md hover:shadow-lg shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          )}
        </button>

        <div className="flex-1">
          {/* Progress track */}
          <div
            ref={progressBarRef}
            className="group h-2 bg-muted rounded-full cursor-pointer relative hover:h-3 transition-all duration-150"
            onClick={handleSeek}
            role="slider"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={duration}
          >
            <div
              className="h-full bg-[#14B8A6] rounded-full"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#14B8A6] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity -ml-2"
              style={{ left: `${progress}%` }}
            />
          </div>
          {/* Time labels */}
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || effectiveVolume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={effectiveVolume}
            onChange={handleVolumeChange}
            className="w-20 h-1.5 appearance-none rounded-full bg-muted cursor-pointer accent-[#14B8A6]"
            aria-label="Volume"
          />
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-lg font-medium transition-all duration-150',
                speed === s
                  ? 'bg-[#14B8A6] text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Download */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5 text-xs border-border/60"
        >
          <a href={audioUrl} download>
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </Button>
      </div>
    </div>
  );
}
