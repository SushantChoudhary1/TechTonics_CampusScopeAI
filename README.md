# CampusScope AI

### TechIt'Easy

> **An AI-powered campus complaint management and issue intelligence platform that turns scattered student complaints into structured, prioritized administrative action.**

---

## 👥 Team TechTonics

**Vellore Institute of Technology, Chennai**
**Hackverse Hackathon**

| Team Member           |
| --------------------- |
| **Sushant Choudhary** |
| **Naman Kumar**       |
| **Saai Sree Karthi**  |

---

## 📌 Overview

**CampusScope AI** is a full-stack AI-powered campus complaint management system developed by **Team TechTonics** for the **Hackverse Hackathon** at **Vellore Institute of Technology, Chennai**.

Traditional college complaint portals primarily function as digital ticket boxes: a student submits a complaint, an administrator receives it, and the complaint is eventually resolved.

CampusScope AI approaches the problem differently.

Instead of treating every complaint as an isolated ticket, the platform uses an AI-powered processing layer to understand submitted complaints, classify their nature, evaluate their severity, and help administrators organize issues according to their importance.

The result is a connected workflow between students and administrators:

```text
Student Report
      ↓
AI Processing
      ↓
Category + Severity + Priority
      ↓
Database
      ↓
Administrative Review
      ↓
Faculty Assignment
      ↓
Resolution
      ↓
Student Tracking
      ↓
Feedback
```

The core philosophy behind CampusScope AI is simple:

> **Complaints shouldn't just be collected. They should be understood, organized, prioritized, and acted upon.**

---

# 🎯 The Problem

Campus environments generate a large number of everyday complaints:

* Infrastructure problems
* Water-related issues
* Electrical problems
* Cleanliness and maintenance
* Safety concerns
* Academic issues
* Other campus-related problems

The difficulty is not necessarily collecting these complaints.

The real difficulty is **making sense of a large number of complaints efficiently**.

Consider a situation where several students independently report:

```text
"The water cooler in Block C isn't working."

"No drinking water near Block C."

"Block C water facility is unavailable."

"The water cooler beside the lab is broken."
```

A conventional complaint system may simply store these as separate tickets.

An administrator then has to manually inspect the incoming complaints and determine which issues deserve immediate attention.

CampusScope AI introduces an intelligence layer between the complaint and the administrator.

```text
Many Complaints
      ↓
AI Processing
      ↓
Structured Information
      ↓
Severity / Priority
      ↓
Administrative Focus
      ↓
Action
```

This helps reduce the amount of manual interpretation required before administrators can begin dealing with important problems.

---

# 💡 What Makes CampusScope AI Different?

> **What makes CampusScope different from a normal college complaint portal is that it doesn't treat complaints as equally important isolated tickets.**

A conventional portal generally follows:

```text
Complaint
   ↓
Store
   ↓
Administrator
   ↓
Resolve
```

CampusScope AI introduces an intelligence-driven layer:

```text
Complaint
   ↓
Understand
   ↓
Categorize
   ↓
Evaluate
   ↓
Prioritize
   ↓
Administrator
   ↓
Resolve
```

The system is designed to help filter important underlying issues from the clutter of individual complaints.

Instead of administrators having to work through every complaint with equal attention, CampusScope AI provides structured information that helps them identify what deserves attention first.

This creates a smaller gap between the people **reporting problems** and the people **responsible for solving them**.

In simple terms:

> **One login connects the student side of the problem to the administrative side of the solution.**

---

# 🚀 Key Features

## Student Portal

The Student Portal provides students with a dedicated interface to interact with the complaint system.

### Complaint Submission

Students can submit complaints through the platform while providing relevant information about the issue and its location.

### My Reports

Students can access their previously submitted complaints and monitor their progress.

### Complaint Tracking

Complaints progress through a clear four-stage workflow:

```text
Submitted
    ↓
Viewed
    ↓
Assigned a Faculty
    ↓
Resolved
```

The **Viewed** state represents an actual administrative interaction with the complaint rather than simply assuming that it has been seen.

