# 📋 Centralized Validation & Reusable Forms Guide

## Overview

This guide explains how to use the new centralized validation system and reusable form components in A53.

### What's New

1. **lib/schemas.ts** - Centralized Zod schemas for all forms
2. **components/form-components.tsx** - Reusable form components and hooks
3. **GitHub Actions CI/CD** - Automated testing, building, and deployment
4. **Strict TypeScript** - Removed `ignoreBuildErrors` from next.config

---

## 1. Validation System (lib/schemas.ts)

### Overview

All form validations are defined once in `lib/schemas.ts` using Zod. This ensures:
- **Consistency** between frontend and backend validation
- **Single source of truth** for validation rules
- **Type safety** with automatic TypeScript types generated from schemas
- **Reusability** across API routes and components

### Available Schemas

```typescript
// Auth schemas
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/schemas";

// Reservation schema
import { reservaSchema, type ReservaInput } from "@/lib/schemas";
```

### Using Schemas in Components

```typescript
import { useValidatedForm } from "@/components/form-components";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export function LoginForm() {
  const form = useValidatedForm<LoginInput>(loginSchema);

  const onSubmit = async (data: LoginInput) => {
    // data is automatically typed and validated!
    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Using Schemas in API Routes

```typescript
// app/api/auth/login/route.ts
import { validateInput, loginSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json();

  // Validate input
  const result = validateInput(loginSchema, body);
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  // Use validated data with type safety
  const { email } = result.data;
  // ... rest of API logic
}
```

### Validation Helper Functions

```typescript
// Simple validation - returns single error message
const result = validateInput(loginSchema, data);
if (!result.success) {
  console.log(result.error); // "Email must be valid"
}

// Detailed validation - returns all field errors (for forms)
const result = validateInputDetailed(loginSchema, data);
if (!result.success) {
  console.log(result.errors); // { email: "Invalid email", ... }
}
```

### Adding New Schemas

To add validation for a new form:

```typescript
// In lib/schemas.ts
export const myNewSchema = z.object({
  field1: z.string().min(2, "Field1 too short"),
  field2: z.number().positive("Must be positive"),
});

export type MyNewInput = z.infer<typeof myNewSchema>;
```

---

## 2. Reusable Form Components

### Basic Form Input

```typescript
import { useValidatedForm, FormInput } from "@/components/form-components";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export function LoginForm() {
  const form = useValidatedForm<LoginInput>(loginSchema);
  const { register, formState: { errors } } = form;

  return (
    <form>
      <FormInput
        id="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        required
        error={errors.email?.message}
        {...register("email")}
      />
    </form>
  );
}
```

### Form Components Available

```typescript
import {
  FormInput,      // Text/email/password input
  FormTextarea,   // Textarea with validation
  FormSelect,     // Dropdown select
  FormWrapper,    // Complete form container
} from "@/components/form-components";
```

### Advanced: FormWrapper

The `FormWrapper` component handles:
- Form initialization with schema
- Submit button state management
- Loading indicators
- Error handling with toast notifications

```typescript
import { FormWrapper, FormInput, useFormSubmit } from "@/components/form-components";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export function LoginForm() {
  const { isLoading, handleSubmit } = useFormSubmit<LoginInput>(async (data) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Login failed");
  });

  return (
    <FormWrapper<LoginInput>
      schema={loginSchema}
      onSubmit={handleSubmit}
      title="Sign In"
      description="Enter your email to continue"
      submitLabel="Sign In"
      isLoading={isLoading}
    >
      <FormInput
        id="email"
        label="Email"
        placeholder="you@example.com"
        required
      />
    </FormWrapper>
  );
}
```

---

## 3. Migration Guide: Updating Existing Forms

### Before (Old Approach)

```typescript
const [email, setEmail] = useState("");
const [errors, setErrors] = useState<Record<string, string>>({});

const validateEmail = () => {
  if (!email.includes("@")) {
    setErrors({ email: "Invalid email" });
    return false;
  }
  return true;
};
```

### After (New Approach)

```typescript
import { useValidatedForm } from "@/components/form-components";
import { loginSchema, type LoginInput } from "@/lib/schemas";

const form = useValidatedForm<LoginInput>(loginSchema);
// Automatic validation, type safety, and error handling!
```

### Step-by-Step Migration

1. **Identify the form** (e.g., `components/login-usuario.tsx`)

2. **Create/update the schema** in `lib/schemas.ts`

3. **Replace form logic**:

```typescript
// OLD
const [email, setEmail] = useState("");
const [error, setError] = useState("");

// NEW
const form = useValidatedForm<LoginInput>(loginSchema);
const { register, formState: { errors } } = form;
```

4. **Update form fields**:

```typescript
// OLD
<Input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
{error && <p>{error}</p>}

// NEW
<FormInput
  id="email"
  label="Email"
  required
  error={errors.email?.message}
  {...register("email")}
/>
```

5. **Update submit handler**:

```typescript
// OLD
const handleSubmit = async () => {
  if (!validateEmail()) return;
  // manual validation then submit
};

