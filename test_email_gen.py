
from browser_use.serper_contact_finder import generate_email

def test_emails():
    cases = [
        ("Antoine Sauvage", "ovrsea.com"),
        ("Jérôme Côté", "ovrsea.com"),
        ("Arthur Barillas de Fleury", "ovrsea.com"),
        ("Zendaya", "ovrsea.com"),
    ]
    
    print("--- Test Email Generation ---")
    for name, domain in cases:
        email = generate_email(name, domain)
        print(f"Name: {name:<25} -> Email: {email}")

if __name__ == "__main__":
    test_emails()