### Latest Signals

Students can view recent complaint activity and navigate directly to the corresponding complaint tracking information.

### Notifications

Relevant complaint updates can be communicated through the application's notification interface.

### Feedback

Once a complaint has been resolved, students can provide feedback regarding the resolution.

---

# 🛠️ Admin Portal

The Admin Portal provides administrators with the tools required to manage the complaint lifecycle.

### Complaint Management

Administrators can:

* View incoming complaints
* Open and inspect complaint details
* Review complaint information
* Assign complaints to faculty
* Update supported complaint information
* Resolve complaints
* Access logged complaints
* Monitor complaint activity
* Work with prioritized complaint information

### Automatic Viewed State

Opening a complaint triggers the appropriate **Viewed** state.

This means the student-facing tracking timeline can distinguish between:

```text
Complaint Submitted
```

and:

```text
Complaint Actually Reviewed
```

This small distinction makes the complaint lifecycle more transparent.

### Faculty Assignment

Administrators can assign a complaint to the appropriate faculty or staff member for further action.

### Resolution

Once the issue has been addressed, the administrator can mark the complaint as resolved.

The historical complaint record remains available rather than disappearing after resolution.

---

# 🤖 AI-Powered Complaint Processing

The central feature that differentiates CampusScope AI from a conventional complaint portal is its AI-powered complaint processing.

The system is designed to accept complaints in natural language instead of requiring students to describe issues using rigid technical terminology.

For example:

```text
"Block C water cooler kaam nahi kar raha."
```

The AI processing layer can transform the natural-language complaint into structured information such as:

```text
Category: Water / Infrastructure
Location: Block C
Severity: Medium
```

This structured information can then be used by the rest of the application.

### AI Capabilities

CampusScope AI incorporates AI-assisted processing for:

* Complaint categorization
* Severity identification
* Priority-oriented complaint processing
* Natural-language understanding
* Multilingual / Hinglish-style complaint understanding
* Complaint intelligence

The AI layer is powered using **Manus AI**.

---

# 🧠 From Complaint to Intelligence

A conventional complaint system might store:

```text
Complaint #1024
Status: Open
```

CampusScope AI aims to turn that into something more useful:

```text
Issue:
Water / Infrastructure

Location:
Block C

Severity:
Medium

Priority:
High

Status:
Viewed
```

The distinction is important.

The purpose of the AI layer is **not to replace administrative judgment**.

Instead, it provides administrators with structured context so that human decisions can be made faster and with more information.

---

# 🗺️ Campus Activity Intelligence

CampusScope AI incorporates campus-location awareness into the complaint management workflow.

Rather than viewing complaints exclusively as text entries, administrators can associate issues with specific campus locations.

This allows the system to move conceptually from:

```text
Individual Complaint
        ↓
Location
        ↓
Related Activity
        ↓
Campus-Level Awareness
```

Location information therefore becomes another dimension through which administrators can understand campus problems.

The implemented campus interface is designed around the VIT Chennai use case used during the project demonstration.

---

# 🔄 Complaint Lifecycle

CampusScope AI connects the entire complaint lifecycle into one system.

```text
┌─────────────────────┐
│ Student submits     │
│ complaint           │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ AI processing       │
│ and classification  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Complaint stored    │
│ in database         │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Administrator       │
│ reviews complaint   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Faculty assignment  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Resolution          │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Student tracking    │
│ and feedback        │
└─────────────────────┘
```

---

# 🔐 Role-Based Access

CampusScope AI separates the student and administrator experiences while keeping them connected to the same underlying complaint system.

```text
                    CampusScope AI
                          │
              ┌───────────┴───────────┐
              │                       │
           Student                  Admin
              │                       │
              ↓                       ↓
       Student Login            Admin Login
              │                       │
              ↓                       ↓
       Student Portal           Admin Portal
```

Each role receives an interface appropriate to its responsibilities.

Students primarily interact with:

* Complaint submission
* Complaint history
* Complaint tracking
* Notifications
* Feedback

Administrators primarily interact with:

