import { auth } from "@/auth";
import PasswordForm from "./PasswordForm";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const session = await auth();
  const { required } = await searchParams;

  return (
    <div className="max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Change Password</h1>
        {required === "1" && (
          <div className="mt-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md px-4 py-3 text-sm text-yellow-300">
            Your password has expired or has never been set. Please choose a new password to continue.
          </div>
        )}
      </div>
      <PasswordForm email={session?.user?.email ?? ""} />
    </div>
  );
}
