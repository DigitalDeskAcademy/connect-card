# Church Connect Card Management System

**Multi-tenant platform for churches to digitize connect cards and manage member engagement**

Transform paper connect cards into actionable member data with automated OCR scanning, intelligent data extraction, and comprehensive church management tools.

---

## Overview

Church Connect Card System helps churches eliminate manual data entry and improve visitor follow-up by:

- **Digitize Connect Cards** - Scan or upload photos of paper connect cards
- **Automated Data Extraction** - OCR technology extracts names, emails, phone numbers, prayer requests
- **Member Management** - Track visitors, members, and engagement
- **Church Training** - Built-in course system for staff and volunteer training

### Current Status: MVP Development

We're building the foundation with multi-tenant authentication, database setup, and core infrastructure. Connect card scanning with OCR integration is next.

---

## Technology Stack

### Core Framework

- **Next.js 15.3.4** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Full type safety

### Database & Authentication

- **Neon PostgreSQL** - Serverless PostgreSQL database
- **Prisma ORM 6.10.1** - Type-safe database client
- **Better Auth 1.2.9** - Modern authentication with email OTP

### File Storage & Email

- **Tigris S3** - Object storage for connect card images
- **Resend** - Email notifications and communications

### Architecture

- **Vertical Slice Architecture** - Feature-based organization
- **Multi-tenant System** - Organization-based church separation
- **Server Components First** - Optimized for performance

---

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (Neon recommended)
- Tigris S3 storage
- Resend account (for emails)
- OCR service (Google Cloud Vision or AWS Textract)

### Development Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/DigitalDeskAcademy/connect-card.git
   cd connect-card
   pnpm install
   ```

2. **Environment variables**

   ```bash
   cp .env.example .env
   # Configure all required environment variables
   ```

3. **Database setup**

   ```bash
   pnpm prisma generate
   pnpm prisma db push
   pnpm seed:all
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the platform.

---

## Project Structure

```
church-connect-card/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── agency/[slug]/     # Church dashboards (multi-tenant)
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Core utilities & configuration
├── prisma/               # Database schema & seeds
└── docs/                 # Technical documentation
```

### Planned Features

**Phase 1: Foundation** (In Progress)

- Multi-tenant authentication
- Database setup
- File storage
- Basic church dashboard

**Phase 2: Connect Card Processing**

- Image upload component
- OCR integration
- Data extraction and parsing
- Manual correction UI

**Phase 3: Member Management**

- Member database
- Connect card → Member conversion
- Member list and search
- Member detail view

**Phase 4: Additional Features** (TBD)

- Email campaigns to visitors
- Small group management
- Volunteer scheduling
- Or other church-specific needs

---

## Documentation

- **[FORK_SETUP_GUIDE.md](./docs/FORK_SETUP_GUIDE.md)** - Complete fork and setup instructions
- **[CLAUDE.md](./CLAUDE.md)** - Development guide for Claude Code
- **[docs/](./docs/)** - Technical architecture and development docs

---

## Development Commands

```bash
pnpm dev              # Start dev server
pnpm build           # Production build
pnpm lint            # Check code standards
pnpm format          # Auto-format code

# Database
pnpm prisma generate  # Generate Prisma client
pnpm prisma db push   # Push schema changes
pnpm seed:all        # Seed test data
```

---

## Current Status

**MVP Development** - Setting up infrastructure

- Setting up new database and services
- Rebranding from forked project
- Removing unused features (payments, calendar, inventory)
- Preparing for connect card scanning implementation

**Forked From:** SideCar Platform (IV therapy clinic CRM)
**Keeping:** Multi-tenant auth, courses (for church training), core infrastructure
**Removing:** GHL integration, payments, appointments, inventory, reviews

---

## Support

For setup questions, see [FORK_SETUP_GUIDE.md](./docs/FORK_SETUP_GUIDE.md)

For technical issues, check the documentation in `/docs/`

---

**Helping churches transform paper connect cards into meaningful connections.** 🙏