// NEW
const onSubmit = async (data: LoginInput) => {
  // data is already validated!
  await fetch("/api/auth/login", { body: JSON.stringify(data) });
};

<form onSubmit={form.handleSubmit(onSubmit)}>
```

---

## 4. GitHub Actions CI/CD

### What the Pipeline Does

```
Push to GitHub
    ↓
1️⃣  Run Linting & TypeScript Checks
    ↓
2️⃣  Build Project
    ↓
3️⃣  Deploy to Staging (develop branch) OR Production (main branch)
```

### Setup Instructions

#### 1. Create GitHub Repository

```bash
git init
git remote add origin https://github.com/yourusername/a53.git
git add .
git commit -m "Initial commit: A53 with strict TypeScript and CI/CD"
git push -u origin main
```

#### 2. Set Up GitHub Secrets

In your GitHub repository:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret Name | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://a53.netlify.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | From Supabase dashboard |
| `DATABASE_URL` | Database connection | From your provider |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | From Supabase dashboard |
| `MAILJET_API_KEY` | Mailjet API key | From Mailjet |
| `MAILJET_SECRET_KEY` | Mailjet secret | From Mailjet |
| `EMAIL_FROM` | Sender email | `noreply@a53.netlify.app` |
| `NETLIFY_AUTH_TOKEN` | Netlify auth token | From Netlify account settings |
| `NETLIFY_SITE_ID` | Production site ID | From Netlify dashboard |
| `NETLIFY_STAGING_SITE_ID` | Staging site ID | From Netlify dashboard |

#### 3. Branching Strategy

```
main (production) ──→ Auto-deploys to production
develop (staging) ──→ Auto-deploys to staging
feature/* (pull requests) ──→ Runs tests, blocks merge if failures
```

### Workflow Triggers

- **On Push**: When code is pushed to `main` or `develop`
- **On Pull Request**: When a PR is opened/updated to `main` or `develop`

### Example: Making Changes

```bash
# Create a feature branch
git checkout -b feature/new-form

# Make changes
# ...

# Commit and push
git add .
git commit -m "Add new form with validation"
git push origin feature/new-form

# Create Pull Request on GitHub
# ✅ CI/CD runs automatically
# ✅ Checks TypeScript, Lint, Build
# ✅ PR blocks merge if checks fail
# ✅ Once merged to main, deploys to production
```

### Monitoring Deployments

1. Go to **Actions** tab in your repository
2. View real-time build logs
3. Check deployment status at the bottom of each workflow run

---

## 5. TypeScript Strict Mode

### What Changed

- Removed `ignoreBuildErrors: true` from `next.config.mjs`
- TypeScript now enforces strict type checking
- Build fails if TypeScript errors exist

### Expected Build Errors to Fix

Common errors encountered:

```typescript
// ❌ ERROR: Object is possibly null
const value = obj.property;

// ✅ FIXED: Type guard
const value = obj?.property ?? defaultValue;

// ❌ ERROR: Any type
const data: any = fetchData();

// ✅ FIXED: Proper typing
const data: MyDataType = await fetchData();

// ❌ ERROR: Function params without types
const handleClick = (e) => {};

// ✅ FIXED: Add type annotations
const handleClick = (e: React.MouseEvent) => {};
```

### Fixing Build Errors

1. Run: `npm run build`
2. Read error messages - they'll point to exact issues
3. Fix type mismatches
4. Re-run build until successful

---

## 6. Best Practices

### ✅ DO

- ✅ Always define schemas in `lib/schemas.ts`
- ✅ Use `useValidatedForm` for all new forms
- ✅ Validate in both frontend and backend
- ✅ Use proper TypeScript types from schemas
- ✅ Test CI/CD locally with: `npm run lint && npm run build`

### ❌ DON'T

- ❌ Don't use `any` types
- ❌ Don't skip validation on the backend
- ❌ Don't add form-specific validation logic in components
- ❌ Don't bypass TypeScript strict mode

---

## 7. Troubleshooting

### Build Fails with TypeScript Error

```bash
npx tsc --noEmit --skipLibCheck false
```

This shows all TypeScript errors. Fix them before pushing.

### GitHub Actions Keep Failing

1. Check the **Actions** tab for error logs
2. Common causes:
   - Missing secrets in GitHub
   - Environment variables not set
   - TypeScript/Lint errors
3. Fix locally first: `npm run lint && npm run build`

### Form Validation Not Working

- Ensure schema is imported from `lib/schemas.ts`
- Check the schema definition for the correct field names
- Use `useValidatedForm` hook, not plain `useForm`

---

## 📚 Resources

- [Zod Documentation](https://zod.dev)
- [React Hook Form Documentation](https://react-hook-form.com)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Netlify Documentation](https://docs.netlify.com)

---

## 📞 Support

For questions on:
- **Validation system**: Check `lib/schemas.ts` comments
- **Form components**: Check `components/form-components.tsx` comments
- **CI/CD**: Check `.github/workflows/ci-cd.yml`

---

**Last Updated**: April 2026  
**Version**: 1.0.0
