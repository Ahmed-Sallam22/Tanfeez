import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Get the custom error message from sessionStorage
    const storedMessage = sessionStorage.getItem("accessDeniedMessage");
    if (storedMessage) {
      setErrorMessage(storedMessage);
      // Clear it so it doesn't persist
      sessionStorage.removeItem("accessDeniedMessage");
    }
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/app");
  };

  return (
    <div className="min-h-[calc(100vh-120px)]  flex items-center justify-center p-4 rounded-lg">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#4E8476]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Lock Icon with Shield */}
        <div className="relative mb-8 inline-block">
          <div className="w-28 h-28 mx-auto relative">
            {/* Outer ring animation */}
            <div className="absolute inset-0 border-4 border-[#4E8476]/20 rounded-full animate-pulse" />
            <div className="absolute inset-2 border-2 border-[#4E8476]/30 rounded-full" />

            {/* Shield icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-14 h-14 text-[#4E8476]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* X mark overlay */}
          <div className="absolute bottom-0 right-0 bg-[#4E8476] rounded-full p-1.5 shadow-lg shadow-[#4E8476]/30">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-3">
          <span className="text-7xl font-bold bg-gradient-to-r from-[#4E8476] via-teal-500 to-[#3d6b5f] bg-clip-text text-transparent">
            403
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
          {t("accessDenied.title", "Access Denied")}
        </h1>

        {/* Description */}
        <p className="text-gray-500 text-base mb-6 leading-relaxed">
          {errorMessage ||
            t(
              "accessDenied.description",
              "Sorry, you don't have permission to access this page. Please contact your administrator if you believe this is an error."
            )}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
          <div className="w-2 h-2 bg-[#4E8476] rounded-full" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoBack}
            className="group relative px-6 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 rounded-lg text-gray-700 font-medium transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t("accessDenied.goBack", "Go Back")}
          </button>

          <button
            onClick={handleGoHome}
            className="group relative px-6 py-2.5 bg-[#4E8476] hover:bg-[#3d6b5f] rounded-lg text-white font-medium transition-all duration-300 shadow-md shadow-[#4E8476]/20 hover:shadow-[#4E8476]/30 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {t("accessDenied.goHome", "Go Home")}
          </button>
        </div>

        {/* Support link */}
        <p className="mt-6 text-gray-400 text-sm">
          {t("accessDenied.needHelp", "Need help?")}{" "}
          <a
            href="mailto:support@tanfeez.com"
            className="text-[#4E8476] hover:text-[#3d6b5f] underline transition-colors"
          >
            {t("accessDenied.contactSupport", "Contact Support")}
          </a>
        </p>
      </div>
    </div>
  );
}
