# LitStatus Documentation Index

Complete documentation index for LitStatus.com production deployment.

## Documentation Overview

| Category | Documents | Description |
|----------|-----------|-------------|
| **Getting Started** | README.md | Project overview and quick start |
| **API** | 2 documents | API reference and OpenAPI spec |
| **Deployment** | 1 document | Deployment runbook |
| **Architecture** | 1 document | System architecture |
| **Security** | 1 document | Security configuration |
| **i18n** | 1 document | Internationalization guide |
| **Development** | 1 document | Development and contributing |

---

## Quick Links

### For Developers
- [Development Guide](development/DEVELOPMENT_GUIDE.md) - Set up your dev environment
- [API Reference](api/API_REFERENCE.md) - Learn the API endpoints
- [Architecture](architecture/ARCHITECTURE.md) - Understand the system design

### For DevOps
- [Deployment Runbook](deployment/DEPLOYMENT_RUNBOOK.md) - Deploy to production
- [Security Guide](security/SECURITY_GUIDE.md) - Security configuration

### For Translators
- [i18n Guide](i18n/I18N_GUIDE.md) - Add new translations

---

## Document List

### Root
- [README.md](../README.md) - Project overview and quick start

### API Documentation
- [API Reference](api/API_REFERENCE.md) - Complete API documentation with examples
  - All endpoints documented
  - Request/response examples
  - Error codes
  - Rate limits
- [OpenAPI Spec](api/OPENAPI_SPEC.md) - OpenAPI 3.0 specification
  - Machine-readable spec
  - Schema definitions
  - Security schemes

### Deployment
- [Deployment Runbook](deployment/DEPLOYMENT_RUNBOOK.md) - Step-by-step deployment guide
  - Prerequisites
  - Pre-deployment checklist
  - Cloudflare Pages deployment
  - Docker deployment
  - Health verification
  - Rollback procedures
  - Troubleshooting

### Architecture
- [Architecture](architecture/ARCHITECTURE.md) - System architecture and design
  - System overview
  - Technology stack
  - Architecture diagrams
  - Component design
  - Data flow
  - Security architecture
  - Scalability design
  - Technology decisions

### Security
- [Security Guide](security/SECURITY_GUIDE.md) - Security features and configuration
  - CSP configuration
  - Rate limiting
  - Admin API authentication
  - Input validation
  - Security monitoring
  - Incident response

### Internationalization
- [i18n Guide](i18n/I18N_GUIDE.md) - Multi-language support
  - Supported languages
  - Language detection
  - Adding translations
  - URL structure
  - SEO considerations

### Development
- [Development Guide](development/DEVELOPMENT_GUIDE.md) - Local development setup
  - Quick start
  - Environment setup
  - Project structure
  - Coding standards
  - Testing guide
  - Common tasks
  - Debugging

---

## Documentation Metrics

| Metric | Count |
|--------|-------|
| Total Documents | 8 |
| Total Word Count | ~18,000 |
| API Endpoints Documented | 9 |
| Code Examples | 30+ |

---

## Contributing to Documentation

When adding new features, update the relevant documentation:

1. **API Changes**: Update docs/api/API_REFERENCE.md and docs/api/OPENAPI_SPEC.md
2. **Environment Variables**: Update README.md and docs/deployment/DEPLOYMENT_RUNBOOK.md
3. **Security Changes**: Update docs/security/SECURITY_GUIDE.md
4. **New Features**: Update relevant docs and add to this index

### Documentation Style

- Use clear, concise language
- Include code examples
- Provide curl commands for API examples
- Use tables for reference information
- Include diagrams where helpful
- Cross-reference related documents

---

## Support

For documentation issues:
- GitHub Issues: https://github.com/7and1/litstatus/issues
- Email: docs@litstatus.com

---

**Last Updated**: 2025-01-18
