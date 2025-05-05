# Setting up Clerk Authentication

This project uses Clerk for user authentication. Follow these steps to set it up:

## 1. Create a Clerk Account

1. Go to [https://clerk.dev/](https://clerk.dev/) and sign up for an account
2. Create a new application in the Clerk dashboard

## 2. Configure Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Get these values from the Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key

# The URLs to redirect to after sign in/sign up
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

Replace `your_publishable_key` and `your_secret_key` with the actual keys from your Clerk Dashboard.

## 3. Authentication Flow

- The middleware.ts file protects routes that require authentication
- Users who are not signed in will be redirected to the sign-in page
- After signing in, users will be redirected to the home page
- The UserButton component in the header allows users to manage their account or sign out

## 4. Customization

You can customize the appearance of the sign-in and sign-up pages by modifying the appearance prop in the SignIn and SignUp components. 