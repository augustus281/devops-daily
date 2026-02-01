---
title: 'DREAD Risk Assessment'
description: 'Learn to prioritize security threats using the DREAD scoring model: Damage, Reproducibility, Exploitability, Affected Users, and Discoverability.'
order: 2
---

Once you've identified threats using STRIDE, you need to prioritize them. Not all threats are equal—some require immediate attention while others can be addressed later. DREAD is a risk assessment model that helps you score and compare threats objectively.

The acronym stands for **D**amage, **R**eproducibility, **E**xploitability, **A**ffected users, and **D**iscoverability. By scoring each factor, you get a numeric risk rating that guides resource allocation.

## The Five DREAD Factors

Each factor is typically scored from 1-10 (or 0-3 for simplified scoring):

| Factor | Question | Low Score | High Score |
|--------|----------|-----------|------------|
| **Damage** | How bad is the impact? | Minor inconvenience | Complete system compromise |
| **Reproducibility** | How easy to reproduce? | Requires rare conditions | Works every time |
| **Exploitability** | How easy to exploit? | Requires expert skills | Script kiddie can do it |
| **Affected Users** | How many users impacted? | Single user | All users |
| **Discoverability** | How easy to find? | Requires source code access | Publicly documented |

## Damage Potential

Damage measures the worst-case impact if the threat is realized. Consider both technical and business impact.

### Scoring Damage (1-10 Scale)

| Score | Impact | Examples |
|-------|--------|----------|
| 1-2 | **Minimal** | UI glitch, minor performance degradation |
| 3-4 | **Low** | Single user inconvenienced, non-sensitive data exposed |
| 5-6 | **Moderate** | Multiple users affected, some sensitive data exposed |
| 7-8 | **High** | Service outage, financial data exposed, regulatory breach |
| 9-10 | **Critical** | Complete compromise, all data stolen, business destruction |

### Example: Scoring Damage

Consider an SQL injection vulnerability in different contexts:

```yaml
# Same vulnerability, different damage scores

sql_injection_read_only_analytics:
  description: "SQLi in analytics dashboard"
  data_exposed: "Aggregated, non-PII metrics"
  damage_score: 3  # Low - no sensitive data

sql_injection_user_profile:
  description: "SQLi in user profile endpoint"
  data_exposed: "Email, name, preferences"
  damage_score: 6  # Moderate - PII exposed

sql_injection_payment_system:
  description: "SQLi in payment processing"
  data_exposed: "Credit cards, bank accounts, SSN"
  damage_score: 10  # Critical - PCI/financial data
```

## Reproducibility

Reproducibility measures how reliably an attacker can trigger the vulnerability. A bug that works 100% of the time is more dangerous than one requiring specific timing.

### Scoring Reproducibility (1-10 Scale)

| Score | Reliability | Conditions |
|-------|-------------|------------|
| 1-2 | **Rare** | Requires specific race condition, hardware, or timing |
| 3-4 | **Difficult** | Needs particular configuration or user action |
| 5-6 | **Moderate** | Works under common conditions |
| 7-8 | **Easy** | Works with minimal setup |
| 9-10 | **Trivial** | 100% reliable, no special conditions |

### Example: Scoring Reproducibility

```yaml
race_condition_double_spend:
  description: "Race condition allowing double-spending"
  conditions: "Two requests must hit different servers within 10ms window"
  reproducibility_score: 3  # Difficult - requires precise timing

xss_reflected:
  description: "Reflected XSS in search parameter"
  conditions: "Victim must click malicious link"
  reproducibility_score: 7  # Easy - social engineering required but reliable

xss_stored:
  description: "Stored XSS in user comments"
  conditions: "None - payload persists and executes for all viewers"
  reproducibility_score: 10  # Trivial - works every time
```

## Exploitability

Exploitability measures the skill level, time, and resources needed to exploit the vulnerability. Consider available tools and public exploits.

### Scoring Exploitability (1-10 Scale)

| Score | Skill Required | Resources |
|-------|---------------|-----------||
| 1-2 | **Expert** | Custom exploit development, deep protocol knowledge |
| 3-4 | **Advanced** | Scripting skills, some reverse engineering |
| 5-6 | **Intermediate** | Use existing tools with modification |
| 7-8 | **Novice** | Point-and-click tools available |
| 9-10 | **None** | Automated scanners, public exploits, no skills needed |

### Example: Scoring Exploitability

