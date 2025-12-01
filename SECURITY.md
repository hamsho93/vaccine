# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### For Security Issues

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please email: mahmoudhamsho@gmail.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

We will respond within 48 hours and provide a timeline for a fix.

### For General Bugs

Non-security bugs can be reported via [GitHub Issues](https://github.com/hamsho93/vaccine/issues).

## Security Considerations

### Data Privacy

- **No PHI Storage**: Patient data is processed in-memory only. No data is persisted to databases or logs.
- **Session-Only**: All vaccine data is cleared when the browser session ends.
- **HTTPS Only**: All API calls use HTTPS in production.
- **CORS Protection**: API endpoints are restricted to authorized frontend domains via `ALLOWED_ORIGIN`.

### Deployment Security

For production deployments:

1. **Environment Variables**: Store all secrets (OPENAI_API_KEY, etc.) in environment variables, never in code.
2. **CORS Configuration**: Set `ALLOWED_ORIGIN` in backend environment to your specific frontend domain.
3. **API Key Rotation**: Rotate OpenAI API keys regularly (every 90 days recommended).
4. **Monitoring**: Enable CloudWatch alarms for API errors and unusual traffic patterns.
5. **Access Control**: Use AWS IAM roles with least-privilege permissions.

### Known Development Dependencies with Advisories

The following development-only dependencies have known advisories (not affecting production):

- **esbuild** (moderate): Development server vulnerability - does not affect Lambda runtime
- Mitigations: Only run dev server on localhost; never expose development server to public internet

### HIPAA Compliance Notes

This application is designed with privacy-first principles:

- No patient identifiers stored
- No audit logs of patient data
- Session-based processing only
- Suitable for HIPAA-covered entities when deployed according to best practices

**Recommended HIPAA deployment checklist:**
- Use AWS Amplify with HIPAA-eligible services
- Enable CloudWatch logging for access auditing
- Implement IP restrictions or VPN for admin access
- Sign Business Associate Agreement (BAA) with AWS
- Document data flow and security controls

## Responsible Disclosure

We follow responsible disclosure practices:

1. Reporter notifies us privately
2. We confirm and assess severity
3. We develop and test a fix
4. We release a patch within 30 days (critical issues) or 90 days (others)
5. We credit the reporter (if desired) after fix is public

Thank you for helping keep VaxRecord secure!

