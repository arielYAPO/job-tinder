# Directives

This folder contains **Standard Operating Procedures (SOPs)** that define what tasks to accomplish and how.

## Purpose

Directives are the "instruction set" for the AI agent. They describe:
- **Goals** - What the task should accomplish
- **Inputs** - What data/parameters are needed
- **Tools/Scripts** - Which execution scripts to use
- **Outputs** - What the deliverable looks like
- **Edge Cases** - Known pitfalls and how to handle them

## Format

Each directive should follow this structure:

```markdown
# [Task Name]

## Goal
What this directive accomplishes.

## Inputs
- Input 1: description
- Input 2: description

## Execution
1. Step one (use `execution/script_name.py`)
2. Step two
3. ...

## Outputs
- Where deliverables go (e.g., Google Sheet URL)
- Format of the output

## Edge Cases & Learnings
- Known API limits
- Timing expectations
- Common errors and fixes
```

## Living Documents

Directives evolve over time. When you discover:
- API constraints
- Better approaches
- Common errors
- Timing expectations

...update the relevant directive so the system gets stronger.

## Example Directives

Create files like:
- `scrape_jobs.md` - How to scrape job listings
- `apply_to_job.md` - How to automate job applications
- `update_database.md` - How to sync data with Supabase
