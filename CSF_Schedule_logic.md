# CSF Schedule Logic Documentation

This document outlines the business logic and formatting rules used for the Christian Students' Fellowship (CSF) schedules.

## 1. Weekly Schedule Logic

The weekly schedule is generated for a specified duration (1-12 months) and follows a consistent pattern of meetings.

### Meeting Frequency & Event Assignment
- **Sunday**: "Sunday Service" (Sentence case, Red font). One person is assigned as the leader. The "Word" column is intentionally left blank.
- **Tuesday**: "PRAYER & WORD SHARING" (Uppercase, Red font). Two different people are randomly assigned: one for leading and one for sharing the word.
- **Wednesday**: "BIBLE STUDIES" (Uppercase, Red font). This is a merged row where the "BIBLE STUDY DEPARTMENT" is assigned across the leader/word columns.
- **Thursday**: Alternates weekly between "PRAYER & FASTING" and "REVIVAL & DELIVERANCE" (Uppercase, Red font). These are merged rows.
- **Last Friday of Month**: "HALF NIGHT" (Uppercase, Red font). A merged row assigned to the "INTERCESSORY DEPARTMENT".
- **Saturday**: "Leaders' & 10PM Prayer" (Sentence case, Red font). A merged row where two people are assigned specific roles.

### Formatting & Styling Rules
#### Case Sensitivity
- **UPPERCASE**: Applied to most major events (BIBLE STUDIES, PRAYER & FASTING, etc.).
- **Sentence Case**: Applied to "Sunday Service", "Leaders' & 10PM Prayer", and names on Thursdays/Saturdays.

#### Color Coding
- **Red Font**: Used for Event Titles and specific role indicators (e.g., bracketed text on Saturdays).
- **Gray/Default Font**: Used for the names of individuals on Thursdays and Saturdays to distinguish people from the event titles.
- **Specific Saturday Logic**: In the merged column for Saturdays, names are gray while the context tags (e.g., `(Leaders' Prayer)`) and the `&` connector remain red.

#### Row Merging
- Rows are merged (spanning Leader and Word columns) for events where a single department or a combined team is responsible for the entire session (e.g., Thursdays, Saturdays, Bible Studies).

---

## 2. Half Night of Prayer Schedule Logic

The Half Night schedule is a detailed breakdown of a single night's vigil.

### Structure
Each item in the schedule consists of:
- **Time Range**: Start and end times (e.g., 21:00 - 21:20).
- **Session Name**: The name of the specific activity (e.g., "WARFARE PRAYER", "WORSHIP").
- **Scriptural Reference**: Bible verses relevant to the session.
- **Steward**: The person or group leading the session.
- **Prayer Points**: A list of specific points to be prayed over during that session.

### Styling & Special Events
- **Special Sessions**: "OPENING PRAYER", "WORSHIP", "WORD SHARING", and "CLOSING PRAYER" are treated as high-priority sessions. They are displayed in **RED UPPERCASE** font.
- **Highlighting**: Special/Prayer sessions are often highlighted with a light background (e.g., `bg-red-50` or `bg-yellow-100`) to differentiate them from standard sessions.

### Generation & API Integration
- The schedule can be manually edited or generated.
- There is support for integrating with AI (Gemini API) to automatically generate relevant scriptural references and prayer points based on the session names.

---

## 3. Data Management
- **Persistence**: Schedules are stored in **Cloud Firestore** for live access and **IndexedDB/LocalStorage** for offline draft management.
- **Exporting**: Both schedule types support exporting to **Microsoft Word (.docx)** format with professional table styling suitable for printing.
