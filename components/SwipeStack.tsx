"use client";
import { useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  PanInfo,
} from "framer-motion";
import { SpotifyTrack, SwipeDirection } from "@/types";
import SongCard from "./SongCard";
import { useAudio } from "@/hooks/useAudio";

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

export interface SwipeStackHandle {
  swipe: (direction: SwipeDirection) => void;
}

interface SwipeStackProps {
  currentTrack: SpotifyTrack | null;
  nextTrack: SpotifyTrack | null;
  thirdTrack: SpotifyTrack | null;
  onSwipe: (direction: SwipeDirection) => void;
  disabled?: boolean;
}

const SwipeStack = forwardRef<SwipeStackHandle, SwipeStackProps>(
  function SwipeStack({ currentTrack, nextTrack, thirdTrack, onSwipe, disabled }, ref) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 300], [-20, 20]);
    const keepOpacity = useTransform(x, [20, 120], [0, 1]);
    const removeOpacity = useTransform(x, [-120, -20], [1, 0]);
    const controls = useAnimation();
    const firingRef = useRef(false);

    const { playing, progress, play, pause } = useAudio(
      currentTrack?.preview_url ?? null
    );

    useEffect(() => {
      if (currentTrack?.preview_url) {
        const t = setTimeout(() => play(), 350);
        return () => clearTimeout(t);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrack?.id]);

    const fireSwipe = useCallback(
      async (direction: SwipeDirection) => {
        if (disabled || firingRef.current) return;
        firingRef.current = true;
        pause();
        await controls.start({
          x: direction === "keep" ? 700 : -700,
          rotate: direction === "keep" ? 25 : -25,
          opacity: 0,
          transition: { duration: 0.32, ease: "easeIn" },
        });
        x.set(0);
        controls.set({ x: 0, rotate: 0, opacity: 1 });
        firingRef.current = false;
        onSwipe(direction);
      },
      [controls, disabled, onSwipe, pause, x]
    );

    useImperativeHandle(ref, () => ({ swipe: fireSwipe }), [fireSwipe]);

    const handleDragEnd = useCallback(
      (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const shouldSwipe =
          Math.abs(info.offset.x) > SWIPE_THRESHOLD ||
          Math.abs(info.velocity.x) > SWIPE_VELOCITY_THRESHOLD;

        if (shouldSwipe) {
          fireSwipe(info.offset.x > 0 ? "keep" : "remove");
        } else {
          controls.start({
            x: 0,
            rotate: 0,
            transition: { type: "spring", stiffness: 300, damping: 20 },
          });
        }
      },
      [controls, fireSwipe]
    );

    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "ArrowRight" || e.key === "l" || e.key === "L")
          fireSwipe("keep");
        if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J")
          fireSwipe("remove");
        if (e.key === " ") {
          e.preventDefault();
          playing ? pause() : play();
        }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [disabled, fireSwipe, playing, play, pause]);

    if (!currentTrack) return null;

    return (
      <div className="relative w-full h-full" style={{ perspective: 1200 }}>
        {/* Third card */}
        {thirdTrack && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-30 scale-[0.88] -translate-y-8 pointer-events-none">
            <SongCard track={thirdTrack} playing={false} progress={0} />
          </div>
        )}

        {/* Second card */}
        {nextTrack && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-70 scale-[0.94] -translate-y-4 pointer-events-none">
            <SongCard track={nextTrack} playing={false} progress={0} />
          </div>
        )}

        {/* Top draggable card */}
        <motion.div
          className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
          style={{ x, rotate }}
          initial={{ opacity: 1 }}
          drag={disabled ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.85}
          onDragEnd={handleDragEnd}
          animate={controls}
          whileDrag={{ scale: 1.03 }}
        >
          <SongCard
            track={currentTrack}
            playing={playing}
            progress={progress}
            overlayX={x}
          />
        </motion.div>

        {/* Hint labels */}
        <motion.span
          className="absolute bottom-6 left-4 text-white/25 text-xs font-semibold pointer-events-none"
          style={{ opacity: removeOpacity }}
        >
          ← Remove
        </motion.span>
        <motion.span
          className="absolute bottom-6 right-4 text-white/25 text-xs font-semibold pointer-events-none"
          style={{ opacity: keepOpacity }}
        >
          Keep →
        </motion.span>
      </div>
    );
  }
);

export default SwipeStack;
