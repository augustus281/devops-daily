---
title: 'Defense in Depth'
description: 'Learn how to implement layered security strategies to protect your infrastructure from multiple attack vectors.'
order: 2
---

Defense in Depth is a security strategy that employs multiple layers of security controls throughout your infrastructure. If one layer fails, others remain to protect your assets. Think of it like a medieval castle with moats, walls, towers, and guards—each layer adds protection.

## The Layered Security Model

Defense in Depth typically consists of these layers:

```
+-------------------------------------------+
|           Physical Security               |
|  +-------------------------------------+  |
|  |        Network Security             |  |
|  |  +-------------------------------+  |  |
|  |  |       Host Security           |  |  |
|  |  |  +-------------------------+  |  |  |
|  |  |  |  Application Security   |  |  |  |
|  |  |  |  +-------------------+  |  |  |  |
|  |  |  |  |   Data Security   |  |  |  |  |
|  |  |  |  +-------------------+  |  |  |  |
|  |  |  +-------------------------+  |  |  |
|  |  +-------------------------------+  |  |
|  +-------------------------------------+  |
+-------------------------------------------+
```

Each layer provides independent protection, so an attacker must bypass multiple defenses to reach your critical assets.

## Layer 1: Physical Security

Physical security protects the hardware and facilities that house your systems.

### Cloud Considerations

When using cloud providers, physical security is largely their responsibility:

- Data center access controls
- Biometric authentication
- 24/7 surveillance
- Environmental controls

### On-Premises Considerations

For on-premises infrastructure:

```bash
# Physical security checklist
- [ ] Locked server rooms with access logs
- [ ] Security cameras at entry points
- [ ] Badge access systems
- [ ] Visitor sign-in procedures
- [ ] Hardware asset tracking
- [ ] Secure disposal of old equipment
```

## Layer 2: Network Security

Network security controls traffic flow and prevents unauthorized network access.

### Firewalls and Security Groups

```bash
# AWS Security Group - Web Server
aws ec2 create-security-group \
  --group-name web-server-sg \
  --description "Web server security group"

# Allow only necessary ports
aws ec2 authorize-security-group-ingress \
  --group-name web-server-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Deny all other inbound by default
```

### Network Segmentation

Separate your network into zones:

```hcl
# Terraform: Create separate subnets
resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    Name = "Public Subnet"
    Tier = "DMZ"
  }
}

resource "aws_subnet" "private_app" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    Name = "Private App Subnet"
    Tier = "Application"
  }
}

resource "aws_subnet" "private_db" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    Name = "Private DB Subnet"
    Tier = "Database"
  }
}
```

### Kubernetes Network Policies

```yaml
# Deny all ingress by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress

---
# Allow specific traffic
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-to-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web
    ports:
    - protocol: TCP
      port: 8080
```

## Layer 3: Host Security

Host security hardens the operating system and server configuration.

### OS Hardening

```bash
# Disable unnecessary services
systemctl disable bluetooth
systemctl disable cups
systemctl disable avahi-daemon

# Remove unnecessary packages
apt purge telnet ftp

# Enable automatic security updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### SSH Hardening

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers deploy admin
Protocol 2
```

### Host-Based Intrusion Detection

```bash
# Install and configure AIDE
apt install aide

# Initialize database
aideinit

# Check for changes
aide --check
```

## Layer 4: Application Security

Application security protects your code and runtime environment.

### Secure Coding Practices

```python
# Bad: SQL Injection vulnerability
query = f"SELECT * FROM users WHERE id = {user_input}"

# Good: Parameterized query
cursor.execute("SELECT * FROM users WHERE id = %s", (user_input,))
```

### Container Security

```dockerfile
# Use minimal base image
FROM alpine:3.18

# Run as non-root user
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -D appuser

# Copy only necessary files
COPY --chown=appuser:appgroup ./app /app

USER appuser

# Use read-only filesystem where possible
```

### Web Application Firewall (WAF)

```yaml
# AWS WAF rule example
Rules:
  - Name: SQLInjectionRule
    Priority: 1
    Action:
      Block: {}
    Statement:
      SqliMatchStatement:
        FieldToMatch:
          Body: {}
        TextTransformations:
          - Priority: 0
            Type: URL_DECODE
```

## Layer 5: Data Security

Data security protects your most valuable asset—the data itself.

### Encryption at Rest

```bash
# Encrypt EBS volumes
aws ec2 create-volume \
  --availability-zone us-east-1a \
  --size 100 \
  --encrypted \
  --kms-key-id alias/my-key

# Encrypt S3 bucket
aws s3api put-bucket-encryption \
  --bucket my-bucket \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "alias/my-key"
      }
    }]
  }'
```

### Encryption in Transit

```yaml
# Kubernetes: Enforce TLS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: secure-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - myapp.example.com
    secretName: tls-secret
```

### Data Classification

Classify data by sensitivity:

| Classification | Examples | Controls |
|----------------|----------|----------|
| Public | Marketing materials | Basic access controls |
| Internal | Employee directory | Authentication required |
| Confidential | Financial reports | Encryption + access logs |
| Restricted | PII, credentials | Encryption + strict access + audit |

## Implementing Defense in Depth

### Step 1: Identify Your Assets

```bash
# Create an asset inventory
Asset Type       | Location        | Sensitivity | Owner
-----------------|-----------------|--------------|---------
Customer DB      | AWS RDS         | Restricted   | Data Team
Web Application  | EKS Cluster     | Confidential | Dev Team
Log Storage      | S3 Bucket       | Internal     | SRE Team
```

### Step 2: Map Attack Vectors

For each asset, identify potential attack paths:

```
Customer Database Attack Vectors:
1. SQL Injection → Application Layer
2. Stolen Credentials → Network Layer
3. Insider Threat → Host Layer
4. Physical Access → Physical Layer
```

### Step 3: Implement Controls at Each Layer

```yaml
# Security controls matrix
Customer Database:
  Physical:
    - AWS manages data center security
    - Multi-AZ deployment
  Network:
    - Private subnet only
    - Security groups: app servers only
    - No public IP
  Host:
    - Managed RDS (AWS handles patching)
    - Encryption enabled
  Application:
    - Parameterized queries
    - Input validation
    - ORM usage
  Data:
    - Encryption at rest (KMS)
    - Encryption in transit (TLS)
    - Regular backups
```

## Key Takeaways

- Defense in Depth uses multiple independent security layers
- No single control should be a single point of failure
- Each layer should be able to detect and respond to attacks
- Regularly test each layer independently and together
- Document your controls and review them periodically

## Practice Exercise

Map your current infrastructure's defense layers:

1. Draw your network architecture
2. Identify the security controls at each layer
3. Find gaps where a single control failure could lead to compromise
4. Propose additional controls to address the gaps
