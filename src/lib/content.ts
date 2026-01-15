import type { Lang } from "@/lib/i18n";

export type Localized = { en: string; zh: string };

export type Feature = {
  title: Localized;
  description: Localized;
  icon: string;
};

export type Stat = {
  label: Localized;
  value: Localized;
};

export type Tier = {
  name: Localized;
  badge?: Localized;
  description: Localized;
  features: Localized[];
};

export type Example = {
  title: Localized;
  input: Localized;
  mode: "Standard" | "Savage" | "Rizz";
  caption: Localized;
  hashtags: string;
  detected: Localized;
  affiliate: Localized;
};

export type FAQ = {
  question: Localized;
  answer: Localized;
};

export type Step = {
  title: Localized;
  description: Localized;
};

export type Community = {
  title: Localized;
  description: Localized;
};

export const HERO_BULLETS: Localized[] = [
  { en: "Single-call JSON output", zh: "一次请求输出 JSON" },
  {
    en: "3 tones: Standard / Savage / Rizz",
    zh: "3 种语气：Standard / Savage / Rizz",
  },
  { en: "Vision upload for Pro", zh: "Pro 支持识图上传" },
  { en: "English + Chinese supported", zh: "支持中英双语" },
];

export const HERO_VARIANTS: Record<
  "A" | "B",
  { title: Localized; subtitle: Localized }
> = {
  A: {
    title: {
      en: "Turn any moment into a lit caption.",
      zh: "把每个瞬间变成爆款文案。",
    },
    subtitle: {
      en: "Generate viral captions and hashtags in seconds. Pick your tone, drop your vibe, post-ready output.",
      zh: "秒出高传播文案与标签。选语气、给场景、一键生成，直接发布。",
    },
  },
  B: {
    title: {
      en: "Captions that hit. Every single time.",
      zh: "文案一出，直接炸场。",
    },
    subtitle: {
      en: "AI-powered caption generator for creators. 3 tones, instant output, copy and go.",
      zh: "为创作者打造的 AI 文案生成器。3 种语气，极速输出，复制即走。",
    },
  },
};

export const HERO_CTA = {
  primary: { en: "Generate caption", zh: "生成文案" },
  secondary: { en: "See examples", zh: "查看示例" },
};

export const STATS: Stat[] = [
  {
    value: { en: "3", zh: "3" },
    label: { en: "Free daily tries", zh: "免费每日次数" },
  },
  {
    value: { en: "20+", zh: "20+" },
    label: { en: "Logged-in quota", zh: "登录用户配额" },
  },
  {
    value: { en: "Unlimited", zh: "无限" },
    label: { en: "Pro generations", zh: "Pro 生成次数" },
  },
  {
    value: { en: "2", zh: "2" },
    label: { en: "Languages supported", zh: "支持语言" },
  },
];

export const FEATURES: Feature[] = [
  {
    icon: "⚡",
    title: { en: "Instant generation", zh: "极速生成" },
    description: {
      en: "One request returns caption, hashtags, and detected object in structured JSON.",
      zh: "单次请求返回文案、标签和识别物体，结构化 JSON 输出。",
    },
  },
  {
    icon: "🎯",
    title: { en: "Tone control", zh: "语气控制" },
    description: {
      en: "Standard for clean, Savage for bold, Rizz for charming. Consistent style every time.",
      zh: "Standard 简洁、Savage 犀利、Rizz 魅惑。每次风格稳定一致。",
    },
  },
  {
    icon: "👁️",
    title: { en: "Vision upload", zh: "识图上传" },
    description: {
      en: "Upload any photo and let AI detect objects for contextual captions (Pro).",
      zh: "上传任意照片，AI 识别物体自动生成场景化文案（Pro 功能）。",
    },
  },
  {
    icon: "🔗",
    title: { en: "Smart affiliates", zh: "智能推荐" },
    description: {
      en: "Auto-match relevant product recommendations based on detected objects.",
      zh: "根据识别物体自动匹配相关产品推荐。",
    },
  },
  {
    icon: "🌐",
    title: { en: "Bilingual ready", zh: "双语支持" },
    description: {
      en: "Full English and Chinese support. Output matches your input language.",
      zh: "完整支持英文和中文。输出语言自动匹配输入。",
    },
  },
  {
    icon: "🔒",
    title: { en: "Privacy first", zh: "隐私优先" },
    description: {
      en: "Your inputs are never stored. Generation happens per request, then data is gone.",
      zh: "绝不存储输入内容。每次请求独立生成，数据即用即弃。",
    },
  },
];

