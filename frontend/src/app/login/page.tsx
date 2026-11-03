import { LoginForm } from "@/features/auth/LoginForm";
export const metadata = {
  title: "Kabinetga kirish",
  robots: { index: false, follow: false },
};
export default function Login() {
  return <LoginForm />;
}
