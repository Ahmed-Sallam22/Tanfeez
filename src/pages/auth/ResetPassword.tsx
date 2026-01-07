import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  useRequestResetMutation,
  useResetPasswordMutation,
} from "../../api/auth.api";
import { Button, Input, PasswordInput, FormField } from "../../components/ui";
import Animation from "../../assets/Animation.png";

const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RequestResetForm = z.infer<typeof requestResetSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [emailSent, setEmailSent] = useState(false);

  const [requestReset, { isLoading: isRequestLoading }] =
    useRequestResetMutation();
  const [resetPassword, { isLoading: isResetLoading }] =
    useResetPasswordMutation();

  const requestForm = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onRequestReset = async (data: RequestResetForm) => {
    try {
      await requestReset(data).unwrap();
      setEmailSent(true);
      toast.success(t("resetEmailSent") || "Reset email sent!");
    } catch {
      // Error is already handled by RTK Query
    }
  };

  const onResetPassword = async (data: ResetPasswordForm) => {
    if (!token) return;

    try {
      await resetPassword({
        token,
        password: data.password,
      }).unwrap();

      toast.success(t("passwordResetSuccess") || "Password reset successful!");
    } catch {
      // Error is already handled by RTK Query
    }
  };

  return (
    <div className="min-h-screen flex lg:flex-row flex-col">
      {/* Left Panel - Form */}
      <div className="h-[20vh] flex lg:hidden items-center justify-center bg-gradient-to-r from-[#0773FF] to-[#00377E]">
        <svg
          width="100"
          height="49"
          viewBox="0 0 100 49"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M92.8933 2.72147C88.8666 4.63151 83.4921 5.77586 79.3298 6.42376H4.05211L0 14.7286C19.4976 18.9358 39.7073 27.7119 51.1939 49C47.8623 37.119 34.214 19.8866 24.3635 14.9053L83.7973 17.1351L93.9699 6.42376C98.3442 1.84639 105.524 -3.26949 92.8933 2.72147Z"
            fill="white"
          />
        </svg>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center lg:text-start">
            <h2 className="mt-6  text-2xl lg:text-3xl font-extrabold text-[gray-900]">
              {token ? t("resetPassword") : t("forgotPassword")}
            </h2>
            <p className="mt-2  text-sm text-[#757575]">
              {token
                ? t("enterNewPassword") || "Enter your new password"
                : emailSent
                ? t("checkEmail") || "Check your email for reset instructions"
                : t("resetPasswordSubtitle") ||
                  "Enter your email to reset your password"}
            </p>
          </div>

          {token ? (
            // Reset password form (when token is present)
            <form
              className="mt-8 space-y-6"
              onSubmit={resetForm.handleSubmit(onResetPassword)}
            >
              <div className="space-y-4">
                <FormField>
                  <PasswordInput
                    label={t("password")}
                    autoComplete="new-password"
                    required
                    error={resetForm.formState.errors.password?.message}
                    {...resetForm.register("password")}
                  />
                </FormField>

                <FormField>
                  <PasswordInput
                    label={t("confirmPassword")}
                    autoComplete="new-password"
                    required
                    error={resetForm.formState.errors.confirmPassword?.message}
                    {...resetForm.register("confirmPassword")}
                  />
                </FormField>
              </div>

              <Button type="submit" className="w-full" loading={isResetLoading}>
                {t("resetPassword")}
              </Button>
            </form>
          ) : (
            // Request reset form (when no token)
            <form
              className="mt-8 space-y-6"
              onSubmit={requestForm.handleSubmit(onRequestReset)}
            >
              <div className="space-y-4">
                <FormField>
                  <Input
                    label={t("email")}
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={emailSent}
                    error={requestForm.formState.errors.email?.message}
                    {...requestForm.register("email")}
                  />
                </FormField>
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isRequestLoading}
                disabled={emailSent}
              >
                {emailSent
                  ? t("emailSent") || "Email Sent"
                  : t("sendResetEmail") || "Send Reset Email"}
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link
              to="/auth/sign-in"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {t("backToSignIn") || "Back to sign in"}
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Hero */}
      <div className="hidden   lg:block lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative">
        <img
          src={Animation}
          className="w-full h-screen object-center"
          alt="Decorative animation"
          width={800}
          height={900}
          loading="lazy"
        />
      </div>
    </div>
  );
}