export const TIERS: Tier[] = [
  {
    name: { en: "Guest", zh: "访客" },
    description: {
      en: "Try it free—no sign-up required. Perfect for testing the waters.",
      zh: "免费试用，无需注册。适合体验产品能力。",
    },
    features: [
      { en: "3 generations per day", zh: "每日 3 次生成" },
      { en: "Standard mode only", zh: "仅 Standard 模式" },
      { en: "Text input supported", zh: "支持文字输入" },
      { en: "Ad-supported experience", zh: "含广告展示" },
    ],
  },
  {
    name: { en: "User", zh: "用户" },
    badge: { en: "Free account", zh: "免费账户" },
    description: {
      en: "For casual creators who post daily. More quota to keep your flow going.",
      zh: "适合日常发布的创作者。更高配额保持创作流畅。",
    },
    features: [
      { en: "20 generations per day", zh: "每日 20 次生成" },
      { en: "All 3 tone modes", zh: "全部 3 种语气模式" },
      { en: "Local history (last 50)", zh: "本地历史（最近 50 条）" },
      { en: "No banner ads", zh: "无 Banner 广告" },
    ],
  },
  {
    name: { en: "Pro", zh: "Pro" },
    badge: { en: "Coming soon", zh: "即将推出" },
    description: {
      en: "Unlimited everything. Vision upload, affiliate cards, priority support.",
      zh: "无限次数。识图上传、推荐卡片、优先支持。",
    },
    features: [
      { en: "Unlimited generations", zh: "无限生成" },
      { en: "Vision image upload", zh: "图片识别上传" },
      { en: "Smart affiliate cards", zh: "智能推荐卡片" },
      { en: "Priority AI processing", zh: "AI 优先处理" },
      { en: "Early access to new features", zh: "新功能抢先体验" },
    ],
  },
];

