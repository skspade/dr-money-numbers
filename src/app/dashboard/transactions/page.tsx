import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { TransactionTable } from "@/components/transactions/Table";
import { UploadCard } from "@/components/transactions/UploadCard";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <UploadCard userId={session.user.id} />
      </div>
      <TransactionTable userId={session.user.id} />
    </div>
  );
} 