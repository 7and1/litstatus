export type AffiliatePayload = {
  text: {
    en: string;
    zh: string;
  };
  link: string;
};

export const AFFILIATE_MAP: Record<string, AffiliatePayload> = {
  // Sneakers & Footwear
  "Sneaker Cleaning Kit": {
    text: {
      en: "Keep your kicks fresh with this premium cleaning kit 👟",
      zh: "专业球鞋清洁套装，让你的爱鞋历久弥新 👟",
    },
    link: "https://www.amazon.com/s?k=sneaker+cleaning+kit&tag=YOUR_TAG-20",
  },
  "Shoe Storage Box": {
    text: {
      en: "Display your collection in style with clear stackable boxes 📦",
      zh: "透明收纳盒，展示你的球鞋收藏 📦",
    },
    link: "https://www.amazon.com/s?k=shoe+storage+box+clear&tag=YOUR_TAG-20",
  },
  "Premium sneaker protection spray": {
    text: {
      en: "Protect your investment with this water and stain repellent 🛡️",
      zh: "防水防污喷雾，保护你的球鞋投资 🛡️",
    },
    link: "https://www.amazon.com/s?k=sneaker+protection+spray&tag=YOUR_TAG-20",
  },

  // Tech & Electronics
  "Laptop sleeve": {
    text: {
      en: "Sleek protection for your MacBook on the go 💻",
      zh: "简约时尚的内胆包，保护你的 MacBook 💻",
    },
    link: "https://www.amazon.com/s?k=laptop+sleeve&tag=YOUR_TAG-20",
  },
  "Phone Case": {
    text: {
      en: "Rugged protection that still looks good 📱",
      zh: "硬核保护，颜值在线 📱",
    },
    link: "https://www.amazon.com/s?k=premium+phone+case&tag=YOUR_TAG-20",
  },
  "MagSafe Wallet": {
    text: {
      en: "Snap-on card holder for minimal carry days 💳",
      zh: "磁吸卡包，轻装出行 💳",
    },
    link: "https://www.amazon.com/s?k=magsafe+wallet&tag=YOUR_TAG-20",
  },
  "Wireless charging pad": {
    text: {
      en: "Drop and charge—no cables needed ⚡",
      zh: "一放即充，告别线缆束缚 ⚡",
    },
    link: "https://www.amazon.com/s?k=wireless+charging+pad&tag=YOUR_TAG-20",
  },
  "USB-C hub": {
    text: {
      en: "All the ports you need in one compact hub 🔌",
      zh: "扩展坞，一个接口解决所有需求 🔌",
    },
    link: "https://www.amazon.com/s?k=usb-c+hub&tag=YOUR_TAG-20",
  },
  "Portable power bank": {
    text: {
      en: "Never run out of battery again 🔋",
      zh: "大容量充电宝，随时随地满电 🔋",
    },
    link: "https://www.amazon.com/s?k=portable+power+bank&tag=YOUR_TAG-20",
  },
  "Webcam 4K": {
    text: {
      en: "Look crystal clear on every stream and call 📹",
      zh: "4K 网络摄像头，直播开会都清晰 📹",
    },
    link: "https://www.amazon.com/s?k=4k+webcam&tag=YOUR_TAG-20",
  },

  // Photography & Video
  "Camera lens filter kit": {
    text: {
      en: "Elevate your shots with polarizer and ND filters 📸",
      zh: "偏振和 ND 滤镜，拍出电影感 📸",
    },
    link: "https://www.amazon.com/s?k=camera+lens+filter+kit&tag=YOUR_TAG-20",
  },
  "Camera Lens Cleaner": {
    text: {
      en: "Crisp shots start with a clean lens 📷",
      zh: "照片要清晰，镜头得干净 📷",
    },
    link: "https://www.amazon.com/s?k=camera+lens+cleaning+kit&tag=YOUR_TAG-20",
  },
  Tripod: {
    text: {
      en: "Stable shots every time, plus perfect for solo content 🎬",
      zh: "稳拍神器，自拍视频必备 🎬",
    },
    link: "https://www.amazon.com/s?k=travel+tripod&tag=YOUR_TAG-20",
  },
  "Ring light": {
    text: {
      en: "Perfect lighting for selfies and streams 💡",
      zh: "环形补光灯，自拍直播都好用 💡",
    },
    link: "https://www.amazon.com/s?k=ring+light&tag=YOUR_TAG-20",
  },
  Microphone: {
    text: {
      en: "Studio-quality audio for your content 🎙️",
      zh: "专业级麦克风，声音更清晰 🎙️",
    },
    link: "https://www.amazon.com/s?k=usb+microphone&tag=YOUR_TAG-20",
  },

  // Fitness & Wellness
  "Foam roller for recovery": {
    text: {
      en: "Speed up recovery and ease muscle tension 🧘",
      zh: "筋膜滚轴，加速恢复放松肌肉 🧘",
    },
    link: "https://www.amazon.com/s?k=foam+roller&tag=YOUR_TAG-20",
  },
  "Resistance bands set": {
    text: {
      en: "Full-body workout anywhere, anytime 💪",
      zh: "阻力带套装，随时随地练起来 💪",
    },
    link: "https://www.amazon.com/s?k=resistance+bands+set&tag=YOUR_TAG-20",
  },
  "Yoga mat premium": {
    text: {
      en: "Non-slip, eco-friendly mat for your flow 🧘‍♀️",
      zh: "防滑环保瑜伽垫，练习更稳定 🧘‍♀️",
    },
    link: "https://www.amazon.com/s?k=premium+yoga+mat&tag=YOUR_TAG-20",
  },
  "Smart water bottle": {
    text: {
      en: "Tracks hydration and keeps water cold all day 💧",
      zh: "智能水杯，记录补水时刻 💧",
    },
    link: "https://www.amazon.com/s?k=smart+water+bottle&tag=YOUR_TAG-20",
  },
  "Massage gun": {
    text: {
      en: "Deep tissue relief after every workout 🔫",
      zh: "筋膜枪，深层放松肌肉 🔫",
    },
    link: "https://www.amazon.com/s?k=massage+gun&tag=YOUR_TAG-20",
  },

  // Food & Kitchen
  "Pasta maker machine": {
    text: {
      en: "Fresh pasta whenever you want it 🍝",
      zh: "家用意面机，随时吃上新鲜意面 🍝",
    },
    link: "https://www.amazon.com/s?k=pasta+maker+machine&tag=YOUR_TAG-20",
  },
  "Air fryer": {
    text: {
      en: "Crispy results with way less oil 🍟",
      zh: "空气炸锅，少油更健康 🍟",
    },
    link: "https://www.amazon.com/s?k=air+fryer&tag=YOUR_TAG-20",
  },
  "Insulated tumbler": {
    text: {
      en: "Hot stays hot, cold stays cold for hours ☕",
      zh: "保温杯，冷热保真久 ☕",
    },
    link: "https://www.amazon.com/s?k=insulated+tumbler&tag=YOUR_TAG-20",
  },
  "Portable coffee maker": {
    text: {
      en: "Brew anywhere, anytime ☕",
      zh: "便携咖啡机，随时随地来一杯 ☕",
    },
    link: "https://www.amazon.com/s?k=portable+coffee+maker&tag=YOUR_TAG-20",
  },

  // Travel & Lifestyle
  "Travel backpack": {
    text: {
      en: "Compartments for everything—tech-friendly 🎒",
      zh: "多功能旅行背包，装备井井有条 🎒",
    },
    link: "https://www.amazon.com/s?k=travel+backpack&tag=YOUR_TAG-20",
  },
  "Packing cubes set": {
    text: {
      en: "Stay organized on every trip 🧳",
      zh: "收纳分隔袋，行李更有条理 🧳",
    },
    link: "https://www.amazon.com/s?k=packing+cubes&tag=YOUR_TAG-20",
  },
  "Travel photography guide": {
    text: {
      en: "Capture destinations like a pro 📸",
      zh: "旅行摄影指南，拍出大片感 📸",
    },
    link: "https://www.amazon.com/s?k=travel+photography+book&tag=YOUR_TAG-20",
  },
  "Concert photography guide": {
    text: {
      en: "Master low-light shots at live shows 🎸",
      zh: "演唱会摄影指南，暗光拍摄技巧 🎸",
    },
    link: "https://www.amazon.com/s?k=concert+photography+guide&tag=YOUR_TAG-20",
  },

  // Fashion & Accessories
  "Statement watch": {
    text: {
      en: "Elevate any fit with the right timepiece ⌚",
      zh: "一块有品味的表，穿搭更有质感 ⌚",
    },
    link: "https://www.amazon.com/s?k=statement+watch+men&tag=YOUR_TAG-20",
  },
  "Leather belt premium": {
    text: {
      en: "Classic accessory that completes every look 👔",
      zh: "优质皮带，点睛之笔 👔",
    },
    link: "https://www.amazon.com/s?k=premium+leather+belt&tag=YOUR_TAG-20",
  },
  "Sunglasses polarized": {
    text: {
      en: "UV protection plus style points 😎",
      zh: "偏光太阳镜，护眼又时髦 😎",
    },
    link: "https://www.amazon.com/s?k=polarized+sunglasses&tag=YOUR_TAG-20",
  },

  // Pets
  "Interactive cat toy": {
    text: {
      en: "Keep your cat entertained for hours 🐱",
      zh: "互动猫玩具，让主子玩不停 🐱",
    },
    link: "https://www.amazon.com/s?k=interactive+cat+toy&tag=YOUR_TAG-20",
  },
  "Dog treat dispenser": {
    text: {
      en: "Reward your pup automatically 🐕",
      zh: "自动喂食器，奖励毛孩子 🐕",
    },
    link: "https://www.amazon.com/s?k=dog+treat+dispenser&tag=YOUR_TAG-20",
  },
  "Pet camera": {
    text: {
      en: "Check in on your fur baby anytime 📹",
      zh: "宠物摄像头，随时看看毛孩子 📹",
    },
    link: "https://www.amazon.com/s?k=pet+camera&tag=YOUR_TAG-20",
  },

  // Home & Office
  "Desk mat extra large": {
    text: {
      en: "Protect your desk and elevate your workspace 🖥️",
      zh: "大号桌垫，保护桌面提升颜值 🖥️",
    },
    link: "https://www.amazon.com/s?k=desk+mat+extra+large&tag=YOUR_TAG-20",
  },
  "Mechanical keyboard": {
    text: {
      en: "Tactile bliss for every keystroke ⌨️",
      zh: "机械键盘，每一次敲击都是享受 ⌨️",
    },
    link: "https://www.amazon.com/s?k=mechanical+keyboard&tag=YOUR_TAG-20",
  },
  "Noise cancelling headphones": {
    text: {
      en: "Focus in, world out 🎧",
      zh: "降噪耳机，专注当下 🎧",
    },
    link: "https://www.amazon.com/s?k=noise+cancelling+headphones&tag=YOUR_TAG-20",
  },

  // Beauty & Grooming
  "Hair styling tool": {
    text: {
      en: "Salon results at home 💇",
      zh: "家用造型工具，沙龙级效果 💇",
    },
    link: "https://www.amazon.com/s?k=hair+styling+tool&tag=YOUR_TAG-20",
  },
  "Skincare set": {
    text: {
      en: "Complete routine for glowing skin ✨",
      zh: "护肤套装，养成好皮肤 ✨",
    },
    link: "https://www.amazon.com/s?k=skincare+set&tag=YOUR_TAG-20",
  },
  "Beard grooming kit": {
    text: {
      en: "Keep the beard looking sharp 🧔",
      zh: "胡须护理套装，保持精致造型 🧔",
    },
    link: "https://www.amazon.com/s?k=beard+grooming+kit&tag=YOUR_TAG-20",
  },
};
