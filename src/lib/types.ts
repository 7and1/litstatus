// Shared type definitions for the application

export type CropPreset = "original" | "1:1" | "4:5" | "9:16";

export type GenerateResult = {
  caption: string;
  hashtags: string;
  detected_object: string | null;
  affiliate_category: string | null;
  affiliate: { text: { en: string; zh: string }; link: string } | null;
  quota: {
    plan?: "guest" | "user" | "pro";
    remaining?: number;
    limit?: number;
    isPro: boolean;
  };
};

export type HistoryItem = {
  id: string;
  caption: string;
  hashtags: string;
  mode: import("./constants").Mode;
  createdAt: number;
};

export type ToastState = {
  show: boolean;
  message: string;
  type: "success" | "error";
};

export type Session = {
  access_token: string;
  user: {
    id: string;
    email?: string;
  };
};
