"use client";

import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  count?: number;
  animation?: true | false;
}

const variantStyles: Record<NonNullable<SkeletonProps["variant"]>, string> = {
  text: "rounded h-4",
  circular: "rounded-full",
  rectangular: "rounded-none",
  rounded: "rounded-lg",
};

export function Skeleton({
  variant = "text",
  width,
  height,
  count = 1,
  animation = true,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const baseStyle = "bg-zinc-800";
  const animationClass = animation ? "animate-pulse" : "";
  const variantClass = variantStyles[variant];
  const customStyle = { width, height, ...style };

  const skeleton = (
    <div
      className={`${baseStyle} ${variantClass} ${animationClass} ${className}`.trim()}
      style={customStyle}
      {...props}
    />
  );

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton
            key={i}
            variant={variant}
            width={width}
            height={height}
            animation={animation}
            className={className}
          />
        ))}
      </div>
    );
  }

  return skeleton;
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = "" }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

interface SkeletonButtonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function SkeletonButton({
  width = "120px",
  height = "40px",
  className = ""
}: SkeletonButtonProps) {
  return <Skeleton variant="rounded" width={width} height={height} className={className} />;
}

interface SkeletonCardProps {
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonCard({ className = "", children }: SkeletonCardProps) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 ${className}`}>
      {children || (
        <div className="space-y-4">
          <Skeleton variant="rectangular" width="100%" height={120} />
          <SkeletonText lines={2} />
        </div>
      )}
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export function SkeletonList({ count = 3, className = "" }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}
