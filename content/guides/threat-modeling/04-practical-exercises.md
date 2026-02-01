---
title: 'Practical Exercises'
description: 'Apply STRIDE, DREAD, and attack tree methodologies with hands-on exercises. Practice threat modeling on realistic scenarios.'
order: 4
---

Theory becomes skill through practice. This section provides hands-on exercises to apply the threat modeling methodologies you've learned. Each exercise includes a scenario, guided questions, and sample solutions.

## Exercise 1: STRIDE Analysis of a REST API

### Scenario

You're reviewing the security of a new REST API for a task management application. The API has these endpoints:

```
POST   /api/auth/login          - Authenticate user
POST   /api/auth/register       - Create new account
GET    /api/tasks               - List user's tasks
POST   /api/tasks               - Create a task
PUT    /api/tasks/:id           - Update a task
DELETE /api/tasks/:id           - Delete a task
GET    /api/tasks/:id/share     - Get share link for task
POST   /api/users/:id/avatar    - Upload profile picture
```

### Your Task

Apply STRIDE to each endpoint. For each threat category, identify at least one potential vulnerability.

### Guided Questions

1. **Spoofing**: How could an attacker impersonate another user?
2. **Tampering**: What data could be modified maliciously?
3. **Repudiation**: Which actions lack proper audit trails?
4. **Information Disclosure**: Where might sensitive data leak?
5. **Denial of Service**: Which endpoints could be overwhelmed?
6. **Elevation of Privilege**: How could a user access others' data?

### Sample Solution

<details>
<summary>Click to reveal solution</summary>

```yaml
stride_analysis:
  spoofing:
    - endpoint: POST /api/auth/login
      threat: "Credential stuffing with leaked passwords"
      mitigation: "Rate limiting, MFA, breach detection"
    
    - endpoint: GET /api/tasks/:id/share
      threat: "Share links could be guessed or brute-forced"
      mitigation: "Use UUIDs, add authentication tokens"

  tampering:
    - endpoint: PUT /api/tasks/:id
      threat: "Modify task ID in request to change others' tasks"
      mitigation: "Server-side ownership verification"
    
    - endpoint: POST /api/users/:id/avatar
      threat: "Upload malicious file (XSS in SVG, webshell)"
      mitigation: "Validate file type, sanitize, serve from separate domain"

  repudiation:
    - endpoint: DELETE /api/tasks/:id
      threat: "No audit log - user claims they didn't delete task"
      mitigation: "Log all destructive operations with user ID, IP, timestamp"
    
    - endpoint: PUT /api/tasks/:id
      threat: "Changes not tracked - no history of modifications"
      mitigation: "Implement version history or change log"

  information_disclosure:
    - endpoint: GET /api/tasks
      threat: "API returns more fields than UI needs (over-fetching)"
      mitigation: "Use DTOs, only return necessary fields"
    
    - endpoint: POST /api/auth/login
      threat: "Different error messages reveal if email exists"
      mitigation: "Generic 'invalid credentials' message"

  denial_of_service:
    - endpoint: POST /api/auth/register
      threat: "Mass account creation depletes resources"
      mitigation: "CAPTCHA, rate limiting, email verification"
    
    - endpoint: POST /api/users/:id/avatar
      threat: "Upload huge files to fill storage"
      mitigation: "File size limits, quota per user"

  elevation_of_privilege:
    - endpoint: GET /api/tasks/:id
      threat: "IDOR - change task ID to access others' tasks"
      mitigation: "Verify task.owner_id == current_user.id"
    
    - endpoint: PUT /api/tasks/:id
      threat: "Modify task ownership via request body"
      mitigation: "Ignore owner_id in request, use authenticated user"
```

</details>

## Exercise 2: DREAD Scoring Comparison

### Scenario

Your security scanner found these vulnerabilities. Score each using DREAD and determine which to fix first.

**Vulnerability A**: SQL injection in admin search feature (requires admin login)

**Vulnerability B**: Stored XSS in public comment section

**Vulnerability C**: CSRF on email change functionality

**Vulnerability D**: Sensitive data in URL parameters (logged in access logs)

### Your Task

Score each vulnerability (1-10) for Damage, Reproducibility, Exploitability, Affected Users, and Discoverability. Calculate average scores and rank them.

### Guided Questions

For each vulnerability, ask:
- What's the worst-case impact?
- How reliable is the exploit?
- What skills/tools are needed?
- How many users could be affected?
- How easy is it to discover?

### Sample Solution

<details>
<summary>Click to reveal solution</summary>

