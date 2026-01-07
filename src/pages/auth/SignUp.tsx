import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useRegisterMutation } from "../../api/auth.api";
import {
  Button,
  Input,
  PasswordInput,
  Checkbox,
  FormField,
} from "../../components/ui";
import Animation from "../../assets/Animation.png";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    EmailUpdate: z
      .boolean()
      .refine((val) => val === true, "You must accept the email updates"),
    terms: z
      .boolean()
      .refine((val) => val === true, "You must accept the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpForm) => {
    try {
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
      }).unwrap();

      toast.success(t("signUpSuccess") || "Account created successfully!");
      navigate("/auth/sign-in");
    } catch {
      // Error is already handled by RTK Query and shown via toast
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
              {t("signUp")}
            </h2>
            <p className="mt-2  text-sm text-[#757575]">
              {t("signUpSubtitle") || "Create your account"}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <FormField>
                <Input
                  label={t("Full name")}
                  type="text"
                  placeholder="Name"
                  autoComplete="name"
                  error={errors.name?.message}
                  {...registerField("name")}
                />
              </FormField>

              <FormField>
                <Input
                  label={t("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  error={errors.email?.message}
                  {...registerField("email")}
                />
              </FormField>

              <FormField>
                <PasswordInput
                  label={t("password")}
                  autoComplete="new-password"
                  placeholder="Password"
                  error={errors.password?.message}
                  {...registerField("password")}
                />
              </FormField>

              <FormField>
                <div className="space-y-2 flex flex-col gap-3 py-4">
                  <Checkbox
                    label={t("EmailUpdate")}
                    error={errors.terms?.message}
                    {...registerField("EmailUpdate")}
                  />
                  <Checkbox
                    label={t("terms")}
                    error={errors.terms?.message}
                    {...registerField("terms")}
                  />
                </div>
              </FormField>
            </div>

            <div className="space-y-4">
              <Button type="submit" className="w-full" loading={isLoading}>
                {t("signUp")}
              </Button>
            </div>

            <div className="text-start pb-4">
              <p className="text-sm text-gray-600">
                {t("haveAccount") || "Already have an account?"}{" "}
                <Link
                  to="/auth/sign-in"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {t("signIn")}
                </Link>
              </p>
            </div>
          </form>
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
