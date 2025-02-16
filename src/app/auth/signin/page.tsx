import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInButton } from "@/components/auth/SignInButton";

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to Dr. Money Numbers</CardTitle>
          <CardDescription>Sign in to manage your budget</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButton />
        </CardContent>
      </Card>
    </div>
  );
} 