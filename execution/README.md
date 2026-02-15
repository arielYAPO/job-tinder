# Execution Scripts

This folder contains **deterministic Python scripts** that handle the actual work.

## Purpose

Execution scripts are the "muscle" of the system. They:
- Make API calls
- Process data
- Handle file operations
- Interact with databases (Supabase)
- Perform browser automation

## Principles

1. **Deterministic** - Same input = same output
2. **Testable** - Can be run independently
3. **Well-commented** - Clear documentation
4. **Single responsibility** - One script, one job

## Naming Convention

Use descriptive snake_case names:
- `scrape_single_site.py` - Scrapes one website
- `upload_to_supabase.py` - Uploads data to database
- `send_application.py` - Submits a job application
- `generate_cover_letter.py` - Creates personalized cover letters

## Environment Variables

Scripts should read sensitive data from `.env`:

```python
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
```

## Error Handling

Scripts should:
- Return clear error messages
- Log issues to help with debugging
- Fail gracefully when possible

## Integration with Directives

Each script should be referenced in a directive that explains:
- When to use it
- What inputs it expects
- What outputs it produces