```python
vulnerabilities = {
    'A - SQL Injection (Admin)': {
        'damage': 10,           # Full database access
        'reproducibility': 9,   # Reliable once found
        'exploitability': 5,    # Requires admin access first
        'affected_users': 10,   # All users' data at risk
        'discoverability': 3,   # Hidden behind admin auth
        'average': 7.4
    },
    'B - Stored XSS (Public)': {
        'damage': 6,            # Session hijacking, phishing
        'reproducibility': 10,  # Works every time
        'exploitability': 8,    # Easy to exploit
        'affected_users': 8,    # All visitors to that page
        'discoverability': 7,   # Scanner might find it
        'average': 7.8
    },
    'C - CSRF (Email Change)': {
        'damage': 7,            # Account takeover via password reset
        'reproducibility': 8,   # Needs user to click link
        'exploitability': 6,    # Moderate skill needed
        'affected_users': 4,    # Individual targets
        'discoverability': 5,   # Manual testing reveals
        'average': 6.0
    },
    'D - Sensitive URLs': {
        'damage': 5,            # Data exposure in logs
        'reproducibility': 10,  # Always logged
        'exploitability': 3,    # Need access to logs
        'affected_users': 6,    # Users who used that feature
        'discoverability': 4,   # Need to review logs
        'average': 5.6
    }
}

# Priority Order:
# 1. B - Stored XSS (7.8) - High impact, public-facing
# 2. A - SQL Injection (7.4) - Devastating but limited access
# 3. C - CSRF Email (6.0) - Targeted account takeover
# 4. D - Sensitive URLs (5.6) - Lower immediate risk
```

**Reasoning**:
- Stored XSS is prioritized because it's public-facing and affects all visitors
- SQL injection is severe but requires admin access first
- CSRF is targeted (one victim at a time)
- URL logging is a privacy concern but requires log access

</details>

## Exercise 3: Build an Attack Tree

### Scenario

Your company stores customer payment information. Build an attack tree for the goal: **"Steal credit card data"**

The system architecture:
- Web application (React frontend, Node.js backend)
- PostgreSQL database with encrypted card data
- Encryption keys stored in AWS Secrets Manager
- Employees access via VPN
- Third-party payment processor integration

### Your Task

Create an attack tree with at least 3 high-level approaches and 2 levels of decomposition. Include AND/OR gates.

### Guided Questions

1. What are the different ways to access the data?
2. For each approach, what steps are required?
3. Which steps must ALL be completed (AND) vs. which are alternatives (OR)?
4. What are the leaf-level atomic actions?

### Sample Solution

<details>
<summary>Click to reveal solution</summary>

```
Goal: Steal Credit Card Data
 OR
 |
 |-- [1] Compromise Web Application
 |   OR
 |   |-- [1.1] Exploit Application Vulnerability
 |   |   AND
 |   |   |-- Find RCE/SQLi vulnerability
 |   |   |-- Establish persistence
 |   |   |-- Access encrypted data
 |   |   |-- Obtain decryption key (see branch 3)
 |   |
 |   |-- [1.2] Steal Session Tokens
 |       AND
 |       |-- Inject XSS payload
 |       |-- Victim (admin) visits page
 |       |-- Exfil session cookie
 |       |-- Access admin panel
 |       |-- Export card data
 |
 |-- [2] Compromise Cloud Infrastructure
 |   OR
 |   |-- [2.1] Steal AWS Credentials
 |   |   OR
 |   |   |-- Find leaked keys in Git
 |   |   |-- Phish developer with AWS access
 |   |   |-- Exploit SSRF to access metadata service
 |   |
 |   |-- [2.2] Exploit Misconfiguration
 |       OR
 |       |-- Public S3 bucket with backups
 |       |-- Overly permissive IAM role
 |       |-- Unencrypted RDS snapshot
 |
 |-- [3] Obtain Encryption Keys
 |   OR
 |   |-- [3.1] Access AWS Secrets Manager
 |   |   AND
 |   |   |-- Obtain AWS credentials (see 2.1)
 |   |   |-- Have secretsmanager:GetSecretValue permission
 |   |
 |   |-- [3.2] Memory Dump
 |   |   AND
 |   |   |-- Get shell on application server
 |   |   |-- Dump process memory
 |   |   |-- Extract keys from memory
 |   |
 |   |-- [3.3] Social Engineering
 |       AND
 |       |-- Identify key custodian
 |       |-- Craft pretext (urgent audit, compliance)
 |       |-- Custodian shares access
 |
 |-- [4] Insider Threat
 |   OR
 |   |-- [4.1] Malicious Employee
 |   |   AND
 |   |   |-- Employee has database access
 |   |   |-- Employee has key access
 |   |   |-- Employee exports data
 |   |
 |   |-- [4.2] Compromised Employee
 |       AND
 |       |-- Target employee with access
 |       |-- Compromise their workstation (malware)
 |       |-- Pivot to internal systems
 |
 |-- [5] Third-Party Compromise
     AND
     |-- Payment processor is breached
     |-- Your transactions are in breach scope
     |-- Data includes your customers
```

