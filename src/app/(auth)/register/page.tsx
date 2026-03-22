import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create account | API Sentinel",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