export const EXAMPLES: Example[] = [
  {
    title: { en: "Sneaker drop flex", zh: "球鞋晒图" },
    input: {
      en: "Finally copped the AJ1 Lost & Found. Need something savage.",
      zh: "终于抢到 AJ1 Lost & Found 了。要一句狠一点的。",
    },
    mode: "Savage",
    caption: {
      en: "Years of waiting. Worth every L. 👟🔥",
      zh: "等了好几年。每场抢购都值了。👟🔥",
    },
    hashtags: "#AJ1 #Sneakerhead #CopOrDrop #Kicks",
    detected: { en: "Nike Air Jordan 1", zh: "Nike Air Jordan 1" },
    affiliate: {
      en: "Suggested: Premium sneaker protection spray",
      zh: "推荐：专业球鞋防水喷雾",
    },
  },
  {
    title: { en: "Golden hour travel", zh: "黄金时刻旅行" },
    input: {
      en: "Golden hour in Santorini. Want a dreamy caption.",
      zh: "圣托里尼的黄金时刻。要一句梦幻一点的。",
    },
    mode: "Standard",
    caption: {
      en: "Blue domes, golden hour, zero edits needed. 🇬🇷✨",
      zh: "蓝顶教堂、金色夕阳、无需滤镜。🇬🇷✨",
    },
    hashtags: "#Santorini #GoldenHour #TravelGreece #Wanderlust",
    detected: { en: "Island sunset view", zh: "海岛日落景观" },
    affiliate: {
      en: "Suggested: Travel photography guide",
      zh: "推荐：旅行摄影指南",
    },
  },
  {
    title: { en: "Gym progress selfie", zh: "健身打卡" },
    input: {
      en: "Leg day complete. Need something savage to show the grind.",
      zh: "练腿日结束。要一句能体现努力过程的。",
    },
    mode: "Savage",
    caption: {
      en: "Days when legs don't work are the days that count. 💪",
      zh: "腿走不动路的日子，才是算数的日子。💪",
    },
    hashtags: "#LegDay #GymMotivation #NoPainNoGain #Grind",
    detected: { en: "Gym equipment", zh: "健身器材" },
    affiliate: {
      en: "Suggested: Foam roller for recovery",
      zh: "推荐：筋膜放松滚轴",
    },
  },
  {
    title: { en: "Cozy cafe moment", zh: "惬意咖啡时光" },
    input: {
      en: "Sunday morning coffee vibes. Need something charming.",
      zh: "周日早晨的咖啡氛围。来点魅惑的。",
    },
    mode: "Rizz",
    caption: {
      en: "Caffeine with a side of calm. ☕💫",
      zh: "咖啡配上平静。☕💫",
    },
    hashtags: "#SundayVibes #CoffeeTime #SlowLiving #Cozy",
    detected: { en: "Coffee cup with latte art", zh: "拿铁咖啡" },
    affiliate: {
      en: "Suggested: Portable coffee maker",
      zh: "推荐：便携咖啡机",
    },
  },
  {
    title: { en: "Tech desk setup", zh: "桌面设备" },
    input: {
      en: "Finally got the new MacBook Pro. Clean caption needed.",
      zh: "终于拿到新 MacBook Pro 了。来句简洁的。",
    },
    mode: "Standard",
    caption: {
      en: "New machine, same mission. 🖥️",
      zh: "新设备，同样的使命。🖥️",
    },
    hashtags: "#DeskSetup #MacBookPro #TechLife #Workstation",
    detected: { en: "MacBook Pro", zh: "MacBook Pro" },
    affiliate: { en: "Suggested: Laptop sleeve", zh: "推荐:笔记本电脑内胆包" },
  },
  {
    title: { en: "Pet being cute", zh: "宠物卖萌" },
    input: {
      en: "My cat won't stop staring at me. Something funny.",
      zh: "我家猫一直盯着我看。要句搞笑的。",
    },
    mode: "Standard",
    caption: {
      en: "Judged by the fuzz. 24/7. 🐱",
      zh: "被毛孩子审判。全天候。🐱",
    },
    hashtags: "#CatLife #PetParent #CuteCat #CatLover",
    detected: { en: "Cat", zh: "猫咪" },
    affiliate: { en: "Suggested: Interactive cat toy", zh: "推荐：互动猫玩具" },
  },
  {
    title: { en: "Night out fit", zh: "夜店穿搭" },
    input: {
      en: "Going out tonight. Rizz mode for the fit check.",
      zh: "今晚出门。穿搭照要来点 rizz 的。",
    },
    mode: "Rizz",
    caption: {
      en: "Dressed like I'm the main character. 🌙",
      zh: "穿得像主角一样出场。🌙",
    },
    hashtags: "#OOTD #NightOut #FitCheck #Rizz",
    detected: { en: "Fashion outfit", zh: "时尚穿搭" },
    affiliate: { en: "Suggested: Statement watch", zh: "推荐：个性手表" },
  },
  {
    title: { en: "Food plating flex", zh: "美食摆盘" },
    input: {
      en: "Made homemade pasta. Savage for the effort flex.",
      zh: "自制了意面。要句体现努力过程的狠话。",
    },
    mode: "Savage",
    caption: {
      en: "From scratch. Because store-bought is for amateurs. 🍝",
      zh: "从零开始。因为买现成的都是业余选手。🍝",
    },
    hashtags: "#Homemade #Pasta #Foodie #ChefLife",
    detected: { en: "Fresh pasta dish", zh: "新鲜意面" },
    affiliate: { en: "Suggested: Pasta maker machine", zh: "推荐：意面机" },
  },
  {
    title: { en: "Concert night", zh: "演唱会现场" },
    input: {
      en: "Front row at the show. Need high energy.",
      zh: "演唱会前排。要句高能量的。",
    },
    mode: "Savage",
    caption: {
      en: "Front row. Ears ringing. Zero regrets. 🎸",
      zh: "前排。耳朵嗡嗡响。零后悔。🎸",
    },
    hashtags: "#Concert #LiveMusic #FrontRow #Vibes",
    detected: { en: "Concert stage", zh: "演唱会舞台" },
    affiliate: {
      en: "Suggested: Concert photography guide",
      zh: "推荐：演唱会摄影指南",
    },
  },
];

export const DEMO_VARIANTS: Record<"A" | "B", Example> = {
  A: EXAMPLES[0],
  B: EXAMPLES[4],
};

