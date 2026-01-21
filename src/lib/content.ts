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
  { en: "One-call JSON output", zh: "单次请求返回 JSON" },
  {
    en: "3 tone modes: Standard / Savage / Rizz",
    zh: "3 种语气：Standard / Savage / Rizz",
  },
  { en: "Image input (Vision)", zh: "支持识图输入" },
  { en: "English + Chinese", zh: "英文 + 中文" },
];

export const HERO_VARIANTS: Record<
  "A" | "B",
  { title: Localized; subtitle: Localized }
> = {
  A: {
    title: {
      en: "Turn moments into captions that hit.",
      zh: "将每个瞬间转化为爆款文案。",
    },
    subtitle: {
      en: "Generate captions + hashtags in seconds. Pick a tone, get post-ready copy.",
      zh: "秒级生成文案与标签。选择语气，即刻发布。",
    },
  },
  B: {
    title: {
      en: "Captions that hit. Every time.",
      zh: "文案秒出，每次炸场。",
    },
    subtitle: {
      en: "AI captions for creators. Three tones, instant output, copy and post.",
      zh: "专为创作者打造的 AI 文案工具。三种语气，即时输出，复制即用。",
    },
  },
};

export const HERO_CTA = {
  primary: { en: "Generate caption", zh: "立即生成" },
  secondary: { en: "View examples", zh: "查看示例" },
};

export const STATS: Stat[] = [
  {
    value: { en: "3", zh: "3" },
    label: { en: "Free daily generations", zh: "每日免费生成次数" },
  },
  {
    value: { en: "No login", zh: "无需登录" },
    label: { en: "Start instantly", zh: "即开即用" },
  },
  {
    value: { en: "Captcha", zh: "验证码" },
    label: { en: "Protected usage", zh: "验证后使用" },
  },
  {
    value: { en: "2", zh: "2" },
    label: { en: "Languages supported", zh: "支持语言数量" },
  },
];

export const FEATURES: Feature[] = [
  {
    icon: "⚡",
    title: { en: "Instant generation", zh: "即时生成" },
    description: {
      en: "One API call returns caption, hashtags, and detected object in structured JSON.",
      zh: "单次调用即可获取文案、标签与识别物体，结构化 JSON 输出。",
    },
  },
  {
    icon: "🎯",
    title: { en: "Tone control", zh: "语气精准控制" },
    description: {
      en: "Standard for clean, Savage for bold, Rizz for charming. Get consistent style, every time.",
      zh: "Standard 简洁通用、Savage 大胆有力、Rizz 魅力自然。每次输出风格一致。",
    },
  },
  {
    icon: "👁️",
    title: { en: "Vision upload", zh: "识图功能" },
    description: {
      en: "Upload any photo and let AI detect objects for contextual captions.",
      zh: "上传照片即可自动识别物体，生成更贴合场景的文案。",
    },
  },
  {
    icon: "🔗",
    title: { en: "Smart affiliates", zh: "智能产品推荐" },
    description: {
      en: "Automatically match relevant product recommendations based on detected objects.",
      zh: "根据识别到的物体自动匹配相关产品推荐。",
    },
  },
  {
    icon: "🌐",
    title: { en: "Bilingual support", zh: "双语支持" },
    description: {
      en: "Full English and Chinese support. Output language automatically matches your input.",
      zh: "完整支持中英双语，输出语言自动匹配您的输入。",
    },
  },
  {
    icon: "🔒",
    title: { en: "Privacy first", zh: "隐私优先" },
    description: {
      en: "Your inputs are processed per request and are never stored on our servers.",
      zh: "您的内容按次处理，我们绝不会存储任何输入数据。",
    },
  },
];

