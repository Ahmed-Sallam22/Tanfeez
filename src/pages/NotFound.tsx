import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/app");
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4 rounded-lg">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Search/Lost Icon */}
        <div className="relative mb-8 inline-block">
          <div className="w-28 h-28 mx-auto relative">
            {/* Outer ring animation */}
            <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full animate-pulse" />
            <div className="absolute inset-2 border-2 border-amber-500/30 rounded-full" />

            {/* Search icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-14 h-14 text-amber-500"
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Question mark overlay */}
          <div className="absolute bottom-0 right-0 bg-amber-500 rounded-full p-1.5 shadow-lg shadow-amber-500/30">
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-3">
          <span className="text-7xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
            404
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
          {t("notFound.title", "Page Not Found")}
        </h1>

        {/* Description */}
        <p className="text-gray-500 text-base mb-6 leading-relaxed">
          {t(
            "notFound.description",
            "Oops! The page you're looking for doesn't exist or has been moved. Please check the URL or navigate back to the homepage."
          )}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
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
            {t("notFound.goBack", "Go Back")}
          </button>

          <button
            onClick={handleGoHome}
            className="group relative px-6 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white font-medium transition-all duration-300 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2"
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
            {t("notFound.goHome", "Go Home")}
          </button>
        </div>

        {/* Helpful suggestion */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-amber-700 text-sm">
            <span className="font-medium">{t("notFound.tip", "Tip:")}</span>{" "}
            {t(
              "notFound.tipDescription",
              "If you believe this is an error, try refreshing the page or contact support."
            )}
          </p>
        </div>

        {/* Support link */}
        <p className="mt-6 text-gray-400 text-sm">
          {t("notFound.needHelp", "Need help?")}{" "}
          <a
            href="mailto:support@tanfeez.com"
            className="text-amber-500 hover:text-amber-600 underline transition-colors"
          >
            {t("notFound.contactSupport", "Contact Support")}
          </a>
        </p>
      </div>
    </div>
  );
}