export const FAQS: FAQ[] = [
  {
    question: {
      en: "Does LitStatus store my content?",
      zh: "LitStatus 会保存我的内容吗？",
    },
    answer: {
      en: "No. Your text and images are used only for generation and are never stored on our servers. Each request is processed independently.",
      zh: "不会。你的文字和图片仅用于生成，绝不会存储在我们的服务器上。每次请求独立处理。",
    },
  },
  {
    question: { en: "How do daily quotas work?", zh: "每日配额如何计算？" },
    answer: {
      en: "Guests get 3 free generations per day. Logged-in users get 20 per day. Quotas reset at midnight UTC. Pro users have unlimited generations.",
      zh: "访客每日 3 次免费生成。登录用户每日 20 次。配额于 UTC 午夜重置。Pro 用户无限次数。",
    },
  },
  {
    question: {
      en: "What's the difference between the 3 tone modes?",
      zh: "3 种语气模式有什么区别？",
    },
    answer: {
      en: "Standard is clean and versatile for any post. Savage is bold, confident, and energetic—great for fitness, achievements, or flexes. Rizz is charming, smooth, and slightly flirty—perfect for selfies and lifestyle content.",
      zh: "Standard 简洁通用，适合任何发布场景。Savage 大胆自信充满能量，适合健身、成就展示。Rizz 魅惑流畅略带调情，适合自拍和生活方式内容。",
    },
  },
  {
    question: {
      en: "When will Pro features launch?",
      zh: "Pro 功能什么时候上线？",
    },
    answer: {
      en: "Pro is in development and will include unlimited generations, vision upload (analyze photos), and smart affiliate cards. Join the wish list to be notified first.",
      zh: "Pro 正在开发中，将包含无限生成、识图上传（分析照片）和智能推荐卡片。加入预约名单第一时间获取通知。",
    },
  },
  {
    question: {
      en: "What languages does LitStatus support?",
      zh: "LitStatus 支持哪些语言？",
    },
    answer: {
      en: "Currently English and Chinese are fully supported. The AI detects your input language and generates captions in the same language. More languages coming soon.",
      zh: "目前完整支持英文和中文。AI 会检测你的输入语言并用同种语言生成文案。更多语言即将推出。",
    },
  },
  {
    question: {
      en: "Can I use captions for commercial purposes?",
      zh: "生成的文案可以用于商业用途吗？",
    },
    answer: {
      en: "Yes! All generated captions are yours to use however you like—personal posts, brand content, client work, no restrictions.",
      zh: "可以！所有生成的文案完全归你所有，可用于个人发布、品牌内容、客户工作，无任何限制。",
    },
  },
  {
    question: {
      en: "How accurate is the object detection?",
      zh: "物体识别有多准确？",
    },
    answer: {
      en: "Vision detection uses advanced AI to identify common objects in photos (sneakers, electronics, food, pets, etc.). It works well for clear, well-lit images. Pro users get the most accurate results.",
      zh: "视觉识别使用先进 AI 识别照片中的常见物体（球鞋、电子产品、食物、宠物等）。对于光线充足、清晰的照片效果最好。Pro 用户获得最准确结果。",
    },
  },
  {
    question: {
      en: "How do affiliate recommendations work?",
      zh: "推荐功能是如何工作的？",
    },
    answer: {
      en: "When an object is detected in your photo or text, we match it with relevant product recommendations. These are curated suggestions to help you discover useful products. Pro users see full affiliate cards.",
      zh: "当在照片或文字中检测到物体时，我们会匹配相关产品推荐。这些是精心策划的建议，帮助你发现实用产品。Pro 用户可以看到完整的推荐卡片。",
    },
  },
];

export const STEPS: Step[] = [
  {
    title: { en: "Describe your moment", zh: "描述你的场景" },
    description: {
      en: "Type what's happening or upload a photo (Pro).",
      zh: "输入场景描述或上传照片（Pro）。",
    },
  },
  {
    title: { en: "Pick your tone", zh: "选择语气" },
    description: {
      en: "Standard for clean, Savage for bold, Rizz for charming.",
      zh: "Standard 简洁、Savage 犀利、Rizz 魅惑。",
    },
  },
  {
    title: { en: "Copy and post", zh: "复制发布" },
    description: {
      en: "Get your caption with hashtags instantly. Ready to go.",
      zh: "瞬间获得带标签的文案。直接可用。",
    },
  },
];

export const COMMUNITY: Community[] = [
  {
    title: { en: "Content creators", zh: "内容创作者" },
    description: {
      en: "Daily posters who need fresh captions fast",
      zh: "日更达人，快速获得新鲜文案",
    },
  },
  {
    title: { en: "Brand marketers", zh: "品牌营销" },
    description: {
      en: "Consistent tone across all social channels",
      zh: "所有社媒渠道保持语气一致",
    },
  },
  {
    title: { en: "Social agencies", zh: "社媒机构" },
    description: {
      en: "Rapid iteration for client campaigns",
      zh: "客户活动文案快速迭代",
    },
  },
  {
    title: { en: "Small businesses", zh: "小微企业" },
    description: {
      en: "Professional posts without hiring copywriters",
      zh: "专业文案无需聘请文案师",
    },
  },
];

export function pick<T extends Localized>(lang: Lang, item: T) {
  return lang === "zh" ? item.zh : item.en;
}