export const TIERS: Tier[] = [
  {
    name: { en: "Free", zh: "免费" },
    badge: { en: "No login", zh: "无需登录" },
    description: {
      en: "Everything is free to use with captcha verification.",
      zh: "全功能免费使用，仅需完成验证码。",
    },
    features: [
      { en: "3 generations per day", zh: "每日 3 次生成机会" },
      { en: "All 3 tone modes", zh: "解锁全部 3 种语气模式" },
      { en: "Vision image upload", zh: "图片识别与上传" },
      { en: "Captcha-protected usage", zh: "验证码保护使用" },
      { en: "Local history (last 3)", zh: "本地历史记录（最近 3 条）" },
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
      zh: "等了好几年。每一个 L 都值了。👟🔥",
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
      zh: "腿走不动的日子，才算数。💪",
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
      zh: "咖啡加点平静。☕💫",
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
      zh: "新机器，同样的使命。🖥️",
    },
    hashtags: "#DeskSetup #MacBookPro #TechLife #Workstation",
    detected: { en: "MacBook Pro", zh: "MacBook Pro" },
    affiliate: { en: "Suggested: Laptop sleeve", zh: "推荐：笔记本电脑内胆包" },
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
      zh: "被毛孩子审判，全天候。🐱",
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
      zh: "像主角一样出场。🌙",
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
      zh: "从零开始。现成的留给业余。🍝",
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
      zh: "前排，耳鸣。零后悔。🎸",
    },
    hashtags: "#Concert #LiveMusic #FrontRow #Vibes",
    detected: { en: "Concert stage", zh: "演唱会舞台" },
    affiliate: {
      en: "Suggested: Concert photography guide",
      zh: "推荐：演唱会摄影指南",
    },
  },
  {
    title: { en: "Morning routine", zh: "晨间日常" },
    input: {
      en: "Started my 5 AM morning routine. Need something inspiring for Standard mode.",
      zh: "开始了 5 点晨间例程。来点励志的 Standard 文案。",
    },
    mode: "Standard",
    caption: {
      en: "5 AM club. Building dreams before the world wakes up. 🌅",
      zh: "5 点俱乐部。在世界醒来之前构建梦想。🌅",
    },
    hashtags: "#MorningRoutine #5AMClub #Productivity #Motivation",
    detected: { en: "Morning setup", zh: "晨间布置" },
    affiliate: {
      en: "Suggested: Daily planner journal",
      zh: "推荐：日程规划手账",
    },
  },
  {
    title: { en: "Book recommendation", zh: "好书推荐" },
    input: {
      en: "Just finished an amazing book. Want to share it in Rizz mode.",
      zh: "刚读完一本好书。用 Rizz 模式分享一下。",
    },
    mode: "Rizz",
    caption: {
      en: "This book just changed my entire perspective. Mind = blown. 📚✨",
      zh: "这本书彻底改变了我的视角。大脑爆炸。📚✨",
    },
    hashtags: "#BookRecommendation #Reading #MustRead #BookCommunity",
    detected: { en: "Book", zh: "书籍" },
    affiliate: {
      en: "Suggested: Reading tracking app",
      zh: "推荐：阅读记录应用",
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
      en: "No. Your inputs are processed per request and are never stored on our servers. We don't save your text or images.",
      zh: "不会。您的内容按次处理，我们绝不会存储在服务器上，也不会保存文字或图片。",
    },
  },
  {
    question: { en: "How do daily quotas work?", zh: "每日配额如何计算？" },
    answer: {
      en: "Each device receives 3 generations per day. Quotas reset at 00:00 UTC. Complete the captcha to generate.",
      zh: "每个设备每日可获得 3 次生成机会，配额于 UTC 00:00 重置。完成验证码后即可生成。",
    },
  },
  {
    question: {
      en: "What's the difference between the 3 tone modes?",
      zh: "3 种语气模式有什么区别？",
    },
    answer: {
      en: "Standard is clean and versatile for any content. Savage is bold and high-energy for impactful posts. Rizz is charming and playful—ideal for selfies and lifestyle content.",
      zh: "Standard 简洁通用，适合任何内容；Savage 大胆高能，适合冲击力强的文案；Rizz 轻松迷人，非常适合自拍和生活方式类内容。",
    },
  },
  {
    question: {
      en: "Is there a paid plan?",
      zh: "有付费版本吗？",
    },
    answer: {
      en: "Not at the moment. LitStatus is free to use, no login required.",
      zh: "暂时没有。LitStatus 目前完全免费，无需登录即可使用。",
    },
  },
  {
    question: {
      en: "What languages does LitStatus support?",
      zh: "LitStatus 支持哪些语言？",
    },
    answer: {
      en: "We currently support English and Chinese. The output language automatically matches your input language. More languages are planned for future releases.",
      zh: "目前我们支持英文和中文，输出语言会自动匹配您的输入语言。更多语言正在规划中。",
    },
  },
  {
    question: {
      en: "Can I use captions for commercial purposes?",
      zh: "生成的文案可以用于商业用途吗？",
    },
    answer: {
      en: "Yes, absolutely. Generated captions belong to you and can be used for personal posts, brand content, or client work without restrictions.",
      zh: "完全可以。生成的文案归您所有，可用于个人发布、品牌内容或客户项目，没有任何限制。",
    },
  },
  {
    question: {
      en: "How accurate is the object detection?",
      zh: "物体识别的准确度如何？",
    },
    answer: {
      en: "Vision detection works well for common objects when photos are clear and well-lit.",
      zh: "在照片清晰、光线充足的情况下，识图功能对常见物体的识别效果很好。",
    },
  },
  {
    question: {
      en: "How do affiliate recommendations work?",
      zh: "推荐功能是如何运作的？",
    },
    answer: {
      en: "When an object is detected in your image, we match it to curated product categories to suggest relevant items.",
      zh: "当在图片中识别到物体时，我们会将其匹配到精选的产品类别，给出相关建议。",
    },
  },
];

export const STEPS: Step[] = [
  {
    title: { en: "Describe your moment", zh: "描述您的场景" },
    description: {
      en: "Enter what's happening or upload a photo.",
      zh: "输入场景描述或上传照片。",
    },
  },
  {
    title: { en: "Pick your tone", zh: "选择语气" },
    description: {
      en: "Choose from Standard, Savage, or Rizz mode.",
      zh: "从 Standard、Savage 或 Rizz 模式中选择。",
    },
  },
  {
    title: { en: "Copy and post", zh: "复制并发布" },
    description: {
      en: "Get your caption + hashtags instantly. Copy and post to your favorite platform.",
      zh: "即时获取文案与标签。复制后发布到您喜爱的平台。",
    },
  },
];

export const COMMUNITY: Community[] = [
  {
    title: { en: "Content creators", zh: "内容创作者" },
    description: {
      en: "Daily posters who need fresh, engaging captions fast",
      zh: "需要快速获取新鲜、吸引人文案的日更创作者",
    },
  },
  {
    title: { en: "Brand marketers", zh: "品牌营销人员" },
    description: {
      en: "Maintain consistent brand voice across all social channels",
      zh: "在所有社交渠道保持一致的品牌声音",
    },
  },
  {
    title: { en: "Social agencies", zh: "社交媒体机构" },
    description: {
      en: "Rapid iteration and testing for client campaigns",
      zh: "为客户项目提供快速迭代和文案测试",
    },
  },
  {
    title: { en: "Small businesses", zh: "小微企业" },
    description: {
      en: "Create professional social posts without hiring copywriters",
      zh: "无需聘请专业文案师即可创建专业的社媒内容",
    },
  },
];

export function pick<T extends Localized>(lang: Lang, item: T) {
  return lang === "zh" ? item.zh : item.en;
}
