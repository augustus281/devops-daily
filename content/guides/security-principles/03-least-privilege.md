---
title: 'Principle of Least Privilege'
description: 'Learn how to implement minimal access controls to reduce your attack surface and limit potential damage.'
order: 3
---

The Principle of Least Privilege (PoLP) states that every user, process, or system should have only the minimum permissions necessary to perform their function. This simple concept is one of the most powerful security controls you can implement.

## Why Least Privilege Matters

When permissions are overly broad:

- **Larger attack surface**: More paths for attackers to exploit
- **Greater blast radius**: Compromised accounts can do more damage
- **Harder to audit**: Too many permissions to track effectively
- **Compliance issues**: Violates regulatory requirements

## Implementing Least Privilege

### IAM Policies: Start with Deny

Always start with no permissions and add only what's needed:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ReadSpecificBucket",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-app-assets",
        "arn:aws:s3:::my-app-assets/*"
      ]
    }
  ]
}
```

**Bad practice** - overly permissive:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "*"
    }
  ]
}
```

### Kubernetes RBAC

Create specific roles for each workload:

```yaml
# Role with minimal permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]

---
# Bind role to specific service account
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: production
subjects:
- kind: ServiceAccount
  name: monitoring-sa
  namespace: production
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

### Database Permissions

Create application-specific database users:

```sql
-- Create a read-only user for reporting
CREATE USER reporting_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE myapp TO reporting_user;
GRANT USAGE ON SCHEMA public TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_user;

-- Create an app user with limited write access
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE myapp TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON users, orders, products TO app_user;
-- Note: No DELETE, no access to admin tables
```

### Linux File Permissions

Apply minimal file permissions:

```bash
# Application files - read/execute only
chmod 555 /opt/myapp/bin/*

# Configuration files - read only by app user
chmod 400 /opt/myapp/config/secrets.yml
chown appuser:appgroup /opt/myapp/config/secrets.yml

# Log directory - write only where needed
chmod 755 /var/log/myapp
chmod 644 /var/log/myapp/*.log
```

### Container Security Context

Run containers with minimal privileges:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
  containers:
  - name: app
    image: myapp:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
    volumeMounts:
    - name: tmp
      mountPath: /tmp
    - name: cache
      mountPath: /app/cache
  volumes:
  - name: tmp
    emptyDir: {}
  - name: cache
    emptyDir: {}
```

## Just-In-Time (JIT) Access

Instead of permanent permissions, grant temporary access when needed:

```bash
# Example: Temporary AWS credentials
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/AdminRole \
  --role-session-name "emergency-access" \
  --duration-seconds 3600

# Access expires after 1 hour
```

### Implementing JIT with Teleport

```yaml
# Teleport role with access requests
kind: role
version: v5
metadata:
  name: developer
spec:
  allow:
    logins: ["{{internal.logins}}"]
    node_labels:
      env: ["dev", "staging"]
    request:
      roles: ["production-access"]
      thresholds:
        - approve: 1
          deny: 1
```

## Service Accounts and Workload Identity

Each application should have its own identity:

```yaml
# Kubernetes: Dedicated service account per app
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-service
  namespace: production
  annotations:
    # AWS IAM role for service account
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/PaymentServiceRole

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  template:
    spec:
      serviceAccountName: payment-service
      automountServiceAccountToken: true
      containers:
      - name: payment
        image: payment-service:latest
```

## Auditing Permissions

Regularly review and revoke unnecessary permissions:

```bash
# AWS: Find unused IAM credentials
aws iam generate-credential-report
aws iam get-credential-report --output text --query Content | base64 -d

# AWS: Analyze IAM policies
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:user/developer \
  --action-names s3:DeleteBucket
```

### Kubernetes RBAC Audit

```bash
# List all cluster role bindings
kubectl get clusterrolebindings -o wide

# Find overly permissive bindings
kubectl get clusterrolebindings -o json | jq '
  .items[] | 
  select(.roleRef.name == "cluster-admin") | 
  {name: .metadata.name, subjects: .subjects}
'

# Check what a service account can do
kubectl auth can-i --list --as=system:serviceaccount:default:my-sa
```

## Common Least Privilege Mistakes

### Mistake 1: Shared Service Accounts

```yaml
# Bad: Multiple apps sharing one service account
serviceAccountName: shared-sa

# Good: Dedicated service account per app
serviceAccountName: order-service-sa
```

### Mistake 2: Wildcard Permissions

```json
// Bad: Wildcard actions
"Action": "ec2:*"

// Good: Specific actions
"Action": [
  "ec2:DescribeInstances",
  "ec2:StartInstances",
  "ec2:StopInstances"
]
```

### Mistake 3: Not Scoping Resources

```json
// Bad: All resources
"Resource": "*"

// Good: Specific resources
"Resource": [
  "arn:aws:s3:::my-bucket",
  "arn:aws:s3:::my-bucket/*"
]
```

### Mistake 4: Permanent Admin Access

```bash
# Bad: Developer has permanent admin
aws iam attach-user-policy \
  --user-name developer \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Good: Require role assumption with MFA
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/AdminRole \
  --serial-number arn:aws:iam::123456789012:mfa/developer \
  --token-code 123456
```

## Key Takeaways

- Start with zero permissions and add only what's needed
- Create dedicated identities for each application/service
- Use temporary credentials instead of permanent access
- Regularly audit and revoke unused permissions
- Scope permissions to specific resources, not wildcards
- Implement separation of duties for sensitive operations

## Practice Exercise

Review permissions in your environment:

1. List all IAM users/roles with admin-level access
2. Identify service accounts shared between applications
3. Find policies using wildcard (*) permissions
4. Create a plan to reduce permissions without breaking functionality
