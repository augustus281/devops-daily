---
title: 'STRIDE Threat Classification'
description: 'Learn the STRIDE methodology for systematically categorizing security threats: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.'
order: 1
---

STRIDE is a threat classification framework developed at Microsoft in the late 1990s. It provides a systematic way to think about different types of security threats, ensuring you don't overlook common attack vectors during security analysis.

The acronym stands for six threat categories: **S**poofing, **T**ampering, **R**epudiation, **I**nformation Disclosure, **D**enial of Service, and **E**levation of Privilege. Each category maps to a security property you want to protect.

## The Six Threat Categories

| Threat | Security Property | Description |
|--------|------------------|-------------|
| **S**poofing | Authentication | Pretending to be someone or something else |
| **T**ampering | Integrity | Modifying data or code without authorization |
| **R**epudiation | Non-repudiation | Denying an action occurred |
| **I**nformation Disclosure | Confidentiality | Exposing information to unauthorized parties |
| **D**enial of Service | Availability | Making a system unavailable |
| **E**levation of Privilege | Authorization | Gaining capabilities beyond what's allowed |

## Spoofing

Spoofing threats involve an attacker pretending to be someone or something they're not. This violates the **authentication** property of your system.

### Common Spoofing Attacks

- **Identity spoofing**: Using stolen credentials to impersonate a legitimate user
- **IP spoofing**: Forging source IP addresses in network packets
- **Email spoofing**: Sending emails with forged sender addresses
- **DNS spoofing**: Redirecting domain lookups to malicious servers
- **ARP spoofing**: Poisoning ARP tables to intercept network traffic

### Real-World Example: Session Hijacking

Consider a web application that stores session tokens in cookies:

```python
# Vulnerable: Session token without proper validation
@app.route('/dashboard')
def dashboard():
    session_token = request.cookies.get('session_id')
    # No validation of token origin or integrity
    user = get_user_from_session(session_token)
    return render_template('dashboard.html', user=user)
```

An attacker who captures a session token (via XSS, network sniffing, or malware) can impersonate the victim by sending requests with the stolen token.

### Mitigations for Spoofing

```python
# Better: Bind sessions to additional factors
@app.route('/dashboard')
def dashboard():
    session_token = request.cookies.get('session_id')
    session_data = validate_session(session_token)
    
    # Verify session is bound to this client
    if session_data['ip'] != request.remote_addr:
        log_security_event('Session IP mismatch', session_data)
        abort(403)
    
    if session_data['user_agent'] != request.headers.get('User-Agent'):
        log_security_event('Session UA mismatch', session_data)
        abort(403)
    
    return render_template('dashboard.html', user=session_data['user'])
```

**Key mitigations:**
- Multi-factor authentication (MFA)
- Certificate-based authentication
- Session binding to IP/user-agent
- Short session lifetimes with refresh tokens

## Tampering

Tampering threats involve unauthorized modification of data or code. This violates the **integrity** property.

### Common Tampering Attacks

- **Man-in-the-middle (MITM)**: Intercepting and modifying data in transit
- **Parameter tampering**: Modifying hidden form fields or URL parameters
- **SQL injection**: Altering database queries
- **File tampering**: Modifying configuration files or binaries
- **Memory tampering**: Altering program state at runtime

### Real-World Example: Price Manipulation

E-commerce applications often pass price data through hidden form fields:

```html
<!-- Vulnerable: Price in hidden field -->
<form action="/checkout" method="POST">
    <input type="hidden" name="price" value="99.99">
    <input type="hidden" name="product_id" value="12345">
    <button type="submit">Buy Now</button>
</form>
```

An attacker can modify the hidden field using browser developer tools:

```javascript
// Attacker modifies price before submission
document.querySelector('input[name="price"]').value = '0.01';
```

### Mitigations for Tampering

```python
# Better: Server-side price lookup
@app.route('/checkout', methods=['POST'])
def checkout():
    product_id = request.form.get('product_id')
    
    # Never trust client-provided prices
    product = Product.query.get(product_id)
    if not product:
        abort(404)
    
    # Use server-side price
    price = product.current_price
    
    # Optional: Verify with digital signature
    expected_signature = hmac.new(
        SECRET_KEY, 
        f"{product_id}:{price}".encode(),
        hashlib.sha256
    ).hexdigest()
    
    return process_order(product_id, price)
```