* Incoming complaints
* Complaint review
* Faculty assignment
* Resolution
* Prioritization
* Administrative monitoring

---

# 🏗️ System Architecture

CampusScope AI follows a modern full-stack web application architecture.

```text
                         CampusScope AI
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
          Student Frontend               Admin Frontend
                 │                             │
                 └──────────────┬──────────────┘
                                │
                                ↓
                           tRPC / API
                                │
                                ↓
                         Node.js Server
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
                  ↓                           ↓
           AI Processing               Database Layer
                  │                           │
                  └─────────────┬─────────────┘
                                │
                                ↓
                     Campus Intelligence
```

The application is divided into four conceptual layers:

### 1. Student Interaction

```text
Student
   ↓
Submit Complaint
   ↓
Track Complaint
   ↓
Receive Updates
   ↓
Submit Feedback
```

### 2. Intelligence Layer

```text
Complaint
   ↓
AI Processing
   ↓
Category
Severity
Priority
```

### 3. Administration Layer

```text
Admin
   ↓
Review
   ↓
Assign Faculty
   ↓
Update
   ↓
Resolve
```

### 4. Campus Intelligence

```text
Complaint Data
      ↓
Location + Severity + Priority
      ↓
Campus Awareness
      ↓
Administrative Action
```

---

# 🗄️ Database & Data Flow

The database serves as the persistent source of truth for the application's complaint information.

A complaint record can contain information such as:

```text
Complaint
├── ID
├── Student
├── Description
├── Location
├── Category
├── Severity
├── Priority
├── Status
├── Assigned Faculty
├── Timestamp
└── Additional Metadata
```

The general data flow is:

```text
Student Submission
       ↓
Backend
       ↓
AI Processing
       ↓
Database
       ↓
Admin Interface
       ↓
Status / Assignment Updates
       ↓
Student Tracking
```

Because the student and administrator interfaces operate on the same underlying complaint records, changes made during the administrative workflow can be reflected in the student's complaint tracking experience.

---

# 🧩 Technology Stack

CampusScope AI is built as a modern full-stack TypeScript application.

## Frontend

| Technology               | Purpose                              |
| ------------------------ | ------------------------------------ |
| **React**                | User interface                       |
| **TypeScript**           | Application language and type safety |
| **Vite**                 | Build and development tooling        |
| **Tailwind CSS**         | Styling                              |
| **Framer Motion**        | Interface animations                 |
| **Recharts**             | Data visualization                   |
| **Lucide React**         | Interface icons                      |
| **Wouter**               | Client-side routing                  |
| **TanStack React Query** | Query and mutation state             |
| **Radix UI**             | Accessible UI primitives             |
| **Sonner**               | Toast notifications                  |
| **date-fns**             | Date formatting and utilities        |
| **Embla Carousel**       | Carousel functionality               |
| **Tailwind CSS Animate** | Animation utilities                  |

## Backend

| Technology     | Purpose                           |
| -------------- | --------------------------------- |
| **Node.js**    | Server-side runtime               |
| **Express**    | Backend server framework          |
| **TypeScript** | Backend language and type safety  |
| **tRPC**       | Typed client-server communication |

## Database

| Technology      | Purpose                       |
| --------------- | ----------------------------- |
| **TiDB**        | MySQL-compatible database     |
| **MySQL2**      | Database driver               |
| **Drizzle ORM** | Database access and ORM layer |

## Validation & Data

| Technology    | Purpose                     |
| ------------- | --------------------------- |
| **Zod**       | Input and API validation    |
| **SuperJSON** | Serialization for tRPC data |

## Authentication & Security

| Technology            | Purpose                          |
| --------------------- | -------------------------------- |
| **Jose**              | JWT/session-related cryptography |
| **Role-based access** | Student/Admin separation         |

## Other Dependencies

| Technology | Purpose                   |
| ---------- | ------------------------- |
| **Axios**  | HTTP client               |
| **dotenv** | Environment configuration |

## AI

| Technology   | Purpose                                           |
| ------------ | ------------------------------------------------- |
| **Manus AI** | AI-assisted complaint processing and intelligence |

