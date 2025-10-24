# Third-Party Package Decision Log

## Overview

This document tracks all third-party packages added to the LMS platform, the reasoning behind each choice, and alternatives considered. This helps with future maintenance, troubleshooting, and decision-making.

## Major Package Categories

### 🎨 **UI & Styling**

| Package             | Purpose              | Why Chosen                      | Alternatives Considered         |
| ------------------- | -------------------- | ------------------------------- | ------------------------------- |
| `shadcn/ui`         | Component library    | Headless, customizable, modern  | Chakra UI, Mantine, Material-UI |
| `@radix-ui/react-*` | Primitive components | Accessibility-first, unstyled   | Reach UI, Headless UI           |
| `tailwindcss`       | CSS framework        | Utility-first, fast development | Bootstrap, Styled Components    |
| `lucide-react`      | Icon library         | Large selection, tree-shakeable | React Icons, Heroicons          |
| `next-themes`       | Theme switching      | Next.js optimized, SSR-safe     | Manual implementation           |

### 📝 **Forms & Validation**

| Package               | Purpose                | Why Chosen                      | Alternatives Considered  |
| --------------------- | ---------------------- | ------------------------------- | ------------------------ |
| `react-hook-form`     | Form management        | Performance, minimal re-renders | Formik, React Final Form |
| `@hookform/resolvers` | Form validation bridge | Seamless Zod integration        | Manual validation        |
| `zod`                 | Schema validation      | Type-safe, runtime validation   | Yup, Joi, Ajv            |

### 🗄️ **Database & Backend**

| Package          | Purpose          | Why Chosen               | Alternatives Considered   |
| ---------------- | ---------------- | ------------------------ | ------------------------- |
| `@prisma/client` | Database ORM     | Type-safe, great DX      | Drizzle, TypeORM, raw SQL |
| `prisma`         | Database toolkit | Migration system, studio | Knex.js, Sequelize        |

### 🔐 **Authentication & Security**

| Package        | Purpose                  | Why Chosen             | Alternatives Considered   |
| -------------- | ------------------------ | ---------------------- | ------------------------- |
| `better-auth`  | Authentication           | Modern, flexible setup | NextAuth.js, Auth0, Clerk |
| `@arcjet/next` | Rate limiting & security | Next.js integration    | Custom rate limiting      |

### 💳 **Payments**

| Package  | Purpose            | Why Chosen                  | Alternatives Considered |
| -------- | ------------------ | --------------------------- | ----------------------- |
| `stripe` | Payment processing | Industry standard, webhooks | PayPal, Square, Paddle  |

### 📁 **File Management**

| Package                         | Purpose        | Why Chosen                                 | Alternatives Considered |
| ------------------------------- | -------------- | ------------------------------------------ | ----------------------- |
| `@aws-sdk/client-s3`            | S3 uploads     | Modern SDK, tree-shaking                   | AWS SDK v2, direct REST |
| `@aws-sdk/s3-request-presigner` | Secure uploads | Presigned URLs, no credentials in frontend | Direct server upload    |

### ✨ **User Experience**

| Package         | Purpose             | Why Chosen                  | Alternatives Considered                 |
| --------------- | ------------------- | --------------------------- | --------------------------------------- |
| `@dnd-kit/core` | Drag & drop         | Modern, accessible          | react-beautiful-dnd, react-sortable-hoc |
| `@tiptap/react` | Rich text editor    | Headless, JSON output       | React-Quill, TinyMCE, Draft.js          |
| `sonner`        | Toast notifications | Simple API, good animations | react-hot-toast, react-toastify         |

### 📊 **Data Visualization**

| Package    | Purpose            | Why Chosen               | Alternatives Considered  |
| ---------- | ------------------ | ------------------------ | ------------------------ |
| `recharts` | Charts & analytics | React-native, responsive | Chart.js, D3.js, Victory |

## Package Selection Criteria

### ✅ **Must Have**

- **TypeScript Support**: Built-in or community types
- **Active Maintenance**: Recent commits, responsive maintainers
- **React 18 Compatible**: Supports concurrent features
- **Next.js 15 Compatible**: Works with App Router

### 🎯 **Nice to Have**

- **Tree Shaking**: Reduces bundle size
- **Zero Dependencies**: Fewer security vulnerabilities
- **Server Components**: Works with React Server Components
- **Accessibility**: WCAG compliant out of the box

### ❌ **Deal Breakers**

- **No TypeScript**: Too risky for production apps
- **Abandoned**: No updates in 12+ months
- **Large Bundle**: >50kb compressed unless essential
- **React 17 Only**: Not future-proof

## Bundle Size Monitoring

Monitor these packages for bundle size impact:

- `@tiptap/*` - Rich text editor (can be heavy with extensions)
- `@dnd-kit/*` - Drag & drop (multiple packages)
- `recharts` - Charts (has dependencies)
- `@aws-sdk/*` - AWS SDK (use selective imports)

## Upgrade Strategy

### 🚀 **Major Version Upgrades**

- Test in development environment first
- Check breaking changes in migration guides
- Update documentation if API changes
- Consider beta testing with subset of features

### 🔧 **Minor/Patch Upgrades**

- Update regularly for security patches
- Test critical user flows after updates
- Monitor for new deprecation warnings

## Removal Checklist

Before removing any package:

- [ ] Search codebase for all imports
- [ ] Check for indirect usage (components, hooks)
- [ ] Update package.json and lock file
- [ ] Test all affected features
- [ ] Update this documentation

## Package-Specific Notes

### Potential Future Replacements

- **Better-Auth → Clerk**: If we need more enterprise features
- **Tigris → Cloudflare R2**: For production cost savings
- **Tiptap → Custom Editor**: If we need specialized course content features

### Integration Dependencies

Some packages work together and should be upgraded/removed as a group:

- `@radix-ui/*` + `shadcn/ui` (UI system)
- `@dnd-kit/*` packages (drag & drop system)
- `@tiptap/*` packages (rich text editor)
- `@aws-sdk/*` packages (S3 integration)

## Decision Process

When adding new packages:

1. **Identify Need**: Clear business requirement
2. **Research Options**: Compare 3-5 alternatives minimum
3. **Prototype**: Test integration in isolated branch
4. **Evaluate**: Bundle size, TypeScript support, maintenance
5. **Document**: Add to this decision log with reasoning
6. **Implement**: Add to project with proper configuration
7. **Monitor**: Track performance and developer experience

## Contact & Resources

For questions about package decisions or suggestions for improvements:

- Review this document first
- Check individual package documentation files
- Consider business impact vs. technical debt
- Document any changes made
