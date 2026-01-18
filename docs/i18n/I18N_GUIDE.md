# LitStatus Internationalization (i18n) Guide

Guide for implementing and managing multi-language support in LitStatus.com.

## Table of Contents

1. [Overview](#overview)
2. [Supported Languages](#supported-languages)
3. [Language Detection](#language-detection)
4. [Adding Translations](#adding-translations)
5. [URL Structure](#url-structure)
6. [SEO Considerations](#seo-considerations)
7. [Testing i18n](#testing-i18n)

---

## Overview

LitStatus supports bilingual content (English and Chinese) with automatic language detection and URL-based language switching.

### Architecture

```
Client Request
     │
     ▼
┌─────────────────┐
│  Language Detection  │
│  Priority:              │
│  1. Cookie preference  │
│  2. Accept-Language    │
│  3. Default (en)       │
└────────┬────────┘
         ▼
┌─────────────────┐
│  URL Routing    │  - English: /path
│                 │  - Chinese: /zh/path
└────────┬────────┘
         ▼
┌─────────────────┐
│  Content        │  - Server components use detected lang
│  Localization   │  - Client components can switch lang
└─────────────────┘
```

---

## Supported Languages

| Code | Language | Locale | Direction |
|------|----------|--------|-----------|
| `en` | English | en-US | LTR |
| `zh` | Chinese | zh-CN | LTR |

### Language Constants

```typescript
// src/lib/i18n.ts
export type Lang = "en" | "zh";

export const DEFAULT_LANG: Lang = "en";
export const SUPPORTED_LANGS: Lang[] = ["en", "zh"];
export const LANG_STORAGE_KEY = "litstatus_lang";
```

### Language Names (Display)

```typescript
export const LANG_NAMES: Record<Lang, Record<Lang, string>> = {
  en: { en: "English", zh: "中文" },
  zh: { en: "English", zh: "中文" },
};
```

---

## Language Detection

### Detection Priority

1. **Cookie Preference** - User's explicit choice
2. **Accept-Language Header** - Browser preference
3. **Default** - English

### Server-Side Detection

```typescript
// src/lib/i18n.server.ts
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { getLangPreference } from "@/lib/i18n";

export async function getLangFromHeaders(
  cookieLang: string | null,
  acceptLanguage: string | null
): Lang {
  return getLangPreference(cookieLang, acceptLanguage);
}
```

### Client-Side Detection

```typescript
// src/lib/i18n.ts
export function getClientLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  return normalizeLang(
    window.localStorage.getItem(LANG_STORAGE_KEY)
  );
}
```

### Accept-Language Parsing

```typescript
export function detectLangFromHeader(
  acceptLanguage?: string | null
): Lang {
  if (!acceptLanguage) return DEFAULT_LANG;

  // Parse: "zh-CN,zh;q=0.9,en;q=0.8"
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      const quality = qValue ? parseFloat(qValue) : 1;
      return { code: code.toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported language
  for (const { code } of languages) {
    const baseCode = code.split("-")[0] as Lang;
    if (baseCode === "zh") return "zh";
    if (baseCode === "en") return "en";
  }

  return DEFAULT_LANG;
}
```

---

## Adding Translations

### Pattern: Inline Translation Function

For simple translations, use the inline pattern:

```typescript
// In API routes or server components
const t = (en: string, zh: string) => (lang === "zh" ? zh : en);

return NextResponse.json({
  error: t(
    "Daily quota reached.",
    "今日配额已用完。"
  ),
  // ...
});
```

### Pattern: Content Translation

For page content, create language-specific objects:

```typescript
// src/lib/content.ts
export const HOME_CONTENT = {
  en: {
    hero: {
      title: "Generate Viral Captions",
      subtitle: "AI-powered caption generator for social media",
    },
    // ...
  },
  zh: {
    hero: {
      title: "AI 生成爆款文案",
      subtitle: "为社交媒体量身定制的 AI 文案生成器",
    },
    // ...
  },
} as const;
```

### Pattern: Component Translation

For React components, accept a `lang` prop:

```typescript
interface Props {
  lang: Lang;
}

export function MyComponent({ lang }: Props) {
  const content = {
    en: {
      heading: "Welcome",
      description: "Get started today",
    },
    zh: {
      heading: "欢迎",
      description: "立即开始",
    },
  };

  return (
    <div>
      <h1>{content[lang].heading}</h1>
      <p>{content[lang].description}</p>
    </div>
  );
}
```

---

## URL Structure

### URL Pattern

- **English (default):** `/path/to/page`
- **Chinese:** `/zh/path/to/page`

### URL Utilities

```typescript
// Strip language prefix from pathname
export function stripLangPrefix(pathname: string): {
  lang: Lang;
  path: string;
} {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalized === "/zh" || normalized.startsWith("/zh/")) {
    const path = normalized.replace(/^\/zh/, "") || "/";
    return { lang: "zh", path };
  }
  return { lang: "en", path: normalized };
}

// Localize a path with the given language
export function localizePath(pathname: string, lang: Lang): string {
  const { path } = stripLangPrefix(pathname);
  if (lang === "zh") {
    return path === "/" ? "/zh" : `/zh${path}`;
  }
  return path;
}

// Get alternate language paths for hreflang
export function getAlternatePaths(pathname: string) {
  const { path } = stripLangPrefix(pathname);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";

  return {
    en: `${baseUrl}${path}`,
    "zh-CN": `${baseUrl}/zh${path === "/" ? "" : path}`,
    "x-default": `${baseUrl}${path}`,
  } as const;
}
```

### Language Switcher Component

```typescript
"use client";

import { useRouter, usePathname } from "next/navigation";
import { saveLang, stripLangPrefix, localizePath } from "@/lib/i18n";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLang = (newLang: "en" | "zh") => {
    const { path } = stripLangPrefix(pathname);
    const newPath = localizePath(path, newLang);
    saveLang(newLang);
    router.push(newPath);
  };

  return (
    <div>
      <button onClick={() => switchLang("en")}>English</button>
      <button onClick={() => switchLang("zh")}>中文</button>
    </div>
  );
}
```

---

## SEO Considerations

### hreflang Tags

Hreflang tags are automatically generated in the root layout:

```typescript
// src/app/layout.tsx
import { generateHreflangTags } from "@/lib/i18n";

// In metadata or head
const hreflangTags = generateHreflangTags(pathname);

// Returns:
// [
//   { lang: "en", url: "https://litstatus.com/path" },
//   { lang: "zh-CN", url: "https://litstatus.com/zh/path" },
//   { lang: "x-default", url: "https://litstatus.com/path" },
// ]
```

### Metadata by Language

```typescript
const STRUCTURED_COPY = {
  en: {
    title: "LitStatus - AI Caption Generator",
    description: "Generate viral captions with AI",
  },
  zh: {
    title: "LitStatus - AI 文案生成器",
    description: "AI 生成爆款文案",
  },
};

// Use in metadata export
export async function generateMetadata({ params }):
  Promise<Metadata> {
  const { lang } = params;
  const content = STRUCTURED_COPY[lang];

  return {
    title: content.title,
    description: content.description,
    // ...
  };
}
```

### Sitemap Localization

The sitemap includes both language versions:

```typescript
// src/app/sitemap.ts
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://litstatus.com";
  const routes = ["/", "/use-cases", "/pricing", "/faq"];

  const entries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    // English version
    entries.push({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      alternates: {
        languages: {
          en: `${baseUrl}${route}`,
          zh: `${baseUrl}/zh${route === "/" ? "" : route}`,
        },
      },
    });

    // Chinese version
    entries.push({
      url: `${baseUrl}/zh${route === "/" ? "" : route}`,
      lastModified: new Date(),
      alternates: {
        languages: {
          en: `${baseUrl}${route}`,
          zh: `${baseUrl}/zh${route === "/" ? "" : route}`,
        },
      },
    });
  }

  return entries;
}
```

---

## Testing i18n

### Testing Language Detection

```typescript
// Test Accept-Language parsing
import { detectLangFromHeader } from "@/lib/i18n";

describe("detectLangFromHeader", () => {
  it("should detect Chinese", () => {
    expect(detectLangFromHeader("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh");
  });

  it("should default to English", () => {
    expect(detectLangFromHeader("fr-FR,fr;q=0.9")).toBe("en");
  });
});
```

### Testing URL Utilities

```typescript
import { stripLangPrefix, localizePath } from "@/lib/i18n";

describe("URL utilities", () => {
  it("should strip Chinese prefix", () => {
    expect(stripLangPrefix("/zh/use-cases")).toEqual({
      lang: "zh",
      path: "/use-cases",
    });
  });

  it("should localize to Chinese", () => {
    expect(localizePath("/pricing", "zh")).toBe("/zh/pricing");
  });
});
```

### Testing Content Rendering

```bash
# Test English page
curl -H "Accept-Language: en-US,en;q=0.9" \
  https://litstatus.com/

# Test Chinese page
curl -H "Accept-Language: zh-CN,zh;q=0.9" \
  https://litstatus.com/

# Test Chinese URL
curl https://litstatus.com/zh/
```

---

## Adding a New Language

### Step 1: Update Type Definitions

```typescript
// src/lib/i18n.ts
export type Lang = "en" | "zh" | "es"; // Add "es"

export const SUPPORTED_LANGS: Lang[] = ["en", "zh", "es"];
export const DEFAULT_LANG: Lang = "en";
```

### Step 2: Add Language Names

```typescript
export const LANG_NAMES: Record<Lang, Record<Lang, string>> = {
  en: { en: "English", zh: "中文", es: "Español" },
  zh: { en: "English", zh: "中文", es: "Español" },
  es: { en: "English", zh: "中文", es: "Español" },
};
```

### Step 3: Update URL Utilities

```typescript
export function stripLangPrefix(pathname: string): {
  lang: Lang;
  path: string;
} {
  // Add language code checks
  if (normalized.startsWith("/es/")) {
    const path = normalized.replace(/^\/es/, "") || "/";
    return { lang: "es", path };
  }
  // ...
}
```

### Step 4: Add Translations

```typescript
// src/lib/content.ts
export const HOME_CONTENT = {
  en: { /* ... */ },
  zh: { /* ... */ },
  es: {
    hero: {
      title: "Genera Títulos Virales",
      subtitle: "Generador de títulos con IA para redes sociales",
    },
  },
};
```

### Step 5: Update SEO

```typescript
// Add hreflang for new language
export function generateHreflangTags(pathname: string): HreflangEntry[] {
  return [
    { lang: "en", url: `${baseUrl}${path}` },
    { lang: "zh-CN", url: `${baseUrl}/zh${path}` },
    { lang: "es", url: `${baseUrl}/es${path}` }, // New
    { lang: "x-default", url: `${baseUrl}${path}` },
  ];
}
```

### Step 6: Create Route Handler

```typescript
// src/app/es/page.tsx
import { HomeContent } from "@/components/HomeContent";

export default function SpanishHome() {
  return <HomeContent lang="es" />;
}
```

---

## Best Practices

1. **Always Use Type Safe Lang Codes:**
   ```typescript
   // Good
   function processContent(lang: Lang) { /* ... */ }

   // Bad
   function processContent(lang: string) { /* ... */ }
   ```

2. **Provide Default Translations:**
   ```typescript
   // Always have English as fallback
   const content = TRANSLATIONS[lang] || TRANSLATIONS.en;
   ```

3. **Test Both Languages:**
   - Manually test UI in both languages
   - Check URL routing
   - Verify SEO tags

4. **Keep Translations Synchronized:**
   - When adding new content, update all languages
   - Use translation keys for consistency
   - Review translations periodically

5. **Consider Cultural Differences:**
   - Date formats
   - Number formats
   - Currency symbols
   - Color meanings
   - Text direction (for future RTL languages)