---

# 📁 Project Structure

The project follows a structured full-stack layout:

```text
CampusScope AI/
│
├── client/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── lib/
│       ├── pages/
│       └── App.tsx
│
├── server/
│   ├── _core/
│   ├── db.ts
│   ├── routers.ts
│   └── ...
│
├── shared/
│   └── ...
│
├── dist/
│
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── ...
```

---

# ⚙️ Local Development

## Prerequisites

A development environment should include:

* **Node.js**
* **pnpm**
* **Git**
* **TiDB / MySQL-compatible database**
* Required AI and integration credentials

---

## 1. Install Dependencies

```bash
pnpm install
```

---

## 2. Configure Environment Variables

Create a local `.env` file containing the required configuration.

Typical environment variables include:

```env
DATABASE_URL=
JWT_SECRET=
VITE_APP_ID=
OAUTH_SERVER_URL=
OWNER_OPEN_ID=
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

Additional environment variables may be required depending on the runtime configuration.

> **Never commit real database credentials, API keys, authentication secrets, or other sensitive values to GitHub.**

---

## 3. Start the Development Server

```bash
pnpm dev
```

---

## 4. Build the Application

```bash
pnpm build
```

---

## 5. Start the Production Build

```bash
pnpm start
```

---

# 🧪 Testing

The project includes automated checks for important application behavior.

Run the test suite:

```bash
pnpm test
```

Run TypeScript validation:

```bash
pnpm check
```

Testing and validation cover areas of application behavior including:

* Complaint workflows
* Complaint status handling
* Priority and severity behavior
* Frontend contracts
* Database interactions
* Campus-location behavior
* User-facing application flows

---

# 🌐 Deployment

CampusScope AI was **not permanently deployed as a public production service**.

The project was demonstrated using the **WebDev publishing infrastructure provided through Manus AI**.

The resulting publishing link was used as a temporary demonstration environment for the hackathon project.

It should therefore be understood as:

```text
Hackathon Project
      ↓
Temporary Demo Deployment
      ↓
Project Demonstration
```

There is **no permanent public deployment URL** associated with this repository.

The project is not being presented as an actively hosted production service.

---

# 📊 Project Scope

CampusScope AI was developed specifically as a **hackathon project and working prototype**.

The goal was not to build a commercially maintained enterprise platform, but to demonstrate how AI could be integrated into a campus complaint-management workflow to make the process more intelligent and organized.

The implemented system demonstrates the core concept:

```text
Student
   ↓
Complaint
   ↓
AI
   ↓
Structured Intelligence
   ↓
Admin
   ↓
Action
   ↓
Resolution
```

---

# ⚠️ Limitations

CampusScope AI should be evaluated within the context in which it was created: a hackathon-scale prototype.

Some limitations include:

* AI functionality depends on the configured AI service and its availability.
* Authentication and external integrations require appropriate configuration.
* The project was designed primarily around the demonstrated **VIT Chennai** use case.
* Temporary deployment availability depends on the infrastructure used for demonstration.
* The implementation does not claim the scalability, operational guarantees, or security posture of a mature enterprise campus-management platform.
* Some concepts that could exist in a broader vision are outside the implemented prototype.

These limitations reflect the intended scope of the project rather than the core concept itself.

---

# 🚫 Future Development

**CampusScope AI is considered a completed project for the Hackverse Hackathon.**

There is currently:

* No planned future development roadmap
* No planned future versions
* No commitment to permanent hosting
* No planned continuation as a production service

This repository exists primarily to **document and preserve the completed work of Team TechTonics**.

Future development may only occur if the creators independently decide to revisit the project; it is not part of the current project scope.

---

# 🏆 Why CampusScope?

CampusScope AI began with a simple observation:

> **A campus problem rarely exists in isolation.**

A student might report:

```text
"The light outside Block C keeps flickering."
```

Another might report:

```text
"Block C corridor is getting dark."
```

Another:

```text
"The corridor light keeps turning off."
```

Individually, these are complaints.

Together, they may represent a larger problem.

CampusScope AI is designed around the idea that complaint management should move beyond:

```text
Report → Store → Resolve
```

toward:

```text
Report
   ↓
