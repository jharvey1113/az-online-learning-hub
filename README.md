# AZ Online Learning Hub (demo)

A clickable demo of an online-school staff hub built on the Edgenuity
**Manage Enrollments** report. **Every student, parent, teacher, phone number
and email address is fictional.** Emails use the reserved `.example` domain and
phone numbers use the 555-01xx fictional range, so nothing can reach a real
person. Nothing is ever sent: email and call buttons open simulated previews.

**Live demo:** https://jharvey1113.github.io/az-online-learning-hub/

## What it shows

- **Tier dashboard.** Each course is scored from the Edgenuity report (grade, progress vs. target, days since login) into Tiers 1–4; a student's tier is their worst course. Click any tier or grade cell for the roster.
- **Group email by tier.** From the Tier Roster, *Email group* builds review-first BCC drafts to students and parents, split to stay under Gmail's recipient limit.
- **Send Tiered Emails.** The biweekly run sends one personalized email per student (parents cc'd), PDFs per grade and a digest to each grade's teachers. The demo opens an outbox preview of every message instead of sending.
- **Outreach Call List.** Tier 3 students 20–60 points behind pace, with credit standing, guardian contacts, a good/concern/good call script and a checkbox to log each call.
- **Inactive 5+ days, attendance email, new enrollees with no start yet, life events (held harmless), academic integrity log, enrollment activity.**
- **Manage Enrollments console.** Browse the full Edgenuity export with filters and column picker, or compare two weekly reports to see who moved and who stalled.
- **AI analysis.** Sample operator and leadership reports (in the live hub these are written by Gemini on de-identified data).

## How the live version works

```
Edgenuity Manage Enrollments export → Drive drop folder → Apps Script pipeline → Google Sheet → this hub (Apps Script web app)
```

In this demo, `mock/server.js` stands in for the Apps Script server (`google.script.run`), `mock/data.js` generates the fictional students, and `mock/demo.js` simulates Gmail and phone calls. `index.html` and `manage-enrollments.html` are the hub's own pages with branding changed.

To run it locally, serve the folder with any static server, for example:

```
python -m http.server 8000
```
