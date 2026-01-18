openapi: 3.0.3
info:
  title: LitStatus API
  description: |
    AI-powered caption generator with quota control, Supabase authentication, and Pro features.

    ## Authentication
    - **Guest**: No auth required, identified by IP, 3 requests/day
    - **User**: Bearer token from Supabase Auth, 20 requests/day
    - **Pro**: Unlimited quota, Vision API, all modes

    ## Rate Limiting
    All endpoints have rate limiting. See `X-RateLimit-*` headers.
  version: 1.0.0
  contact:
    name: LitStatus Support
    email: support@litstatus.com
  license:
    name: Proprietary

servers:
  - url: https://litstatus.com
    description: Production
  - url: http://localhost:3000
    description: Development

tags:
  - name: Generation
    description: Caption generation endpoints
  - name: User
    description: User-related endpoints
  - name: Analytics
    description: Analytics and events
  - name: Admin
    description: Admin-only endpoints
  - name: Health
    description: Health check endpoints

paths:
  /api/generate:
    post:
      tags:
        - Generation
      summary: Generate AI caption
      description: |
        Generate captions using AI. Supports text-only or image input (Pro only).
        Vision API and advanced modes require Pro subscription.
      operationId: generateCaption
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                text:
                  type: string
                  maxLength: 2000
                  description: Input text for caption generation
                  example: "Just landed in Tokyo with my camera"
                image:
                  type: string
                  format: binary
                  description: Image file (Pro only, max 10MB)
                mode:
                  type: string
                  enum: [Standard, Savage, Rizz]
                  default: Standard
                  description: Caption generation mode
                lang:
                  type: string
                  enum: [en, zh]
                  default: en
                  description: Response language
            encoding:
              image:
                contentType: image/jpeg, image/png, image/webp, image/gif
      responses:
        '200':
          description: Caption generated successfully
          headers:
            X-RateLimit-Limit:
              schema:
                type: integer
            X-RateLimit-Remaining:
              schema:
                type: integer
            X-RateLimit-Reset:
              schema:
                type: integer
            X-Request-ID:
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GenerateResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/Forbidden'
        '429':
          $ref: '#/components/responses/RateLimited'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /api/quota:
    get:
      tags:
        - User
      summary: Get quota status
      description: Get current user's quota status
      operationId: getQuota
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Quota status retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  quota:
                    $ref: '#/components/schemas/QuotaStatus'
        '429':
          $ref: '#/components/responses/RateLimited'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /api/wishlist:
    post:
      tags:
        - User
      summary: Join Pro wishlist
      description: Join the Pro feature waitlist
      operationId: joinWishlist
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
              properties:
                email:
                  type: string
                  format: email
                  maxLength: 320
                  example: user@example.com
                note:
                  type: string
                  maxLength: 500
                  example: "Interested in Vision API"
                lang:
                  type: string
                  enum: [en, zh]
                  default: en
                variant:
                  type: string
                  maxLength: 50
                  example: "a"
      responses:
        '200':
          description: Successfully joined wishlist
          content:
            application/json:
              schema:
                type: object
                properties:
                  ok:
                    type: boolean
                    example: true
        '400':
          $ref: '#/components/responses/BadRequest'
        '429':
          $ref: '#/components/responses/RateLimited'

  /api/feedback:
    post:
      tags:
        - User
      summary: Submit feedback
      description: Submit feedback on generated content
      operationId: submitFeedback
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - rating
              properties:
                rating:
                  type: integer
                  enum: [1, -1]
                  description: 1 for positive, -1 for negative
                mode:
                  type: string
                  maxLength: 50
                caption:
                  type: string
                  maxLength: 1000
                hashtags:
                  type: string
                  maxLength: 500
                detected_object:
                  type: string
                  maxLength: 200
                lang:
                  type: string
                  enum: [en, zh]
                  default: en
                variant:
                  type: string
                  maxLength: 50
      responses:
        '200':
          description: Feedback submitted
          content:
            application/json:
              schema:
                type: object
                properties:
                  ok:
                    type: boolean
        '400':
          $ref: '#/components/responses/BadRequest'
        '429':
          $ref: '#/components/responses/RateLimited'

  /api/events:
    post:
      tags:
        - Analytics
      summary: Track analytics event
      description: Track user behavior events for analytics
      operationId: trackEvent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - event
              properties:
                event:
                  type: string
                  enum:
                    - generate_success
                    - copy_caption
                    - copy_all
                    - feedback_up
                    - feedback_down
                    - wish_submit
                props:
                  type: object
                  properties:
                    session_id:
                      type: string
                      maxLength: 120
                    source:
                      type: string
                      maxLength: 120
                    medium:
                      type: string
                      maxLength: 120
                    campaign:
                      type: string
                      maxLength: 120
                    content:
                      type: string
                      maxLength: 120
                    term:
                      type: string
                      maxLength: 120
                    referrer:
                      type: string
                      maxLength: 200
                    current_path:
                      type: string
                      maxLength: 200
                    landing_path:
                      type: string
                      maxLength: 200
                    lang:
                      type: string
                      maxLength: 10
                    variant:
                      type: string
                      maxLength: 80
                    mode:
                      type: string
                      maxLength: 20
                    has_image:
                      type: boolean
      responses:
        '200':
          description: Event tracked
          content:
            application/json:
              schema:
                type: object
                properties:
                  ok:
                    type: boolean
        '400':
          $ref: '#/components/responses/BadRequest'
        '429':
          $ref: '#/components/responses/RateLimited'

  /api/health:
    get:
      tags:
        - Health
      summary: Health check
      description: Check system health and service status
      operationId: healthCheck
      responses:
        '200':
          description: System is healthy (or degraded)
          headers:
            X-Response-Time:
              schema:
                type: string
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'
        '503':
          description: System is unhealthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'

  /api/admin/wishlist/export:
    get:
      tags:
        - Admin
      summary: Export Pro wishlist
      description: Export all Pro wishlist signups as CSV
      operationId: exportWishlist
      security:
        - AdminAuth: []
      parameters:
        - name: format
          in: query
          schema:
            type: string
            enum: [json, csv]
            default: json
        - name: token
          in: query
          required: false
          schema:
            type: string
          description: Admin token (or use Authorization header)
      responses:
        '200':
          description: Export successful
          content:
            text/csv:
              schema:
                type: string
                example: |
                  id,user_id,email,note,lang,variant,created_at
                  uuid-123,user-uuid,user@example.com,Note,en,a,2025-01-18T00:00:00Z
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/WishlistEntry'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /api/admin/funnel/report:
    get:
      tags:
        - Admin
      summary: Get funnel analytics report
      description: Get conversion funnel metrics by traffic source
      operationId: funnelReport
      security:
        - AdminAuth: []
      parameters:
        - name: token
          in: query
          schema:
            type: string
        - name: format
          in: query
          schema:
            type: string
            enum: [json, csv]
            default: json
        - name: days
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 180
            default: 30
        - name: source
          in: query
          schema:
            type: string
            maxLength: 120
      responses:
        '200':
          description: Report generated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FunnelReport'
            text/csv:
              schema:
                type: string
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /api/security/csp-report:
    post:
      tags:
        - Security
      summary: Report CSP violation
      description: Endpoint for browser CSP violation reports
      operationId: cspReport
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                csp-report:
                  type: object
      responses:
        '200':
          description: Report logged

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Supabase Auth JWT token
    AdminAuth:
      type: apiKey
      in: header
      name: Authorization
      description: |
        Admin authentication using Bearer token or HMAC signature.

        **Bearer Token:**
        ```
        Authorization: Bearer <admin-token>
        ```

        **HMAC Signature (Preferred):**
        ```
        X-Signature: <hmac-sha256-signature>
        X-Timestamp: <unix-timestamp>
        ```

  schemas:
    GenerateResponse:
      type: object
      properties:
        caption:
          type: string
          example: "Tokyo through the lens. Every corner is a frame waiting to happen. 🇯🇵📷"
        hashtags:
          type: string
          example: "#Tokyo #TravelJapan #StreetPhoto"
        detected_object:
          type: string
          nullable: true
          example: "camera"
        affiliate_category:
          type: string
          nullable: true
          example: "Camera lens filter kit"
        affiliate:
          type: object
          nullable: true
          properties:
            name:
              type: string
            url:
              type: string
            discount:
              type: string
        quota:
          $ref: '#/components/schemas/QuotaStatus'
        cached:
          type: boolean

    QuotaStatus:
      type: object
      properties:
        plan:
          type: string
          enum: [guest, user, pro]
        limit:
          type: integer
          nullable: true
          description: Daily limit (null for Pro)
        remaining:
          type: integer
          nullable: true
          description: Remaining requests (null for Pro)
        isPro:
          type: boolean

    HealthResponse:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, degraded, unhealthy]
        timestamp:
          type: string
          format: date-time
        services:
          type: object
          properties:
            database:
              type: object
              properties:
                status:
                  type: string
                latency:
                  type: integer
            openai:
              type: object
              properties:
                status:
                  type: string
                circuitBreaker:
                  type: object
            redis:
              type: object
              properties:
                status:
                  type: string
                stats:
                  type: object
        performance:
          type: object
          properties:
            slowOperations:
              type: integer
            avgOpenaiLatency:
              type: number
            openaiSuccessRate:
              type: number
            cacheStats:
              type: object
              properties:
                hits:
                  type: integer
                misses:
                  type: integer
                hitRate:
                  type: number

    FunnelReport:
      type: object
      properties:
        summary:
          type: object
          properties:
            window_days:
              type: integer
            from:
              type: string
              format: date-time
            to:
              type: string
              format: date-time
            sessions:
              type: object
              properties:
                generate:
                  type: integer
                copy:
                  type: integer
                feedback:
                  type: integer
                wishlist:
                  type: integer
            events:
              type: object
            rates:
              type: object
              properties:
                copy_rate:
                  type: number
                feedback_rate:
                  type: number
                wishlist_rate:
                  type: number
        sources:
          type: array
          items:
            type: object
            properties:
              source:
                type: string
              sessions:
                type: object
              events:
                type: object
              rates:
                type: object

    WishlistEntry:
      type: object
      properties:
        id:
          type: string
          format: uuid
        user_id:
          type: string
          format: uuid
          nullable: true
        email:
          type: string
          format: email
        note:
          type: string
          nullable: true
        lang:
          type: string
        variant:
          type: string
          nullable: true
        created_at:
          type: string
          format: date-time

    ErrorResponse:
      type: object
      properties:
        error:
          type: string
        quota:
          $ref: '#/components/schemas/QuotaStatus'

  responses:
    BadRequest:
      description: Bad request - validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error: "Text too long."

    Unauthorized:
      description: Unauthorized - authentication required or failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error: "Unauthorized"

    Forbidden:
      description: Forbidden - feature not available for current plan
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error: "This mode is available for Pro only."

    RateLimited:
      description: Too many requests - rate limit exceeded
      headers:
        Retry-After:
          schema:
            type: string
          description: Seconds until retry
        X-RateLimit-Limit:
          schema:
            type: integer
        X-RateLimit-Remaining:
          schema:
            type: integer
        X-RateLimit-Reset:
          schema:
            type: integer
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error: "Too many requests"

    InternalServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error: "Service error. Please try again later."