**Analysis**:
- Critical control: AWS Secrets Manager access (appears in multiple paths)
- Cheapest path: Public S3 bucket (if misconfigured)
- Most likely: Phishing + credential theft chain
- Hardest to defend: Third-party compromise (limited control)

</details>

## Exercise 4: Full Threat Model

### Scenario

You're designing a new feature: **Two-Factor Authentication (2FA) via SMS**.

The flow:
1. User enters username/password
2. If valid, server sends 6-digit code via SMS
3. User enters code within 5 minutes
4. If valid, session is created

### Your Task

Perform a complete threat model:
1. Draw a simple data flow diagram
2. Apply STRIDE to each component
3. Score top threats with DREAD
4. Build an attack tree for "Bypass 2FA"
5. Recommend mitigations

### Sample Solution

<details>
<summary>Click to reveal solution</summary>

**1. Data Flow Diagram**

```
[User Browser] ---(1. username/password)---> [Auth Service]
                                                   |
                                           (2. generate code)
                                                   |
                                                   v
                                             [SMS Gateway]
                                                   |
                                           (3. SMS with code)
                                                   |
                                                   v
                                            [User's Phone]
                                                   |
[User Browser] <---(4. enter code)---
       |
       +--(5. code)---> [Auth Service] ---(verify)---> [Session Created]
```

**2. STRIDE Analysis**

| Component | Threat | Category | Description |
|-----------|--------|----------|-------------|
| Auth Service | Brute force code | EoP | Try all 1M codes |
| Auth Service | Code reuse | Tampering | Use same code twice |
| SMS Gateway | SIM swap | Spoofing | Attacker receives SMS |
| SMS Gateway | Interception | Info Disclosure | SS7 attack |
| User Phone | Malware | Spoofing | App reads SMS |
| Code generation | Predictable | Tampering | Weak RNG |
| Session | Fixation | Spoofing | Pre-set session ID |
| Logs | Codes in logs | Info Disclosure | Ops can see codes |

**3. DREAD Scoring**

```
Threat: SIM Swap Attack
D: 8 (full account takeover)
R: 7 (carrier social engineering works)
E: 5 (requires research on target)
A: 3 (targeted individuals)
D: 6 (known attack vector)
Average: 5.8 - HIGH

Threat: Brute Force Code
D: 8 (account takeover)
R: 10 (deterministic)
E: 9 (simple script)
A: 10 (any user)
D: 8 (obvious attack)
Average: 9.0 - CRITICAL

Threat: Code Logged
D: 6 (insider access to accounts)
R: 10 (always logged if not prevented)
E: 3 (need log access)
A: 10 (all users)
D: 2 (need insider access)
Average: 6.2 - HIGH
```

**4. Attack Tree: Bypass 2FA**

```
Goal: Bypass SMS 2FA
 OR
 |-- Brute Force Code
 |   AND
 |   |-- Know username/password
 |   |-- No rate limiting
 |   |-- Try 1,000,000 combinations
 |
 |-- Intercept SMS
 |   OR
 |   |-- SIM Swap
 |   |   AND
 |   |   |-- Know target's phone number
 |   |   |-- Social engineer carrier
 |   |
 |   |-- SS7 Attack
 |   |   AND
 |   |   |-- Access to SS7 network
 |   |   |-- Intercept SMS in transit
 |   |
 |   |-- Malware on Phone
 |       AND
 |       |-- Trick user to install app
 |       |-- App has SMS permission
 |       |-- Exfil code to attacker
 |
 |-- Bypass Implementation
 |   OR
 |   |-- Race Condition
 |   |   AND
 |   |   |-- Submit code and change password simultaneously
 |   |   |-- 2FA check is skipped
 |   |
 |   |-- Predictable Codes
 |       AND
 |       |-- Weak random number generator
 |       |-- Predict next code
 |
 |-- Social Engineering
     AND
     |-- Call support as victim
     |-- Claim lost phone
     |-- Support disables 2FA
```

**5. Mitigations**

| Threat | Mitigation | Priority |
|--------|------------|----------|
| Brute force | Rate limit: 3 attempts, exponential backoff | P0 |
| Brute force | Code lockout after 5 failures | P0 |
| SIM swap | Offer TOTP/hardware keys as alternative | P1 |
| SS7 | Encourage app-based 2FA | P1 |
| Code logged | Never log codes, use separate audit system | P1 |
| Race condition | Atomic transaction for auth flow | P0 |
| Predictable | Use cryptographically secure RNG | P0 |
| Social engineering | Require additional verification for 2FA disable | P1 |

</details>

## Exercise 5: Threat Model Review

### Scenario

Review this threat model for a Kubernetes deployment. Find what's missing or incorrect.

