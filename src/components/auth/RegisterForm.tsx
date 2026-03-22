"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"github" | "google" | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (error) {
      setServerError(error.message ?? "Registration failed. Please try again.");
      return;
    }
    router.push("/dashboard");
  }

  async function handleOAuth(provider: "github" | "google") {
    setOauthLoading(provider);
    await authClient.signIn.social({ provider, callbackURL: "/dashboard" });
    setOauthLoading(null);
  }

  return (
    <Card className="w-full max-w-sm border-t-2 border-t-primary/50 shadow-[0_8px_40px_oklch(0.47_0.21_264/0.1)] dark:shadow-[0_8px_40px_oklch(0_0_0/0.5)] border-border/50">
      <CardHeader className="space-y-1 pb-5">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Create an account
        </CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Enter your details to get started with API Sentinel
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuth("github")}
            disabled={!!oauthLoading || isSubmitting}
            className="gap-2 border-border/60 hover:bg-accent/80"
          >
            {oauthLoading === "github" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SiGithub className="size-4" />
            )}
            GitHub
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuth("google")}
            disabled={!!oauthLoading || isSubmitting}
            className="gap-2 border-border/60 hover:bg-accent/80"
          >
            {oauthLoading === "google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SiGoogle className="size-4" />
            )}
            Google
          </Button>
        </div>

        <FieldSeparator>Or continue with email</FieldSeparator>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor="register-name">Full name</FieldLabel>
                <Input
                  id="register-name"
                  placeholder="John Doe"
                  autoComplete="name"
                  {...field}
                />
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : undefined}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor="register-email">Email</FieldLabel>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : undefined}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor="register-password">Password</FieldLabel>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  {...field}
                />
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : undefined}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor="register-confirm">
                  Confirm password
                </FieldLabel>
                <Input
                  id="register-confirm"
                  type="password"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  {...field}
                />
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : undefined}
                />
              </Field>
            )}
          />

          {serverError && (
            <p className="text-sm font-medium text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center gap-1 text-sm">
        <span className="text-muted-foreground">Already have an account?</span>
        <Link
          href="/login"
          className="font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
