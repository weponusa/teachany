# 📋 TeachAny Blank Template | 空白课件模板

Use this template to create a new TeachAny courseware from scratch.

## Structure

The template includes:

- ✅ **TeachAny Design System** — Dark theme CSS variables, card styles, glassmorphism
- ✅ **Navigation bar** — Fixed top nav with anchor links
- ✅ **Hero section** — Title, subtitle, metadata tags
- ✅ **Learning Objectives** — 3-column grid layout
- ✅ **Pre-test** — With quiz engine and error diagnosis
- ✅ **Module structure** — ABT intro → Core explanation → Deep understanding → Practice
- ✅ **Three-level exercises** — Foundation → Application → Transfer
- ✅ **Post-test** — Learning loop closure
- ✅ **Quiz Engine JS** — Handles answer checking, error-specific feedback, visual states

## Quick Start

```bash
# Copy the template
cp -r _template my-new-course

# Edit the HTML
# Replace all 【placeholder text】 with your content

# Open in browser
open my-new-course/index.html
```

## Customization Checklist

1. [ ] Replace `【课题名称】` with your lesson title
2. [ ] Set subject, grade, and duration in meta tags
3. [ ] Write the ABT introduction (And-But-Therefore)
4. [ ] Add core explanation content (~75 words per card)
5. [ ] Choose Five-Lens approaches for deep understanding
6. [ ] Create exercises with error-specific feedback
7. [ ] Design pre-test and post-test questions
8. [ ] Add Canvas/SVG interactions if needed

## Design Tokens

All colors and spacing are controlled via CSS custom properties in `:root`. See [Design System](../../docs/design-system.md) for the full specification.
