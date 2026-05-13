"use client";

interface AudioVisualizerProps {
  playing: boolean;
}

const BAR_ANIMATIONS = ["bar1", "bar2", "bar3", "bar4", "bar5"];

export default function AudioVisualizer({ playing }: AudioVisualizerProps) {
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 40 }}>
      {BAR_ANIMATIONS.map((name, i) => (
        <div
          key={name}
          className="w-[3px] rounded-full bg-spotify-green"
          style={{
            height: playing ? undefined : 4,
            opacity: playing ? 1 : 0.35,
            animationName: playing ? name : "none",
            animationDuration: ["1.2s", "1.0s", "1.4s", "0.9s", "1.1s"][i],
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}