```yaml
buffer_overflow_custom_protocol:
  description: "Stack buffer overflow in proprietary binary protocol"
  exploit_requirements: "Reverse engineering, ROP chain development, ASLR bypass"
  exploitability_score: 2  # Expert - months of work

deserialization_java:
  description: "Java deserialization in API endpoint"
  exploit_requirements: "ysoserial tool available"
  exploitability_score: 7  # Novice - public tools exist

default_credentials:
  description: "Admin panel with admin/admin credentials"
  exploit_requirements: "Web browser"
  exploitability_score: 10  # None - literally type 'admin'
```

## Affected Users

Affected Users measures how many people would be impacted. Consider both direct victims and indirect impact.

### Scoring Affected Users (1-10 Scale)

| Score | Scope | Description |
|-------|-------|-------------|
| 1-2 | **Individual** | Single user, single session |
| 3-4 | **Small group** | Specific role, department, or region |
| 5-6 | **Significant** | Large user segment, multiple roles |
| 7-8 | **Most users** | Majority of user base |
| 9-10 | **Everyone** | All users, partners, and downstream systems |

### Example: Scoring Affected Users

```yaml
account_takeover_targeted:
  description: "Session hijacking via XSS"
  affected: "Individual victims who click malicious links"
  affected_users_score: 3  # Small - one at a time

data_breach_user_table:
  description: "Database dump of user credentials"
  affected: "All registered users (500,000)"
  affected_users_score: 9  # Everyone - all users

supply_chain_attack:
  description: "Compromised npm package"
  affected: "All applications depending on package + their users"
  affected_users_score: 10  # Everyone + downstream
```

## Discoverability

Discoverability measures how easy it is for an attacker to find the vulnerability. Consider what information is publicly available.

### Scoring Discoverability (1-10 Scale)

| Score | Visibility | Information Needed |
|-------|------------|--------------------|
| 1-2 | **Hidden** | Requires source code access, insider knowledge |
| 3-4 | **Obscure** | Deep application knowledge, unusual paths |
| 5-6 | **Discoverable** | Automated scanners might find it |
| 7-8 | **Obvious** | Basic fuzzing or manual testing reveals it |
| 9-10 | **Public** | Documented in CVE, Shodan, or exploit databases |

### Example: Scoring Discoverability

```yaml
logic_flaw_payment:
  description: "Business logic flaw in discount calculation"
  discovery_method: "Requires understanding of pricing rules"
  discoverability_score: 3  # Obscure - not found by scanners

sql_injection_login:
  description: "SQLi in login form"
  discovery_method: "Standard automated scanner will find it"
  discoverability_score: 8  # Obvious - scanners detect

known_cve_unpatched:
  description: "CVE-2023-XXXX in Apache Struts"
  discovery_method: "Shodan search, public exploit available"
  discoverability_score: 10  # Public - actively scanned for
```

## Calculating DREAD Scores

The simplest approach is to average the five factors:

```python
def calculate_dread_score(damage, reproducibility, exploitability, 
                          affected_users, discoverability):
    """
    Calculate DREAD risk score.
    Each factor should be scored 1-10.
    Returns average score and risk level.
    """
    total = damage + reproducibility + exploitability + affected_users + discoverability
    average = total / 5
    
    if average >= 8:
        risk_level = "CRITICAL"
    elif average >= 6:
        risk_level = "HIGH"
    elif average >= 4:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    return {
        'score': round(average, 1),
        'risk_level': risk_level,
        'breakdown': {
            'damage': damage,
            'reproducibility': reproducibility,
            'exploitability': exploitability,
            'affected_users': affected_users,
            'discoverability': discoverability
        }
    }

# Example usage
sql_injection_payment = calculate_dread_score(
    damage=10,           # Credit card data exposed
    reproducibility=9,   # Works every time
    exploitability=8,    # sqlmap can exploit automatically
    affected_users=9,    # All customers
    discoverability=7    # Scanner will find it
)

print(sql_injection_payment)
# {'score': 8.6, 'risk_level': 'CRITICAL', 'breakdown': {...}}
```

## Weighted DREAD Scoring

Some organizations weight factors differently based on their priorities:

```python
def calculate_weighted_dread(damage, reproducibility, exploitability,
                             affected_users, discoverability, weights=None):
    """
    Calculate weighted DREAD score.
    Weights adjust importance of each factor.
    """
    default_weights = {
        'damage': 1.5,          # Prioritize impact
        'reproducibility': 1.0,
        'exploitability': 1.2,  # Prioritize ease of attack
        'affected_users': 1.0,
        'discoverability': 0.8  # Deprioritize (assume attacker finds it)
    }
    weights = weights or default_weights
    
    weighted_sum = (
        damage * weights['damage'] +
        reproducibility * weights['reproducibility'] +
        exploitability * weights['exploitability'] +
        affected_users * weights['affected_users'] +
        discoverability * weights['discoverability']
    )
    
    total_weight = sum(weights.values())
    weighted_average = weighted_sum / total_weight
    
    return round(weighted_average, 1)
```

