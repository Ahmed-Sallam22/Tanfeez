import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../features/auth/hooks";
import { hideSessionExpired, clearAuth } from "../features/auth/authSlice";
import SharedModal from "../shared/SharedModal";

export default function SessionExpiredModal() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const showModal = useAppSelector(
    (state) => state.auth.showSessionExpiredModal
  );

  const handleLogin = () => {
    dispatch(hideSessionExpired());
    dispatch(clearAuth());
    navigate("/auth/sign-in");
  };

  const handleClose = () => {
    dispatch(hideSessionExpired());
    dispatch(clearAuth());
    navigate("/auth/sign-in");
  };

  return (
    <SharedModal
      isOpen={showModal}
      onClose={handleClose}
      title={t("sessionExpired.title")}
      size="sm"
      showCloseButton={false}
    >
      <div className="p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("sessionExpired.heading")}
          </h3>
          <p className="text-gray-600 mb-6">{t("sessionExpired.message")}</p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleLogin}
            className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary)] transition-colors font-medium"
          >
            {t("sessionExpired.loginButton")}
          </button>
        </div>
      </div>
    </SharedModal>
  );
}
