# CV Template Implementation Guide

## Overview
This guide defines how to create professional, ATS-optimized CV/Resume PDFs for the JobTinder application.

---

## Page Specifications

| Property | Value |
|----------|-------|
| Size | A4 |
| Orientation | Portrait |
| Margins | 16mm all sides (~45pt) |
| Max Content Width | 740px |

---

## Typography

### Font Stack
```
Primary: Inter, Source Sans 3, Helvetica, Arial, sans-serif
```

### Scale
| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Name | 18pt | 700 (Bold) | Slight negative tracking |
| Title/Role | 11.5pt | 600 (Semibold) | - |
| Section Heading | 10.5pt | 700 | UPPERCASE, 0.06em tracking |
| Body | 10pt | 400 | - |
| Meta | 9pt | 400 | Dates, locations |
| Caption | 8.5pt | 400 | Keywords, minor text |

### Line Heights
- Tight: 1.15
- Normal: 1.35
- Relaxed: 1.5

---

## Colors

| Role | Usage |
|------|-------|
| textPrimary | Near-black (#1a1a1a) |
| textSecondary | Cool Gray 700 (#374151) |
| muted | Cool Gray 500 (#6b7280) |
| accent | Deep blue (#2563eb) - ONE accent only |
| divider | Cool Gray 200 (#e5e7eb) |
| panelBg | Cool Gray 50 (#f9fafb) |

### Rules
- ❌ No neon colors
- ❌ No heavy gradients
- ✅ One accent color maximum
- ✅ Subtle, professional palette

---

## Template 1: Classic Single Column (ATS-First)

### Best For
- Corporate applications (France, EU)
- Large companies with ATS
- Engineering, Tech, Business roles

### Section Order
1. Header (Name, Contact)
2. Professional Summary
3. Key Skills (2-column text)
4. Professional Experience
5. Projects (optional)
6. Education
7. Certifications (optional)
8. Languages (optional)

### Layout Rules
- Single column only
- Section spacing: 16px
- Subsection spacing: 8px
- Thin line dividers below headings

### Experience Format
```
Job Title | Company                    Date Range
Location (optional)
• Bullet point 1 (action + scope + result)
• Bullet point 2
• Bullet point 3
```

### ATS Constraints
**AVOID:**
- Tables
- Two-column layouts
- Images/icons in text areas
- Progress bars
- Complex graphics

**USE:**
- Simple bullet points
- Bold headings
- Clean divider lines
- Standard section names

---

## Template 2: Modern Two-Column (Human-First)

### Best For
- Startups
- Design-aware teams
- When human reads first (not ATS)

### Layout
```
┌──────────────────────────────────────────┐
│  LEFT (32%)        │  RIGHT (68%)        │
│  ───────────       │  ───────────        │
│  [Photo]           │  SUMMARY            │
│  Contact           │                     │
│  Skills            │  EXPERIENCE         │
│  Languages         │  • bullets          │
│  Interests         │                     │
│                    │  EDUCATION          │
└──────────────────────────────────────────┘
```

### Left Column
- Light gray background panel
- Skills as pill badges
- Stacked contact info with icons

### Right Column
- Professional summary
- Experience with emphasis on impact
- Projects with tech stack line
- Education

---

## Content Rules

### Bullet Points
- Short impact statements
- Max 2 lines per bullet
- Past tense for previous roles
- Present tense for current role
- Lead with numbers/metrics when possible

### Pattern for Experience Bullets
```
[Action Verb] + [Scope/Task] + [Tool/Skill] + [Measurable Result]

Example: "Reduced page load time by 45% using React optimization techniques"
```

### Quality Checks
- No missing dates
- No paragraphs > 5 lines
- At least 1 measurable outcome per role
- 1 page for <5 years experience
- 1-2 pages for 5+ years

---

## @react-pdf/renderer Implementation Notes

### Converting Points to PDF Units
- react-pdf uses points (pt) directly
- 1pt = 1/72 inch
- For mm: multiply by 2.83465

### Key StyleSheet Properties
```javascript
StyleSheet.create({
  page: {
    padding: 45, // ~16mm
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  }
});
```

### Font Limitations
- react-pdf has limited font support
- Use 'Helvetica' (built-in) or register custom fonts
- Available weights: 'normal', 'bold'

---

## Reference Files
- `CV_TEMPLATE_GUIDE.json` - Full specification
- Sample PDFs in `/template` folder

---

## Summary

When implementing CV templates:
1. Follow typography scale strictly
2. Use only 1 accent color
3. Keep it ATS-friendly (single column preferred)
4. Prioritize readability over decoration
5. Test with real data for proper spacing
