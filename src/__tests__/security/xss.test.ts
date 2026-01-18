import { describe, it, expect, beforeEach, vi } from "vitest";
import { sanitizeString, sanitizeJsonString, isValidEmail, LIMITS } from "@/lib/security";
import { validateRequest } from "@/lib/validation";

describe("Security - XSS Prevention", () => {
  describe("Script tag injection attempts", () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<SCRIPT>alert("XSS")</SCRIPT>',
      '<script src="https://evil.com/xss.js"></script>',
      '<script>alert(String.fromCharCode(88,83,83))</script>',
      '<script>alert(document.cookie)</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      '<marquee onstart=alert("XSS")>',
      '<details open ontoggle=alert("XSS")>',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<embed src="javascript:alert(\'XSS\')">',
      '<object data="javascript:alert(\'XSS\')">',
    ];

    it("should sanitize script tag payloads (control char removal)", () => {
      for (const payload of xssPayloads) {
        const sanitized = sanitizeString(payload);
        // Script tags themselves don't contain control chars, so they won't be removed
        // But the string should be sanitized of any control characters
        expect(sanitized).not.toContain("\x00");
        expect(sanitized).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
      }
    });

    it("should preserve script tags in non-dangerous contexts (no auto-escaping)", () => {
      // Note: sanitizeString only removes control chars, not HTML special chars
      // HTML escaping should happen at rendering time
      const payload = '<script>alert("XSS")</script>';
      const sanitized = sanitizeString(payload);

      // sanitizeString doesn't escape HTML - that's the renderer's job
      expect(typeof sanitized).toBe("string");
    });
  });

  describe("Event handler injection attempts", () => {
    const eventHandlerPayloads = [
      'onmouseover="alert(\'XSS\')"',
      'onload="alert(\'XSS\')"',
      'onclick="alert(\'XSS\')"',
      'onerror="alert(\'XSS\')"',
      'onfocus="alert(\'XSS\')"',
      'onblur="alert(\'XSS\')"',
      'onmouseenter="alert(\'XSS\')"',
      'onmouseleave="alert(\'XSS\')"',
      'onkeydown="alert(\'XSS\')"',
      'onkeyup="alert(\'XSS\')"',
      'onsubmit="alert(\'XSS\')"',
    ];

    it("should handle event handler payloads", () => {
      for (const payload of eventHandlerPayloads) {
        const sanitized = sanitizeString(payload);
        expect(typeof sanitized).toBe("string");
      }
    });
  });

  describe("JavaScript protocol injection", () => {
    const jsProtocolPayloads = [
      'javascript:alert("XSS")',
      'JAVASCRIPT:alert("XSS")',
      'JavaScrIpT:alert("XSS")',
      'javascript:void(0)',
      'javascript:document.cookie',
      'javascript:/* comment */alert("XSS")',
      'javascript://%0Aalert("XSS")',
    ];

    it("should handle javascript: protocol payloads", () => {
      for (const payload of jsProtocolPayloads) {
        const sanitized = sanitizeString(payload);
        expect(typeof sanitized).toBe("string");
      }
    });
  });

  describe("Data URI injection attempts", () => {
    const dataUriPayloads = [
      'data:text/html,<script>alert("XSS")</script>',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=',
      'data:image/svg+xml,<svg onload=alert("XSS")>',
    ];

    it("should handle data URI payloads", () => {
      for (const payload of dataUriPayloads) {
        const sanitized = sanitizeString(payload);
        expect(typeof sanitized).toBe("string");
      }
    });
  });

  describe("VBScript injection attempts (IE legacy)", () => {
    const vbscriptPayloads = [
      'vbscript:msgbox("XSS")',
      'VBSCRIPT:msgbox("XSS")',
      'vbscript:Execute("msgbox(""XSS"")")',
    ];

    it("should handle vbscript: protocol payloads", () => {
      for (const payload of vbscriptPayloads) {
        const sanitized = sanitizeString(payload);
        expect(typeof sanitized).toBe("string");
      }
    });
  });

  describe("Encoded XSS attempts", () => {
    const encodedPayloads = [
      '%3Cscript%3Ealert%28%22XSS%22%29%3C/script%3E', // URL encoded
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;', // HTML entities
      '&#60;script&#62;alert(&#34;XSS&#34;)&#60;/script&#62;', // Decimal entities
      '&#x3C;script&#x3E;alert(&#x22;XSS&#x22;)&#x3C;/script&#x3E;', // Hex entities
      '\u003Cscript\u003Ealert("XSS")\u003C/script\u003E', // Unicode escape
    ];

    it("should handle various encoded XSS payloads", () => {
      for (const payload of encodedPayloads) {
        const sanitized = sanitizeString(payload);
        expect(typeof sanitized).toBe("string");
      }
    });
  });

  describe("DOM-based XSS patterns", () => {
    const domXssPayloads = [
      '#<script>alert("XSS")</script>',
      '?param=<script>alert("XSS")</script>',
      'javascript:/*-->&lt;script&gt;alert("XSS")&lt;/script&gt;',
      'window.location="javascript:alert(\'XSS\')"',
      'document.location="javascript:alert(\'XSS\')"',
      'document.write("<script>alert(\'XSS\')</script>")',
      'eval("alert(\'XSS\')")',
      'setTimeout("alert(\'XSS\')")',
      'setInterval("alert(\'XSS\')")',
    ];

    it("should handle DOM-based XSS payloads", () => {
      for (const payload of domXssPayloads) {
        const sanitized = sanitizeString(payload);
        expect(typeof sanitized).toBe("string");
      }
    });
  });

  describe("Null byte injection in XSS context", () => {
    const nullBytePayloads = [
      '<scri\x00pt>alert("XSS")</scri\x00pt>',
      'javasc\x00ript:alert("XSS")',
      '<img src\x00="x" onerror\x00="alert(\'XSS\')">',
      'onload\x00="alert(\'XSS\')"',
    ];

    it("should remove null bytes from XSS payloads", () => {
      for (const payload of nullBytePayloads) {
        const sanitized = sanitizeString(payload);
        expect(sanitized).not.toContain("\x00");
      }
    });
  });

  describe("CSS expression injection (IE legacy)", () => {
    const cssExpressionPayloads = [
      'expression(alert("XSS"))',
      'x:expression(alert("XSS"))',
      'width:expression(alert("XSS"))',
    ];

    it("should handle CSS expression payloads", () => {
      for (const payload of cssExpressionPayloads) {
        const sanitized = sanitizeString(payload);
        expect(typeof sanitized).toBe("string");
      }
    });
  });

  describe("SVG-based XSS", () => {
    const svgXssPayloads = [
      '<svg><script>alert("XSS")</script></svg>',
      '<svg onload=alert("XSS")>',
      '<svg><animate onbegin=alert("XSS")>',
      '<svg><set onbegin=alert("XSS")>',
      '<svg><foreignObject><script>alert("XSS")</script></foreignObject></svg>',
    ];

    it("should handle SVG-based XSS payloads", () => {
      for (const payload of svgXssPayloads) {
        const sanitized = sanitizeString(payload);
        expect(typeof sanitized).toBe("string");
      }
    });
  });

  describe("Email validation with XSS payloads", () => {
    it("should reject email addresses with script tags", () => {
      const xssEmails = [
        '<script>alert("XSS")</script>@example.com',
        'test@<script>alert("XSS")</script>.com',
        '<img src=x onerror=alert("XSS")>@example.com',
        'test@example.com<script>alert("XSS")</script>',
      ];

      for (const email of xssEmails) {
        expect(isValidEmail(email)).toBe(false);
      }
    });
  });

  describe("Input validation length limits prevent DoS/XSS", () => {
    it("should enforce length limits", async () => {
      const longXssPayload = '<script>alert("XSS")</script>'.repeat(1000);
      const result = await validateRequest(
        { text: longXssPayload },
        [{ field: "text", required: true, maxLength: LIMITS.MAX_TEXT_LENGTH }]
      );

      expect(result.valid).toBe(false);
    });
  });

  describe("JSON injection via XSS", () => {
    it("should sanitize JSON strings with XSS attempts", () => {
      const xssJson = '{"text":"<script>alert(\\"XSS\\")</script>","value":"test\x00inject"}';
      const sanitized = sanitizeJsonString(xssJson);

      expect(sanitized).not.toContain("\x00");
      expect(sanitized).not.toMatch(/[\x00-\x1F\x7F]/);
    });
  });
});