Understand
   ↓
Connect
   ↓
Prioritize
   ↓
Act
   ↓
Resolve
```

That is the central idea behind CampusScope AI.

---

# 🔭 The Four-Layer Concept

The project can ultimately be understood through four connected layers:

### Student Layer

Makes reporting and tracking straightforward.

### Intelligence Layer

Processes complaints and converts natural-language information into structured signals.

### Administration Layer

Allows administrators to review, assign, manage, and resolve complaints.

### Campus Intelligence Layer

Uses complaint information such as location, severity, and priority to give administrators a broader view of campus activity.

Together:

```text
┌──────────────────────────────┐
│       Student Interaction    │
├──────────────────────────────┤
│       AI Intelligence        │
├──────────────────────────────┤
│       Administration         │
├──────────────────────────────┤
│       Campus Intelligence    │
└──────────────────────────────┘
```

---

# 🧠 Central Philosophy

A normal complaint portal asks:

> **"What complaints have been submitted?"**

CampusScope AI attempts to ask a more useful question:

> **"What problems matter most right now?"**

That distinction is the foundation of the project.

---

# 🙏 Acknowledgements

CampusScope AI was made possible through the opportunity, tools, knowledge, and support received during its development.

## Hackverse

We sincerely acknowledge **Hackverse** for providing the opportunity and environment in which CampusScope AI was developed.

The hackathon provided the challenge and time constraint that pushed the concept from an idea into a working prototype.

## Vellore Institute of Technology, Chennai

We are grateful to **Vellore Institute of Technology, Chennai** for providing the academic environment and opportunity that enabled us to participate in Hackverse and work on this project.

## Friends, Peers & Helpers

We would also like to acknowledge the friends, peers, and everyone who helped along the way through:

* Ideas
* Feedback
* Technical knowledge
* Tools
* Advice
* Encouragement
* Problem-solving

Even contributions that were small individually helped move the project forward.

## Manus AI

A special acknowledgement goes to the **Manus AI development team**.

Manus AI played a significant role in enabling the rapid development of CampusScope AI within the constraints of a hackathon.

Its AI-assisted development capabilities helped us move from requirements and ideas toward a functioning application within a limited timeframe.

## And Finally — Ourselves

And, perhaps unusually, we would also like to acknowledge **ourselves**.

Not because completing a project makes anyone extraordinary, but because actually finishing something is worth recognizing.

We started with an idea.

We encountered implementation problems.

We learned along the way.

We built, changed, debugged, tested, and kept going.

And eventually, we finished it.

So thank you to:

**Sushant Choudhary**
**Naman Kumar**
**Saai Sree Karthi**

for taking CampusScope AI from concept to completion.

Sometimes the person who deserves a little credit is simply the person who didn't quit.

---

# 👨‍💻 Team

## Team TechTonics

**CampusScope AI**
**TechIt'Easy**

**Vellore Institute of Technology, Chennai**
**Hackverse Hackathon**

### Members

| Name              |
| ----------------- |
| Sushant Choudhary |
| Naman Kumar       |
| Saai Sree Karthi  |

---

# 📜 License

No open-source license has been assigned to this project.

All rights to the project remain with its creators unless otherwise stated.

---

# 💙 Closing Note

CampusScope AI began with a simple question:

> **What if a campus complaint system did more than collect complaints?**

The result is a completed hackathon prototype combining:

* Student complaint reporting
* AI-assisted complaint processing
* Complaint categorization
* Severity assessment
* Priority-oriented management
* Administrative review
* Faculty assignment
* Complaint resolution
* Student tracking
* Location awareness
* Notifications
* Feedback

Its philosophy can be summarized in five words:

> **Understand the problem. Prioritize the solution.**

---

# CampusScope AI

### **TechIt'Easy**

**Built by Team TechTonics**

**Vellore Institute of Technology, Chennai**

**Hackverse Hackathon**

---