**Key mitigations:**
- Input validation on all user data
- Digital signatures/HMAC for sensitive data
- TLS for data in transit
- File integrity monitoring (AIDE, Tripwire)
- Code signing and verification

## Repudiation

Repudiation threats involve users denying they performed an action when there's no way to prove otherwise. This violates the **non-repudiation** property.

### Common Repudiation Scenarios

- User claims they didn't make a purchase
- Admin denies deleting critical files
- Attacker covers tracks by deleting logs
- Developer claims they didn't push malicious code

### Real-World Example: Missing Audit Trail

```python
# Vulnerable: No audit logging
@app.route('/admin/delete-user/<user_id>', methods=['POST'])
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    db.session.delete(user)
    db.session.commit()
    return redirect('/admin/users')
```

Without logging, there's no way to determine who deleted a user or when it happened.

### Mitigations for Repudiation

```python
# Better: Comprehensive audit logging
@app.route('/admin/delete-user/<user_id>', methods=['POST'])
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    
    # Log before the action
    audit_log.info(
        'User deletion initiated',
        extra={
            'action': 'DELETE_USER',
            'target_user_id': user_id,
            'target_username': user.username,
            'admin_id': current_user.id,
            'admin_ip': request.remote_addr,
            'timestamp': datetime.utcnow().isoformat(),
            'request_id': request.headers.get('X-Request-ID')
        }
    )
    
    # Soft delete preserves evidence
    user.deleted_at = datetime.utcnow()
    user.deleted_by = current_user.id
    db.session.commit()
    
    return redirect('/admin/users')
```

**Key mitigations:**
- Comprehensive audit logging
- Tamper-evident log storage (append-only, signed)
- Digital signatures for critical transactions
- Centralized log aggregation
- Regular log review and alerting

## Information Disclosure

Information disclosure threats involve exposing sensitive data to unauthorized parties. This violates the **confidentiality** property.

### Common Information Disclosure Vectors

- **Error messages**: Stack traces revealing internal paths
- **API responses**: Over-fetching sensitive fields
- **Logs**: Accidentally logging passwords or tokens
- **Metadata**: EXIF data in images, Git history
- **Timing attacks**: Inferring data from response times

### Real-World Example: Verbose Errors

```python
# Vulnerable: Detailed error messages in production
@app.route('/login', methods=['POST'])
def login():
    try:
        user = User.query.filter_by(email=request.form['email']).first()
        if not user:
            raise Exception(f"User {request.form['email']} not found in database")
        if not check_password(request.form['password'], user.password_hash):
            raise Exception(f"Invalid password for user {user.id}")
        return login_user(user)
    except Exception as e:
        # Leaks whether email exists and internal user IDs
        return str(e), 401
```

### Mitigations for Information Disclosure

```python
# Better: Generic error messages
@app.route('/login', methods=['POST'])
def login():
    user = User.query.filter_by(email=request.form['email']).first()
    
    # Use constant-time comparison to prevent timing attacks
    if not user or not user.check_password(request.form['password']):
        # Log details server-side, return generic message to client
        app.logger.warning(
            'Failed login attempt',
            extra={'email': request.form['email'], 'ip': request.remote_addr}
        )
        # Same message whether user exists or password is wrong
        return {'error': 'Invalid credentials'}, 401
    
    return login_user(user)
```

**Key mitigations:**
- Generic error messages in production
- Principle of least privilege for data access
- Encryption for sensitive data at rest and in transit
- Data masking in logs
- Regular secrets scanning in code/configs

## Denial of Service

Denial of Service (DoS) threats make a system unavailable to legitimate users. This violates the **availability** property.

### Common DoS Attack Vectors

- **Volume-based**: Flooding with traffic (UDP floods, amplification)
- **Protocol-based**: Exploiting protocol weaknesses (SYN floods)
- **Application-layer**: Expensive operations (regex DoS, zip bombs)
- **Resource exhaustion**: Memory, disk, file descriptors
- **Algorithmic complexity**: O(n²) operations with large inputs

### Real-World Example: ReDoS (Regular Expression DoS)

```python
# Vulnerable: Catastrophic backtracking regex
import re

# This regex has exponential time complexity with certain inputs
email_pattern = re.compile(r'^([a-zA-Z0-9]+)+@example.com$')

@app.route('/validate-email')
def validate_email():
    email = request.args.get('email')
    # Malicious input: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa!'
    # This can hang the server for minutes
    if email_pattern.match(email):
        return 'Valid'
    return 'Invalid'
```

