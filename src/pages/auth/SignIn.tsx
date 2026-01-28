import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useLoginMutation } from "../../api/auth.api";
import { useAppDispatch } from "../../features/auth/hooks";
import { setCredentials } from "../../features/auth/authSlice";
import { useLocale } from "../../hooks/useLocale";
import { useTheme } from "../../hooks/useTheme";
import {
  Button,
  Input,
  PasswordInput,
  Checkbox,
  FormField,
} from "../../components/ui";
// Default fallbacks
import bgDesigneFallback from "../../assets/bgDesigne.jpg";
import LogoFallback from "../../assets/Tanfeezletter.png";

type LoginForm = {
  username: string;
  password: string;
  rememberMe?: boolean;
};

export default function SignIn() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { mainLogo, mainCover } = useTheme();

  // Use theme values or fallback to default assets
  const Logo = mainLogo || LogoFallback;
  const bgDesigne = mainCover || bgDesigneFallback;

  // Create schema with translated error messages
  const loginSchema = z.object({
    username: z.string().min(1, t("validation.usernameRequired")),
    password: z.string().min(1, t("validation.passwordRequired")),
    rememberMe: z.boolean().optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login({
        username: data.username,
        password: data.password,
      }).unwrap();

      dispatch(setCredentials(result));
      toast.success(result.message || t("signInSuccess"));

      // Get redirect locations in order of priority
      const storedRedirect = localStorage.getItem("postLoginRedirect");

      // If there's a stored redirect from logout, prioritize it over fromState
      let target;
      if (storedRedirect) {
        target = storedRedirect;
        localStorage.removeItem("postLoginRedirect");
      } else {
        // Default to app for fresh navigation
        target = "/app";
      }

      navigate(target, { replace: true });
    } catch {
      // Error is already handled by RTK Query and shown via toast
    }
  };

  const toggleLanguage = () => {
    setLocale(locale === "EN" ? "AR" : "EN");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Background Design Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgDesigne}
          alt="Background Design"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* Language Switcher Button */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Toggle language"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span>{locale === "EN" ? "العربية" : "English"}</span>
      </button>

      <div className="relative z-10 flex flex-col 2xl:h-auto h-[80vh]  w-full max-w-2xl items-center gap-8 py-20 justify-center rounded-3xl bg-white px-4 sm:px-6 lg:px-8">
        <img
          src={Logo}
          alt="Tanfeez Logo"
          className="2xl:h-40 h-25"
          width={160}
          height={160}
        />

        <div className=" w-[85%] mx-auto">
          <div className="text-center lg:text-start">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[gray-900]">
              {t("signIn")}
            </h2>
            <p className="mt-2  text-sm text-[#757575]">
              {t("signInSubtitle")}
            </p>
          </div>

          <form className="mt-8 space-y-6 " onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <FormField>
                <Input
                  label={t("username")}
                  type="text"
                  autoComplete="username"
                  placeholder={t("enterUsername")}
                  error={errors.username?.message}
                  {...register("username")}
                />
              </FormField>

              <FormField>
                <PasswordInput
                  label={t("password")}
                  autoComplete="current-password"
                  placeholder={t("enterPassword")}
                  error={errors.password?.message}
                  {...register("password")}
                />
              </FormField>

              <div className="flex  items-center flex-wrap gap-5 justify-between ">
                <Checkbox label={t("rememberMe")} {...register("rememberMe")} />
                {/* <Link
                  to="/auth/reset"
                  className='text-sm text-[#282828] font-semibold hover:text-blue-500'
                >
                  {t('forgotPassword')}
                </Link> */}
              </div>
            </div>

            <div className="lg:space-y-4 lg:py-6">
              <Button
                type="submit"
                className="w-full cursor-pointer"
                loading={isLoading}
              >
                {t("signIn")}
              </Button>
              {/*               
<DividerWithText>{t('or') || 'or'}</DividerWithText>

              <Button
                type="button"
                variant="secondary"
                className="w-full cursor-pointer"
                icon={<MicrosoftIcon />}
              >
                {t('signInWithMicrosoft')}
              </Button> */}
            </div>

            {/* <div className="text-start pb-4 ">
              <p className="text-sm text-[#282828]">
                {t('noAccount') || "Don't have an account?"}{' '}
                <Link
                  to="/auth/sign-up"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  {t('createAccount')}
                </Link>
              </p>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}
