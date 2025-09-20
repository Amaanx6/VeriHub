# 🔎 VeriHub — Browser Extension & Platform for Misinformation Detection

VeriHub is a **browser extension + web platform** designed to help users detect, understand, and report misinformation while browsing.  
It combines **AI verification**, **inline highlights**, **tooltips**, and a **fact-check portal** to increase transparency and trust.

---

## 1. 📖 Overview

The VeriHub browser extension helps users detect and understand misinformation or fake news directly while browsing.

- Extracts page content and verifies it with AI.  
- Highlights suspicious or false claims inline on the webpage.  
- Shows a **tooltip** with quick actions.  
- Includes a **chatbot assistant** for deeper discussion.  
- Allows users to **report misinformation** via a simple button (complaint goes to VeriHub portal later).  

---

## 2. ⚙️ Core Features

### A. Content Extraction & Verification
- On page load, extension automatically extracts the DOM text.  
- Sends structured payload (title, content, sources, URL, timestamp) to AI.  
- AI response highlights potential misinformation.  

### B. Highlighting + Tooltip
- False/misleading claims are **highlighted inline** (e.g., yellow background).  
- Hovering/clicking shows a tooltip with actions.  

**Tooltip Layout Example:**
```

─────────────────────────────
⚠️ Possible misinformation
─────────────────────────────
📖 See fact-check / sources
🚨 Report this
💬 Ask AI about this
─────────────────────────────

```

### C. Report Button (Complaint)
- Tooltip includes a *“🚨 Report this”* button.  
- Clicking it opens a lightweight form or logs a local entry (integration with portal comes later).  
- Shows a toast/notification confirming the report.  

### D. Chatbot Assistant
- Tooltip includes a *“💬 Ask AI about this”* button.  
- Opens a small chat widget in-page.  
- Context passed: highlighted text + page info.  
- User can ask:  
  - “Is this claim true?”  
  - “What’s the evidence against this?”  
  - “Can you summarize the real facts?”  
- Chatbot provides conversational clarifications.  

---

## 3. 🧭 User Experience Flow
1. User loads a page → Extension scans content.  
2. AI detects false/misleading claims.  
3. Highlighted text appears on page.  
4. User hovers → Tooltip pops up with 3 actions:  
   - View fact-check  
   - Report misinformation  
   - Ask chatbot  
5. If chatbot opened → Mini chat widget appears for deeper discussion.  

---

## 4. 💡 Future Ideas (Extension Only)
- Toggle highlights ON/OFF from popup.  
- Add **credibility meter** for each domain.  
- Summarize **page reliability score** at top of page.  
- Multi-language support.  

---

# 🌍 VeriHub Platform — Documentation

## Part 1: General Module (Public Awareness & User-Facing)

The **General Module** is the public-facing side of VeriHub, designed for users, journalists, and researchers.

### 🔹 Features
1. **Complaint Feed**
   - Displays reports submitted via the extension.  
   - Each report contains:  
     - Article title  
     - Page URL  
     - Highlighted misinformation snippet(s)  
     - AI summary of the issue  
     - Timestamp  
   - Sort by: newest, most flagged, category.  

2. **Fact-Check Library**
   - A searchable, filterable collection of fact-checks.  
   - Each entry includes:  
     - ❌ **Claim** → “X is true”  
     - ✅ **Fact** → corrected truth  
     - Source links (WHO, Reuters, etc.)  
   - Filters: Health, Politics, Science, Finance, Technology, Social Media.  

3. **AI Chatbot (Verification Assistant)**
   - Users can paste text or a URL.  
   - Returns:  
     - Reliability rating (Low / Medium / High)  
     - Summary of issues  
     - Suggested fact-check links  
   - Available to **any visitor, no login required**.  

4. **Basic Analytics Dashboard**
   - Public insights into misinformation trends:  
     - 📈 Top reported domains  
     - 📊 Category breakdowns  
     - 🔥 Trending false claims  

---

## Part 2: Forensics Module (Evidence & Authority-Facing)

The **Forensics Module** makes complaints actionable by adding metadata, provenance, and evidence.  
Designed for authorities, researchers, and fact-checkers.

### 🔹 Features
1. **Metadata Extraction**
   - Captures at report time:  
     - Page URL, domain, timestamp, language, article length  

2. **Content Fingerprinting**
   - Generate **hash (SHA-256)** of article text.  
   - Identifies duplicates across sites.  
   - Helps cluster similar misinformation.  

3. **Source Analysis**
   - Extract outbound links.  
   - AI-based **Trust Score** (Low / Medium / High).  
   - Detects references to suspicious sources.  

4. **AI Fact-Check Snapshot**
   - Save structured AI JSON response at report time:  
     - Flagged claims  
     - Reasoning  
     - Severity level  
     - Suggested correction  
   - Ensures reproducibility for investigators.  

5. **Exportable Reports**
   - One-click “Case File” bundles.  
   - Formats: **PDF / CSV**.  
   - Includes:  
     - Content hash  
     - Metadata  
     - Highlighted text  
     - AI verification snapshot  

---

## 🔮 Future Roadmap
- **Role-Based Access** (Authorities/Researchers deeper tools).  
- **Media Forensics** (reverse image search, deepfake detection).  
- **Network Mapping** (track misinformation spread).  
- **Crowd Verification** (community upvotes/downvotes).  

---

## 📌 Summary
- **General Module = Awareness & Transparency**  
  (complaints feed, fact-check library, chatbot, analytics).  
- **Forensics Module = Evidence & Action**  
  (metadata, fingerprints, source analysis, AI snapshots, export tools).  
- Both are **public-access** in MVP (no login).  

