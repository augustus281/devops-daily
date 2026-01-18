---
title: 'The CIA Triad'
description: 'Understanding Confidentiality, Integrity, and Availability - the three pillars of information security.'
order: 1
---

The CIA Triad is the cornerstone of information security. It provides a framework for thinking about security controls and helps you make decisions about protecting your systems and data. Every security measure you implement should address one or more of these three principles.

## What is the CIA Triad?

The CIA Triad consists of three fundamental principles:

- **Confidentiality**: Ensuring information is accessible only to authorized individuals
- **Integrity**: Ensuring information is accurate and hasn't been tampered with
- **Availability**: Ensuring information and systems are accessible when needed

These three principles often create tension with each other. For example, making data highly available might reduce confidentiality, or strong integrity checks might impact availability. Good security architecture balances all three.

## Confidentiality

Confidentiality ensures that sensitive information is protected from unauthorized access. This is about keeping secrets secret.

### Threats to Confidentiality

- **Data breaches**: Unauthorized access to databases or file systems
- **Man-in-the-middle attacks**: Intercepting data in transit
- **Social engineering**: Tricking users into revealing information
- **Improper access controls**: Overly permissive permissions

### Controls for Confidentiality

#### Encryption

Encrypt data at rest and in transit:

```bash
# Encrypt a file with GPG
gpg --symmetric --cipher-algo AES256 sensitive-data.txt

# Encrypt data in transit with TLS
openssl s_client -connect example.com:443
```

#### Access Controls

Implement proper file permissions:

```bash
# Restrict file access to owner only
chmod 600 /path/to/sensitive-file

# Set restrictive directory permissions
chmod 700 /path/to/sensitive-directory
```

#### Secrets Management

Never hardcode secrets in your code:

```yaml
# Bad: Hardcoded secret
database_password: "mysecretpassword"

# Good: Reference from secrets manager
database_password: ${vault:database/credentials#password}
```

### Real-World Example: Protecting API Keys

```bash
# Store secrets in environment variables
export API_KEY=$(vault kv get -field=api_key secret/myapp)

# Use in your application
curl -H "Authorization: Bearer $API_KEY" https://api.example.com/data
```

## Integrity

Integrity ensures that data remains accurate, complete, and trustworthy throughout its lifecycle. This means preventing unauthorized modifications and detecting when changes occur.

### Threats to Integrity

- **Unauthorized modifications**: Attackers changing data or code
- **Accidental changes**: Human error corrupting data
- **Malware**: Software that modifies files or data
- **Man-in-the-middle attacks**: Altering data in transit

### Controls for Integrity

#### Checksums and Hashes

Verify file integrity:

```bash
# Generate SHA256 checksum
sha256sum important-file.tar.gz > checksum.txt

# Verify checksum later
sha256sum -c checksum.txt
# important-file.tar.gz: OK
```

#### Digital Signatures

Sign and verify artifacts:

```bash
# Sign a file with GPG
gpg --armor --detach-sign release.tar.gz

# Verify the signature
gpg --verify release.tar.gz.asc release.tar.gz
```

#### Git Commit Signing

Ensure code integrity in your repositories:

```bash
# Configure Git to sign commits
git config --global commit.gpgsign true
git config --global user.signingkey YOUR_GPG_KEY_ID

# Sign a commit
git commit -S -m "Add new feature"

# Verify signed commits
git log --show-signature
```

### Real-World Example: Container Image Verification

```bash
# Sign container images with cosign
cosign sign --key cosign.key myregistry.io/myapp:v1.0.0

# Verify before deployment
cosign verify --key cosign.pub myregistry.io/myapp:v1.0.0
```

## Availability

Availability ensures that systems and data are accessible when authorized users need them. Downtime can be just as damaging as a security breach.

### Threats to Availability

- **DDoS attacks**: Overwhelming systems with traffic
- **Hardware failures**: Disk crashes, power outages
- **Software bugs**: Crashes and memory leaks
- **Ransomware**: Encrypting data and demanding payment

### Controls for Availability

#### Redundancy and Failover

Design for high availability:

```yaml
# Kubernetes deployment with replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    spec:
      containers:
      - name: web
        image: myapp:latest
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

#### Backup Strategies

Implement the 3-2-1 backup rule:

```bash
# 3 copies: Production + 2 backups
# 2 different media types
# 1 offsite location

# Example: Backup to S3 with versioning
aws s3 sync /data s3://my-backup-bucket/data --delete

# Enable versioning for recovery
aws s3api put-bucket-versioning \
  --bucket my-backup-bucket \
  --versioning-configuration Status=Enabled
```

#### DDoS Protection

```bash
# Rate limiting with iptables
iptables -A INPUT -p tcp --dport 80 \
  -m connlimit --connlimit-above 50 -j DROP

# Use a WAF or CDN for additional protection
```

### Real-World Example: Health Checks

```yaml
# Kubernetes liveness and readiness probes
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 3
```

## Balancing the CIA Triad

The three principles often create trade-offs:

| Scenario | Confidentiality | Integrity | Availability | Trade-off |
|----------|-----------------|-----------|--------------|----------|
| Public website | Low | Medium | High | Prioritize uptime over secrecy |
| Banking system | High | High | High | All three critical, highest cost |
| Health records | High | High | Medium | Privacy and accuracy over 24/7 access |
| Internal wiki | Medium | Medium | High | Ease of access for productivity |

### Making Trade-off Decisions

When designing systems, ask:

1. **What data are we protecting?** (Personal, financial, public)
2. **What are the consequences of a breach?** (Legal, reputational, financial)
3. **Who needs access?** (Everyone, authenticated users, specific roles)
4. **What's the acceptable downtime?** (Minutes, hours, days)

## Key Takeaways

- The CIA Triad provides a framework for security decision-making
- **Confidentiality**: Protect sensitive data through encryption and access controls
- **Integrity**: Ensure data accuracy through checksums, signatures, and audit trails
- **Availability**: Maintain uptime through redundancy, backups, and monitoring
- Balance all three based on your specific use case and risk tolerance

## Practice Exercise

Analyze a system you work with:

1. Identify the most critical data it handles
2. Rate its current CIA protection (1-5 for each)
3. Identify one improvement for each principle
4. Consider the trade-offs of implementing those improvements
