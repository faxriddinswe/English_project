import { PasswordForm } from "@/features/auth/PasswordForm";
export const metadata = {
  title: "Parolni almashtirish",
  robots: { index: false, follow: false },
};
export default function ChangePassword() {
  return <PasswordForm />;
}
