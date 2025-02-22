import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MonthlyPlanner } from '@/components/budget/MonthlyPlanner';

export default async function BudgetPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw redirect('/auth/signin');
  }

  if (!session.user.id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <MonthlyPlanner userId={session.user.id} />
    </div>
  );
}
