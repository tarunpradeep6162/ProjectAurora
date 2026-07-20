import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { motion } from "framer-motion";
import { useMusic } from "../../music/MusicContext";
import Equalizer from "./Equalizer";
import albumCover from "../../assets/images/album.jpg";

function formatTime(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function MusicPlayer() {
  const { 
    playing, 
    toggle, 
    currentTime, 
    duration, 
    seek, 
    volume, 
    setVolume, 
    muted, 
    toggleMute, 
    isLoading 
  } = useMusic();

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 120, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.8,
        type: "spring",
        stiffness: 100,
        damping: 20,
      }}
      className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-3xl border border-white/20 bg-slate-900/60 p-5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(255,105,180,0.25)]"
    >
      <div className="flex flex-col gap-4">
        {/* Main Controls Row */}
        <div className="flex items-center gap-4">

          {/* Premium Vinyl Record with Album Art */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                rotate: playing ? 360 : 0,
              }}
              transition={{
                duration: 4,
                ease: "linear",
                repeat: playing ? Infinity : 0,
              }}
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-gray-900 via-zinc-800 to-black shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
            >
              {/* Vinyl grooves effect */}
              <div className="absolute inset-1.5 rounded-full border border-dashed border-white/10 pointer-events-none z-10" />
              <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none z-10" />
              
              {/* Center Album Cover Image */}
              <img
                src={albumCover}
                alt="Album"
                className="absolute inset-0 h-full w-full rounded-full object-cover"
              />
            </motion.div>

            {/* Playing equalizer wave indicator ring */}
            {playing && (
              <span className="absolute -inset-1 rounded-full border border-pink-500/40 animate-ping pointer-events-none" />
            )}
          </div>

          {/* Song Info & Timings */}
          <div className="flex-1 overflow-hidden">
            <h3 className="font-semibold text-white tracking-wide truncate">
              Happy Birthday ❤️
            </h3>
            <p className="text-xs text-pink-200/70 tracking-wider uppercase mb-1">
              Our Forever Song
            </p>
            <div className="flex justify-between text-[11px] font-mono text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Play/Pause Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={toggle}
            disabled={isLoading}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all hover:shadow-[0_0_25px_rgba(244,63,94,0.7)] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : playing ? (
              <FaPause size={14} />
            ) : (
              <FaPlay size={14} className="translate-x-0.5" />
            )}
          </motion.button>
        </div>

        {/* Custom Progress Bar / Scrubber */}
        <div className="group relative flex items-center w-full h-2 cursor-pointer">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          {/* Background Track */}
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            {/* Filled Progress Track */}
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Animated Equalizer */}
        <div className="flex justify-center">
          <Equalizer playing={playing} />
        </div>

        {/* Secondary Control Bar: Volume & Mute */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-gray-400">
          <button 
            onClick={toggleMute}
            className="flex items-center gap-1.5 text-xs hover:text-white transition-colors"
          >
            {muted || volume === 0 ? <FaVolumeMute size={13} /> : <FaVolumeUp size={13} />}
            <span className="text-[10px] font-mono">{Math.round(volume * 100)}%</span>
          </button>

          {/* Volume Slider */}
          <div className="flex items-center w-24 h-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1 rounded-full accent-pink-500 bg-white/10 cursor-pointer"
            />
          </div>
        </div>

      </div>
    </motion.div>
  );
}

export default MusicPlayer;
