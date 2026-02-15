import dns.resolver
import smtplib
import socket
import sys
from typing import List, Optional

def get_mx_record(domain: str) -> Optional[str]:
    """Resolve MX record for a domain."""
    try:
        records = dns.resolver.resolve(domain, 'MX')
        mx_record = str(records[0].exchange)
        return mx_record
    except Exception as e:
        print(f"[-] MX lookup failed for {domain}: {e}")
        return None

def verify_email(email: str, mx_host: str) -> str:
    """
    Verify email via SMTP RCPT TO.
    Returns: 'VALID', 'INVALID', 'UNKNOWN', 'CATCH_ALL'
    """
    try:
        # Create SMTP connection
        server = smtplib.SMTP(timeout=5)
        server.set_debuglevel(0)
        
        # Connect to MX
        server.connect(mx_host)
        server.helo('jobtinder.com') # Identify ourselves
        
        # Mail flow
        server.mail('verify@jobtinder.com')
        code, message = server.rcpt(email)
        
        server.quit()
        
        if code == 250:
            return 'VALID'
        elif code == 550:
            return 'INVALID'
        else:
            return 'UNKNOWN'
            
    except Exception as e:
        # print(f"[-] SMTP check failed: {e}")
        return 'UNKNOWN'

def is_catch_all(domain: str, mx_host: str) -> bool:
    """Check if domain is catch-all by testing a random address."""
    random_email = f"jalksdjflkasjdflkjasdlkfja@{domain}"
    status = verify_email(random_email, mx_host)
    return status == 'VALID'

def generate_permutations(first: str, last: str, domain: str) -> List[str]:
    """Generate common email formats."""
    f = first.lower()
    l = last.lower()
    
    perms = [
        f"{f}.{l}@{domain}",      # john.doe@
        f"{f}{l}@{domain}",       # johndoe@
        f"{f}@{domain}",          # john@
        f"{f[0]}{l}@{domain}",    # jdoe@
        f"{f[0]}.{l}@{domain}",   # j.doe@
        f"{l}@{domain}",          # doe@
    ]
    return perms

def find_email(first_name: str, last_name: str, domain: str):
    print(f"[*] Searching email for: {first_name} {last_name} @ {domain}")
    
    # 1. Get MX
    mx_host = get_mx_record(domain)
    if not mx_host:
        print("[-] Could not find mail server.")
        return None

    # 2. Check Catch-All
    print("[*] Checking for Catch-All...")
    if is_catch_all(domain, mx_host):
        print("[!] Domain is Catch-All. Cannot verify exact email.")
        # Return most likely format (firstname.lastname) as a guess?
        # Or return None strictly.
        # User wants "Devinette", so maybe return the most common format labeled as "Unverified"
        return f"{first_name.lower()}.{last_name.lower()}@{domain} (Catch-All - Unverified)"

    # 3. Test Permutations
    print("[*] Testing permutations...")
    permutations = generate_permutations(first_name, last_name, domain)
    
    for email in permutations:
        sys.stdout.write(f"    Testing {email}... ")
        status = verify_email(email, mx_host)
        print(status)
        
        if status == 'VALID':
            print(f"[+] FOUND: {email}")
            return email
            
    print("[-] No valid email found.")
    return None

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python find_email.py <first> <last> <domain>")
        # Default test
        # find_email("Xavier", "Niel", "stationf.co") 
    else:
        find_email(sys.argv[1], sys.argv[2], sys.argv[3])
