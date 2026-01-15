export type AffiliatePayload = {
  text: string;
  link: string;
};

export const AFFILIATE_MAP: Record<string, AffiliatePayload> = {
  "Sneaker Cleaning Kit": {
    text: "想要保持你的 Sneaker 干净？推荐这款洗鞋神器 🔥",
    link: "https://www.amazon.com/s?k=sneaker+cleaning+kit&tag=YOUR_TAG-20",
  },
  "Phone Case": {
    text: "给新手机配个最硬核的壳 🛡️",
    link: "https://www.amazon.com/s?k=rugged+phone+case&tag=YOUR_TAG-20",
  },
  "Camera Lens Cleaner": {
    text: "照片要清晰，镜头得干净 📷",
    link: "https://www.amazon.com/s?k=camera+cleaning+kit&tag=YOUR_TAG-20",
  },
};
