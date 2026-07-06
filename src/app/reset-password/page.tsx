import { Suspense } from "react";
import { ResetPasswordView } from "@/modules/auth/ResetPasswordView";

// useSearchParams (reset token) requires a Suspense boundary at build time
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordView />
    </Suspense>
  );
}
