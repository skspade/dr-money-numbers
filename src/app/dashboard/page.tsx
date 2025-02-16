import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, PiggyBank, Calendar, Settings } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Welcome back, {session.user?.name}</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/budget">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-6 w-6" />
                Budget Planner
              </CardTitle>
              <CardDescription>
                Manage your monthly budget allocations and track spending
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">View your budget</span>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/calendar">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Calendar View
              </CardTitle>
              <CardDescription>
                View your financial timeline and upcoming bills
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Check your schedule</span>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Settings
              </CardTitle>
              <CardDescription>
                Customize your preferences and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Manage settings</span>
              <ArrowRight className="h-5 w-5" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
} 