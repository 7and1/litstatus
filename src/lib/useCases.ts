import type { Localized } from "@/lib/content";
import type { Mode } from "@/lib/constants";

export type UseCasePrompt = {
  input: Localized;
  mode: Mode;
  caption: Localized;
  hashtags: string;
};

export type UseCase = {
  slug: "instagram" | "tiktok" | "xiaohongshu";
  title: Localized;
  subtitle: Localized;
  description: Localized;
  keywords: { en: string[]; zh: string[] };
  highlights: Localized[];
  bestFor: Localized[];
  prompts: UseCasePrompt[];
};

export type CaseStudySection = {
  title: Localized;
  body: Localized[];
};

export type CaseStudy = {
  slug: "creator-sprint" | "brand-launch";
  title: Localized;
  subtitle: Localized;
  description: Localized;
  keywords: { en: string[]; zh: string[] };
  highlights: Localized[];
  sections: CaseStudySection[];
};

export const USE_CASES: UseCase[] = [
  {
    slug: "instagram",
    title: {
      en: "Instagram captions that stop the scroll",
      zh: "Instagram 文案：一秒停留",
    },
    subtitle: {
      en: "Hook fast, maintain the vibe, and drive saves.",
      zh: "开头抓人，节奏在线，引导收藏互动。",
    },
    description: {
      en: "Create concise, engaging captions for Reels, feed posts, and Stories with hashtags optimized for Instagram discovery.",
      zh: "为 Reels、动态和快拍创建简洁吸引人的文案，配合优化的标签提升被发现机会。",
    },
    keywords: {
      en: [
        "instagram caption generator",
        "instagram captions",
        "ig reel captions",
        "instagram hook ideas",
        "instagram hashtags",
        "carousel caption generator",
      ],
      zh: [
        "Instagram 文案生成器",
        "IG 文案生成",
        "Reels 文案",
        "Instagram 标签",
        "IG 图文文案",
        "Instagram 快拍文案",
      ],
    },
    highlights: [
      { en: "Short, punchy openers designed for scroll-stopping power", zh: "简短有力的开头，专为停留设计" },
      { en: "Clean structure optimized for carousels and Reels", zh: "适合图文和短视频的清晰结构" },
      { en: "Hashtag strategy focused on discovery, not spam", zh: "专注发现的标签策略，拒绝堆砌" },
    ],
    bestFor: [
      { en: "Reels content and launches", zh: "Reels 内容与发布" },
      { en: "Carousel photo storytelling", zh: "图文故事叙述" },
      { en: "Lifestyle and fashion posts", zh: "生活方式与穿搭内容" },
    ],
    prompts: [
      {
        input: {
          en: "Just dropped a new streetwear outfit with chrome accents. Need a confident IG caption.",
          zh: "刚穿上新的街头风穿搭，有金属细节。需要一句有气场的 IG 文案。",
        },
        mode: "Savage",
        caption: {
          en: "Chrome details, maximum pressure in the fit. ⚡",
          zh: "金属细节，气场拉满。⚡",
        },
        hashtags: "#Streetwear #FitCheck #Reels #OutfitGoals #OOTD",
      },
    ],
  },
  {
    slug: "tiktok",
    title: {
      en: "TikTok captions built for hooks",
      zh: "TikTok 文案：开头就是钩子",
    },
    subtitle: {
      en: "Hook viewers in 2 seconds, then keep energy high.",
      zh: "2 秒抓住注意力，后续保持高能。",
    },
    description: {
      en: "Craft short, high-impact captions for TikTok videos, trending content, and series that maintain viewer engagement.",
      zh: "为 TikTok 视频、趋势内容和系列内容制作简短、高冲击力的文案，保持观众参与度。",
    },
    keywords: {
      en: [
        "tiktok caption generator",
        "tiktok hook generator",
        "tiktok captions",
        "short video captions",
        "viral tiktok text",
        "tiktok trend captions",
      ],
      zh: [
        "TikTok 文案生成器",
        "短视频文案",
        "爆款钩子",
        "TikTok 标题",
        "短视频模板",
        "TikTok 趋势文案",
      ],
    },
    highlights: [
      { en: "Hook-first approach optimized for short-form video", zh: "钩子优先的方法，专为短视频优化" },
      { en: "Fast-paced captions with punchy, memorable lines", zh: "快节奏文案，简洁有力" },
      { en: "Hashtag strategy aligned with trend discovery", zh: "与趋势发现一致的标签策略" },
    ],
    bestFor: [
      { en: "Trend participation and remixes", zh: "趋势参与和二创" },
      { en: "Product demonstration videos", zh: "产品演示视频" },
      { en: "Creator series and episodic content", zh: "创作者系列和连续内容" },
    ],
    prompts: [
      {
        input: {
          en: "Day 12 of my 30-day fitness transformation. Need a short TikTok hook.",
          zh: "30 天健身蜕变计划的第 12 天。需要一个简短的 TikTok 钩子。",
        },
        mode: "Savage",
        caption: {
          en: "Day 12. Still showing up. Still leveling up. 🔥",
          zh: "第 12 天。依旧坚持。持续升级。🔥",
        },
        hashtags: "#GymTok #30DayChallenge #Fitness #Transformation",
      },
    ],
  },
  {
    slug: "xiaohongshu",
    title: {
      en: "Xiaohongshu notes that feel authentic",
      zh: "小红书笔记：原生感更容易种草",
    },
    subtitle: {
      en: "Note-style structure that drives saves and shares.",
      zh: "笔记式结构，提升收藏与转发率。",
    },
    description: {
      en: "Create Xiaohongshu-optimized content with authentic note-style formatting and discovery-focused hashtags.",
      zh: "创建小红书优化内容，采用原生笔记格式和聚焦发现的标签策略。",
    },
    keywords: {
      en: [
        "xiaohongshu caption generator",
        "xhs note template",
        "xiaohongshu title generator",
        "red book caption",
        "小红书文案",
      ],
      zh: [
        "小红书文案生成器",
        "小红书标题",
        "小红书笔记模板",
        "种草文案",
        "小红书标签",
        "小红书爆款文案",
      ],
    },
    highlights: [
      { en: "Authentic note structure with clear value takeaways", zh: "原生笔记结构，价值清晰" },
      { en: "Trustworthy tone that encourages sharing", zh: "可信赖的语气，鼓励分享" },
      { en: "Discovery tags without keyword stuffing", zh: "发现标签，拒绝关键词堆砌" },
    ],
    bestFor: [
      { en: "Product review and seeding content", zh: "产品测评和种草内容" },
      { en: "Travel guides and itineraries", zh: "旅行攻略和行程规划" },
      { en: "Beauty and skincare routines", zh: "美妆和护肤流程" },
    ],
    prompts: [
      {
        input: {
          en: "Tested a new cushion foundation for a full week. Need a Xiaohongshu review caption.",
          zh: "完整测试了一款新的气垫粉底一周。需要小红书测评文案。",
        },
        mode: "Standard",
        caption: {
          en: "7-day wear test results: Lightweight finish, zero caking. Skin stays fresh from morning to night. ✨",
          zh: "7 天实测结果：轻薄妆感，零卡粉。从早到晚保持清透。✨",
        },
        hashtags: "#底妆测评 #气垫推荐 #小红书美妆 #化妆心得",
      },
    ],
  },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "creator-sprint",
    title: {
      en: "Creator Sprint: 14 Days of Consistent Content",
      zh: "创作者冲刺：14 天持续发布计划",
    },
    subtitle: {
      en: "A strategic playbook for creators who need daily output without burnout.",
      zh: "为需要高频发布但避免倦怠的创作者提供的策略性打法。",
    },
    description: {
      en: "An in-depth playbook demonstrating how to maintain a two-week content streak with consistent tone and accelerated production using AI tools.",
      zh: "深度案例分析，展示如何使用 AI 工具在两周内保持稳定的语气和更快的产出速度。",
    },
    keywords: {
      en: [
        "creator content workflow",
        "social media caption process",
        "daily posting strategy",
        "caption generator playbook",
        "content consistency strategy",
      ],
      zh: [
        "创作者内容流程",
        "每日发布策略",
        "社媒文案流程",
        "文案生成器案例",
        "内容一致性策略",
      ],
    },
    highlights: [
      { en: "Daily posting cadence with pre-batched content prompts", zh: "预先批量准备内容提示词，确保每日发布" },
      { en: "Consistent tone maintained across 14-day content series", zh: "14 天系列内容保持语气一致" },
      { en: "Streamlined approval process for brand partnerships", zh: "简化品牌合作的审核流程" },
    ],
    sections: [
      {
        title: { en: "The Challenge", zh: "面临的挑战" },
        body: [
          {
            en: "A fitness creator planned to post daily for two weeks to launch a new workout series, but manual caption writing slowed production and disrupted momentum.",
            zh: "一位健身创作者计划连续两周每日发布以推出新的训练系列，但手动撰写文案拖慢了制作节奏，打断了发布势头。",
          },
          {
            en: "The primary pain point was inconsistency: each caption had a different voice, confusing returning viewers and reducing save rates.",
            zh: "主要痛点是不一致性：每条文案的语气各不相同，让回访观众感到困惑，导致收藏率下降。",
          },
        ],
      },
      {
        title: { en: "The Approach", zh: "解决方案" },
        body: [
          {
            en: "We created a batch of content prompts organized around recurring series themes (progress updates, form checks, recovery days), each locked to a specific tone mode.",
            zh: "我们创建了一批围绕系列主题（进度更新、动作检查、恢复日）组织的内容提示词，每个都锁定到特定的语气模式。",
          },
          {
            en: "LitStatus generated three caption options for each post. The creator selected the best fit and applied minimal edits for personal voice, saving 20–30 minutes daily.",
            zh: "LitStatus 为每条内容生成三个文案选项。创作者选择最合适的并进行微调以加入个人风格，每天节省 20-30 分钟。",
          },
        ],
      },
      {
        title: { en: "The Results", zh: "成果" },
        body: [
          {
            en: "The 14-day streak was completed successfully. Viewers commented on the consistent tone, average save rate increased by 40%, and the prompt framework was reused for the next series.",
            zh: "14 天发布计划顺利完成。观众评论称赞语气的一致性，平均收藏率提升 40%，提示词框架在下一期系列中得到复用。",
          },
        ],
      },
    ],
  },
  {
    slug: "brand-launch",
    title: {
      en: "Brand Launch: Multi-Platform Product Release",
      zh: "品牌发布：多平台产品同步上市",
    },
    subtitle: {
      en: "Maintaining message alignment across Instagram, TikTok, and Xiaohongshu.",
      zh: "在 Instagram、TikTok 和小红书之间保持信息一致性。",
    },
    description: {
      en: "A comprehensive case study showing how a launch team adapted a core message across multiple channels while maintaining platform-native authenticity.",
      zh: "全面的案例研究，展示发布团队如何在多个渠道调整核心信息，同时保持各平台的原生真实性。",
    },
    keywords: {
      en: [
        "brand launch captions",
        "multi-platform copywriting",
        "social media launch strategy",
        "product drop captions",
        "cross-platform messaging",
      ],
      zh: [
        "品牌发布文案",
        "多平台文案创作",
        "社媒发布策略",
        "产品上市文案",
        "跨平台信息传递",
      ],
    },
    highlights: [
      { en: "Single core value proposition adapted for multiple tone styles", zh: "单一核心价值主张，适配多种语气风格" },
      { en: "Aligned hashtag strategy across Instagram and TikTok", zh: "Instagram 和 TikTok 的标签策略保持一致" },
      { en: "Localized Xiaohongshu note structure for authenticity", zh: "本地化的小红书笔记结构，确保真实性" },
    ],
    sections: [
      {
        title: { en: "The Brief", zh: "项目背景" },
        body: [
          {
            en: "A sneaker brand needed to launch a new product across Instagram, TikTok, and Xiaohongshu within the same week. The team had to maintain one core value proposition while adapting to each platform's unique tone requirements.",
            zh: "一个运动鞋品牌需要在同一周内在 Instagram、TikTok 和小红书发布新产品。团队必须保持一个核心价值主张，同时适应每个平台的独特语气要求。",
          },
        ],
      },
      {
        title: { en: "The Workflow", zh: "工作流程" },
        body: [
          {
            en: "The team established one core message, then used LitStatus to generate platform-specific adaptations: concise hooks for TikTok, narrative-driven captions for Instagram, and note-style content for Xiaohongshu.",
            zh: "团队确定了一条核心信息，然后使用 LitStatus 生成平台特定的改编版本：TikTok 的简短钩子、Instagram 的叙事型文案、小红书的笔记式内容。",
          },
          {
            en: "Hashtag sets were organized by platform to enable independent performance tracking while maintaining overall brand consistency.",
            zh: "标签集合按平台组织，以便独立追踪效果，同时保持整体品牌一致性。",
          },
        ],
      },
      {
        title: { en: "The Outcome", zh: "最终成果" },
        body: [
          {
            en: "Launch messages remained aligned across all channels while sounding native to each platform. Copywriting time reduced by 60%, and the framework was successfully reused for the next product drop.",
            zh: "发布信息在所有渠道保持一致，同时在各平台上听起来都很原生。文案时间减少 60%，该框架在下次产品发布中成功复用。",
          },
        ],
      },
    ],
  },
];

export function getUseCase(slug: UseCase["slug"]) {
  return USE_CASES.find((item) => item.slug === slug) ?? null;
}

export function getCaseStudy(slug: CaseStudy["slug"]) {
  return CASE_STUDIES.find((item) => item.slug === slug) ?? null;
}
