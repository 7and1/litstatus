"use client";

import { useState, useRef, useEffect } from "react";
import NextImage from "next/image";

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
}

const generateBlurDataURL = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.1);
};

export function LazyImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = "",
  priority = false,
  fill = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  quality = 75,
  placeholder = "blur",
  blurDataURL,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px",
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const defaultBlur = blurDataURL || generateBlurDataURL(width, height);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={`flex items-center justify-center bg-zinc-900 ${className}`}
        style={{ width: fill ? "100%" : width, height: fill ? "100%" : height }}
        role="img"
        aria-label={alt}
      >
        <svg
          className="h-8 w-8 text-zinc-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width: fill ? "100%" : width, height: fill ? "100%" : height }}
    >
      {/* Loading skeleton */}
      {!isLoaded && placeholder === "blur" && (
        <div
          className="absolute inset-0 animate-pulse bg-zinc-800"
          style={{
            backgroundImage: defaultBlur
              ? `url(${defaultBlur})`
              : undefined,
            backgroundSize: "cover",
            filter: "blur(20px)",
          }}
          aria-hidden="true"
        />
      )}

      {/* Actual image */}
      {isInView && (
        <NextImage
          src={src}
          alt={alt}
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          sizes={sizes}
          quality={quality}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading={priority ? "eager" : "lazy"}
        />
      )}
    </div>
  );
}

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ProgressiveImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = "",
}: ProgressiveImageProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.src = src;

    img.onload = () => {
      setImgSrc(src);
      setIsLoaded(true);
    };

    return () => {
      img.onload = null;
    };
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Low-quality placeholder */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
        style={{
          background: `linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
        aria-hidden="true"
      />

      {/* Full image */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
        />
      )}
    </div>
  );
}