## DREAD in Practice: Complete Example

Let's score multiple threats and prioritize them:

```python
# Threat modeling results for e-commerce application
threats = [
    {
        'name': 'SQL Injection in Product Search',
        'stride_category': 'Tampering/Information Disclosure',
        'dread': {
            'damage': 7,           # Product data exposure
            'reproducibility': 9,  # Reliable
            'exploitability': 8,   # Automated tools
            'affected_users': 8,   # All users see products
            'discoverability': 8   # Scanner finds it
        }
    },
    {
        'name': 'CSRF on Password Change',
        'stride_category': 'Spoofing',
        'dread': {
            'damage': 6,           # Account compromise
            'reproducibility': 7,  # Needs user to click link
            'exploitability': 5,   # Some skill needed
            'affected_users': 3,   # Individual targets
            'discoverability': 6   # Manual testing reveals
        }
    },
    {
        'name': 'Exposed Admin Panel',
        'stride_category': 'Information Disclosure',
        'dread': {
            'damage': 9,           # Full admin access
            'reproducibility': 10, # Always accessible
            'exploitability': 6,   # Still needs credentials
            'affected_users': 10,  # Everyone
            'discoverability': 9   # Shodan/directory scan
        }
    },
    {
        'name': 'Missing Rate Limiting on Login',
        'stride_category': 'Elevation of Privilege',
        'dread': {
            'damage': 5,           # Account access
            'reproducibility': 10, # Automated brute force
            'exploitability': 9,   # Script available
            'affected_users': 4,   # Weak password users
            'discoverability': 8   # Easy to detect
        }
    }
]

# Calculate and sort by risk
for threat in threats:
    d = threat['dread']
    threat['risk_score'] = sum(d.values()) / 5

sorted_threats = sorted(threats, key=lambda x: x['risk_score'], reverse=True)

print("Prioritized Threat List:")
print("-" * 60)
for i, threat in enumerate(sorted_threats, 1):
    print(f"{i}. {threat['name']}")
    print(f"   DREAD Score: {threat['risk_score']:.1f}")
    print(f"   Category: {threat['stride_category']}")
    print()
```

Output:
```
Prioritized Threat List:
------------------------------------------------------------
1. Exposed Admin Panel
   DREAD Score: 8.8
   Category: Information Disclosure

2. SQL Injection in Product Search
   DREAD Score: 8.0
   Category: Tampering/Information Disclosure

3. Missing Rate Limiting on Login
   DREAD Score: 7.2
   Category: Elevation of Privilege

4. CSRF on Password Change
   DREAD Score: 5.4
   Category: Spoofing
```

## Limitations of DREAD

While useful, DREAD has known limitations:

### Subjectivity

Different analysts may score the same threat differently. Mitigate this by:

- Using scoring guidelines with examples
- Having multiple people score independently
- Discussing and averaging scores in threat modeling sessions

### Discoverability Controversy

Some argue Discoverability shouldn't be included because:

- Security through obscurity is unreliable
- You should assume attackers will find vulnerabilities
- It incentivizes hiding bugs rather than fixing them

Microsoft deprecated DREAD partially for this reason. Consider using a modified version:

```python
def calculate_dread_no_discoverability(damage, reproducibility, 
                                        exploitability, affected_users):
    """DREAD without discoverability factor."""
    return (damage + reproducibility + exploitability + affected_users) / 4
```

### Complementary Frameworks

Consider using DREAD alongside other frameworks:

- **CVSS**: Industry standard for vulnerability scoring
- **OWASP Risk Rating**: More detailed business impact assessment
- **FAIR**: Quantitative risk analysis with financial estimates

## Summary

DREAD provides a structured approach to prioritize threats:

- **Damage**: How bad is the worst-case scenario?
- **Reproducibility**: How reliably can it be exploited?
- **Exploitability**: How much skill is needed?
- **Affected Users**: How many people are impacted?
- **Discoverability**: How easy is it to find?

Use DREAD scores to:

1. Prioritize which threats to fix first
2. Communicate risk to stakeholders
3. Track risk reduction over time
4. Allocate security resources effectively

In the next section, we'll learn attack tree methodology—a visual approach to understanding how threats can be realized through multiple paths.
