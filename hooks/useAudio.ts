"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export function useAudio(src: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src) return;

    const audio = new Audio(src);
    audio.volume = 0;
    audioRef.current = audio;
    setReady(false);
    setProgress(0);

    const onCanPlay = () => setReady(true);
    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onEnded = () => setPlaying(false);

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      if (fadeRef.current) {
        clearInterval(fadeRef.current);
        fadeRef.current = null;
      }
      audio.pause();
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
      setPlaying(false);
    };
  }, [src]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
    let vol = 0;
    fadeRef.current = setInterval(() => {
      vol = Math.min(vol + 0.05, 0.7);
      if (audio) audio.volume = vol;
      if (vol >= 0.7) {
        clearInterval(fadeRef.current!);
        fadeRef.current = null;
      }
    }, 50);
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
    let vol = audio.volume;
    fadeRef.current = setInterval(() => {
      vol = Math.max(vol - 0.1, 0);
      if (audio) audio.volume = vol;
      if (vol <= 0) {
        clearInterval(fadeRef.current!);
        fadeRef.current = null;
        audio.pause();
      }
    }, 30);
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, play, pause]);

  return { playing, progress, ready, play, pause, toggle };
}