### Mitigations for Denial of Service

```python
# Better: Safe regex with timeout
import re
import signal
from functools import wraps

# Use non-backtracking pattern
email_pattern = re.compile(r'^[a-zA-Z0-9]+@example\.com$')

def timeout(seconds):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            signal.alarm(seconds)
            try:
                return func(*args, **kwargs)
            finally:
                signal.alarm(0)
        return wrapper
    return decorator

@app.route('/validate-email')
@timeout(1)  # Kill if takes more than 1 second
def validate_email():
    email = request.args.get('email', '')[:255]  # Limit input length
    if email_pattern.match(email):
        return 'Valid'
    return 'Invalid'
```

**Key mitigations:**
- Rate limiting and throttling
- Input size limits
- Timeout for expensive operations
- Auto-scaling infrastructure
- CDN and DDoS protection services
- Circuit breakers for downstream services

## Elevation of Privilege

Elevation of Privilege (EoP) threats involve gaining capabilities beyond what's authorized. This violates the **authorization** property.

### Common EoP Attacks

- **Privilege escalation**: Normal user gains admin rights
- **IDOR**: Accessing other users' resources by changing IDs
- **Path traversal**: Escaping intended directories
- **Container escape**: Breaking out of container isolation
- **JWT manipulation**: Forging tokens with elevated claims

### Real-World Example: Insecure Direct Object Reference (IDOR)

```python
# Vulnerable: No ownership verification
@app.route('/api/documents/<doc_id>')
@login_required
def get_document(doc_id):
    # User can access ANY document by changing the ID
    document = Document.query.get(doc_id)
    if not document:
        abort(404)
    return document.to_dict()
```

An attacker can enumerate document IDs to access other users' files:

```bash
# Attacker iterates through document IDs
for i in {1..10000}; do
    curl "https://api.example.com/documents/$i" -H "Cookie: session=attacker_session"
done
```

### Mitigations for Elevation of Privilege

```python
# Better: Verify ownership
@app.route('/api/documents/<doc_id>')
@login_required
def get_document(doc_id):
    document = Document.query.get(doc_id)
    
    if not document:
        abort(404)
    
    # Verify the current user owns this document
    if document.owner_id != current_user.id:
        # Log potential attack
        app.logger.warning(
            'IDOR attempt detected',
            extra={
                'user_id': current_user.id,
                'requested_doc_id': doc_id,
                'doc_owner_id': document.owner_id
            }
        )
        abort(403)
    
    return document.to_dict()

# Even better: Use UUIDs instead of sequential IDs
# and scope queries to the current user
@app.route('/api/documents/<uuid:doc_id>')
@login_required
def get_document_v2(doc_id):
    document = Document.query.filter_by(
        id=doc_id,
        owner_id=current_user.id
    ).first_or_404()
    return document.to_dict()
```

**Key mitigations:**
- Always verify authorization, not just authentication
- Scope database queries to current user
- Use UUIDs instead of sequential IDs
- Implement role-based access control (RBAC)
- Regular privilege audits
- Container and VM hardening

## Applying STRIDE in Practice

When analyzing a system, walk through each component and ask:

1. **Spoofing**: Can an attacker pretend to be this component or user?
2. **Tampering**: Can data flowing through here be modified?
3. **Repudiation**: Can actions here be denied without evidence?
4. **Information Disclosure**: Can sensitive data leak from here?
5. **Denial of Service**: Can this component be overwhelmed?
6. **Elevation of Privilege**: Can access controls be bypassed here?

### STRIDE per Element

Different system elements are vulnerable to different STRIDE categories:

| Element | S | T | R | I | D | E |
|---------|---|---|---|---|---|---|
| External Entity | ✓ | | ✓ | | | |
| Process | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Data Store | | ✓ | ? | ✓ | ✓ | |
| Data Flow | | ✓ | | ✓ | ✓ | |

This matrix helps you focus your analysis—processes are vulnerable to all six categories, while data flows are primarily concerned with tampering, disclosure, and availability.

## Summary

STRIDE provides a comprehensive framework for identifying threats:

- **Spoofing** → Strengthen authentication
- **Tampering** → Protect integrity
- **Repudiation** → Implement audit logging
- **Information Disclosure** → Ensure confidentiality
- **Denial of Service** → Maintain availability
- **Elevation of Privilege** → Enforce authorization

In the next section, we'll learn how to prioritize these threats using the DREAD scoring system.