```yaml
system: Customer API
components:
  - name: API Gateway (Kong)
    threats:
      - type: DoS
        description: "Rate limiting protects against DoS"
        status: mitigated
  
  - name: Customer Service (Pod)
    threats:
      - type: Tampering
        description: "JWT tokens prevent tampering"
        status: mitigated
  
  - name: PostgreSQL (StatefulSet)
    threats:
      - type: Information Disclosure
        description: "Database is encrypted at rest"
        status: mitigated
```

### Your Task

Identify gaps in this threat model:
1. What STRIDE categories are missing for each component?
2. What Kubernetes-specific threats are not addressed?
3. Are the "mitigated" statuses accurate?

### Sample Solution

<details>
<summary>Click to reveal solution</summary>

**Gaps Found**:

**API Gateway (Kong)**:
- Missing: Spoofing (authentication bypass)
- Missing: Information Disclosure (verbose errors)
- Missing: Elevation of Privilege (admin API exposure)
- DoS "mitigated" is overconfident - rate limiting helps but doesn't prevent sophisticated attacks

**Customer Service**:
- Missing: Spoofing (JWT secret compromise)
- Missing: Repudiation (no audit logging mentioned)
- Missing: Information Disclosure (logs, error messages)
- Missing: DoS (no resource limits mentioned)
- Missing: EoP (container escape, RBAC)
- JWT alone doesn't prevent tampering of other data (database, files)

**PostgreSQL**:
- Missing: Spoofing (credential theft)
- Missing: Tampering (SQL injection from app)
- Missing: DoS (resource exhaustion, slow queries)
- Missing: EoP (database user privileges)
- Encryption at rest doesn't protect data in transit or from app-level access

**Kubernetes-Specific Threats Not Addressed**:
- Container escape / kernel exploits
- RBAC misconfiguration
- Secrets management (how are credentials stored?)
- Network policies (pod-to-pod communication)
- Image vulnerabilities
- Supply chain (base image trust)
- Node compromise
- etcd security
- Service account token abuse

**Corrected Threat Model**:

```yaml
system: Customer API
components:
  - name: API Gateway (Kong)
    threats:
      - type: Spoofing
        description: "Authentication bypass via misconfigured plugins"
        status: needs_review
      - type: DoS
        description: "Volumetric attacks may exceed rate limits"
        status: partially_mitigated
        mitigation: "Rate limiting + WAF + CDN"
      - type: EoP
        description: "Admin API exposed to internet"
        status: open
        mitigation: "Bind admin to localhost, use NetworkPolicy"
  
  - name: Customer Service (Pod)
    threats:
      - type: Spoofing
        description: "JWT secret stored in Kubernetes Secret"
        status: needs_review
        mitigation: "Rotate secrets, use external secrets manager"
      - type: Repudiation
        description: "No structured audit logging"
        status: open
      - type: EoP
        description: "Container runs as root, no securityContext"
        status: open
        mitigation: "runAsNonRoot, drop capabilities, read-only rootfs"
  
  - name: PostgreSQL
    threats:
      - type: Information Disclosure
        description: "Encryption at rest enabled"
        status: mitigated
      - type: Information Disclosure  
        description: "Traffic between app and DB unencrypted"
        status: open
        mitigation: "Enable SSL, verify certificates"
      - type: Tampering
        description: "App uses parameterized queries"
        status: needs_verification
  
  - name: Kubernetes Cluster
    threats:
      - type: EoP
        description: "Default service accounts have cluster access"
        status: needs_review
      - type: Information Disclosure
        description: "etcd not encrypted"
        status: open
```

</details>

## Self-Assessment Checklist

After completing these exercises, verify you can:

- [ ] Apply all six STRIDE categories to system components
- [ ] Score threats consistently using DREAD factors
- [ ] Build attack trees with proper AND/OR logic
- [ ] Identify critical nodes in attack trees
- [ ] Combine methodologies for comprehensive analysis
- [ ] Spot gaps in existing threat models
- [ ] Recommend prioritized mitigations

## Next Steps

Now that you've practiced threat modeling:

1. **Apply to your own systems**: Pick a service you maintain and threat model it
2. **Involve your team**: Threat modeling works best as a collaborative exercise
3. **Make it routine**: Include threat modeling in design reviews
4. **Validate with testing**: Use findings to guide penetration testing
5. **Track over time**: Update threat models as systems evolve

## Further Reading

- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling) - Comprehensive guide
- [Microsoft Threat Modeling Tool](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool) - Free tool and documentation
- [Threat Modeling: Designing for Security](https://www.amazon.com/Threat-Modeling-Designing-Adam-Shostack/dp/1118809998) - Adam Shostack's definitive book
- [STRIDE/DREAD Paper](https://shostack.org/resources/threat-modeling) - Original Microsoft paper
