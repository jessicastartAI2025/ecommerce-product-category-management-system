import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-center">Sign Up</h1>
        <SignUp appearance={{ elements: { rootBox: "w-full" } }} />
      </div>
    </div>
  );
} 