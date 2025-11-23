# Activity Logger

A minimalist, web-based tool designed to simplify the tracking and historical viewing of personal run and walk activities. Built with modern web technologies to provide a fast, accessible, and secure platform for activity logging.

## 📋 Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## 🎯 Project Description

The Activity Logger addresses the common problem of manual activity tracking being cumbersome and historical data becoming easily lost or hard to recall over time. It provides a straightforward CRUD (Create, Read, Update, Delete) interface for activity data, allowing users to:

- Track run and walk activities with essential data (date, duration, activity type, optional distance)
- View historical activities in a simple, organized list
- Edit or delete existing activity entries
- Access their data securely with user authentication

The application follows a **mobile-first** and **minimalist design** approach, ensuring optimal user experience across all devices while maintaining GDPR compliance and security standards.

## 🛠 Tech Stack

### Frontend
- **Astro 5** - Fast, efficient website framework with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static type checking and enhanced IDE support
- **Tailwind 4** - Utility-first CSS framework for styling
- **Shadcn/ui** - Accessible React component library

### Backend
- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database
  - Built-in user authentication
  - Multiple language SDKs
  - Open-source solution with self-hosting options

### Testing
- **Vitest** - Fast, ESM-native test framework for unit and integration tests
- **React Testing Library** - Component testing from user perspective
- **@testing-library/user-event** - Realistic user interactions in tests
- **@testing-library/jest-dom** - DOM matchers for assertions
- **MSW (Mock Service Worker)** - API mocking for integration tests
- **Playwright** - Multi-browser end-to-end testing with screenshots/videos

### CI/CD and Hosting
- **GitHub Actions** - CI/CD pipeline automation
- **DigitalOcean** - Application hosting via Docker containers

## 🚀 Getting Started Locally

### Prerequisites
- Node.js version 22.14.0 (see `.nvmrc`)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd astrorunner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file with Supabase configuration
   # Add your Supabase URL and API keys
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:4321` to view the application.

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands |
| `npm run lint` | Run ESLint to check for code issues |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code using Prettier |

## 🎯 Project Scope

### MVP Features (Phase 1)
- ✅ User registration and authentication
- ✅ Secure login with password reset functionality
- ✅ Activity creation with required fields (Date, Duration, Activity Type)
- ✅ Optional distance tracking
- ✅ Activity viewing in list format
- ✅ Activity editing and deletion with confirmation
- ✅ Mobile-first responsive design
- ✅ HTTPS enforcement and GDPR compliance

### Deferred Features (Phase 2)
- 📅 Calendar view with activity highlights
- 📊 Statistics page with aggregate data
- 📈 Advanced analytics and reporting

### Out of Scope
- Mobile and watch applications
- Data sharing between users
- Complex run data analysis
- Data export functionality
- Email verification for new accounts

## 📊 Project Status

**Current Version**: 0.0.1  
**Status**: Development Phase  
**Phase**: MVP Development

The project is currently in active development, focusing on implementing the core MVP features outlined in the Product Requirements Document. The application is being built with a focus on security, performance, and user experience.

### Development Progress
- ✅ Project setup and configuration
- ✅ Tech stack implementation
- 🔄 Core CRUD functionality (in progress)
- ⏳ User authentication system
- ⏳ Activity management interface
- ⏳ Mobile-responsive design

## 📄 License

This project is currently in development. License information will be added upon project completion.

---

## 🤝 Contributing

This project is in active development. Contribution guidelines will be added as the project matures.

## 📞 Support

For questions or support regarding this project, please refer to the project documentation or create an issue in the repository.