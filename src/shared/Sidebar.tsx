// src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Tanfeez from "../assets/Tanfeezletter.png";
import { useLogout } from "../hooks/useLogout";
import { useUserRole } from "../features/auth/hooks";
import { useTranslation } from "react-i18next";
import { useGetUserProfileQuery } from "../api/auth.api";
import { useTheme } from "@/hooks/useTheme";

// Custom SVG Icons
const DashboardIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M1.66602 14.9993C1.66602 13.7157 1.66602 13.0738 1.95496 12.6023C2.11663 12.3385 2.33846 12.1166 2.60229 11.955C3.0738 11.666 3.71565 11.666 4.99935 11.666C6.28305 11.666 6.9249 11.666 7.3964 11.955C7.66024 12.1166 7.88206 12.3385 8.04374 12.6023C8.33268 13.0738 8.33268 13.7157 8.33268 14.9993C8.33268 16.283 8.33268 16.9249 8.04374 17.3964C7.88206 17.6602 7.66024 17.8821 7.3964 18.0437C6.9249 18.3327 6.28305 18.3327 4.99935 18.3327C3.71565 18.3327 3.0738 18.3327 2.60229 18.0437C2.33846 17.8821 2.11663 17.6602 1.95496 17.3964C1.66602 16.9249 1.66602 16.283 1.66602 14.9993Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M11.666 14.9993C11.666 13.7157 11.666 13.0738 11.955 12.6023C12.1166 12.3385 12.3385 12.1166 12.6023 11.955C13.0738 11.666 13.7157 11.666 14.9993 11.666C16.283 11.666 16.9249 11.666 17.3964 11.955C17.6602 12.1166 17.8821 12.3385 18.0437 12.6023C18.3327 13.0738 18.3327 13.7157 18.3327 14.9993C18.3327 16.283 18.3327 16.9249 18.0437 17.3964C17.8821 17.6602 17.6602 17.8821 17.3964 18.0437C16.9249 18.3327 16.283 18.3327 14.9993 18.3327C13.7157 18.3327 13.0738 18.3327 12.6023 18.0437C12.3385 17.8821 12.1166 17.6602 11.955 17.3964C11.666 16.9249 11.666 16.283 11.666 14.9993Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M1.66602 4.99935C1.66602 3.71565 1.66602 3.0738 1.95496 2.60229C2.11663 2.33846 2.33846 2.11663 2.60229 1.95496C3.0738 1.66602 3.71565 1.66602 4.99935 1.66602C6.28305 1.66602 6.9249 1.66602 7.3964 1.95496C7.66024 2.11663 7.88206 2.33846 8.04374 2.60229C8.33268 3.0738 8.33268 3.71565 8.33268 4.99935C8.33268 6.28305 8.33268 6.9249 8.04374 7.3964C7.88206 7.66024 7.66024 7.88206 7.3964 8.04374C6.9249 8.33268 6.28305 8.33268 4.99935 8.33268C3.71565 8.33268 3.0738 8.33268 2.60229 8.04374C2.33846 7.88206 2.11663 7.66024 1.95496 7.3964C1.66602 6.9249 1.66602 6.28305 1.66602 4.99935Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M11.666 4.99935C11.666 3.71565 11.666 3.0738 11.955 2.60229C12.1166 2.33846 12.3385 2.11663 12.6023 1.95496C13.0738 1.66602 13.7157 1.66602 14.9993 1.66602C16.283 1.66602 16.9249 1.66602 17.3964 1.95496C17.6602 2.11663 17.8821 2.33846 18.0437 2.60229C18.3327 3.0738 18.3327 3.71565 18.3327 4.99935C18.3327 6.28305 18.3327 6.9249 18.0437 7.3964C17.8821 7.66024 17.6602 7.88206 17.3964 8.04374C16.9249 8.33268 16.283 8.33268 14.9993 8.33268C13.7157 8.33268 13.0738 8.33268 12.6023 8.04374C12.3385 7.88206 12.1166 7.66024 11.955 7.3964C11.666 6.9249 11.666 6.28305 11.666 4.99935Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const ReportsIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M6.45768 7.49935C6.45768 7.15417 6.17786 6.87435 5.83268 6.87435C5.4875 6.87435 5.20768 7.15417 5.20768 7.49935V14.9993C5.20768 15.3445 5.4875 15.6243 5.83268 15.6243C6.17786 15.6243 6.45768 15.3445 6.45768 14.9993V7.49935Z"
      fill="currentColor"
    />
    <path
      d="M9.99935 4.37435C10.3445 4.37435 10.6243 4.65417 10.6243 4.99935V14.9993C10.6243 15.3445 10.3445 15.6243 9.99935 15.6243C9.65417 15.6243 9.37435 15.3445 9.37435 14.9993V4.99935C9.37435 4.65417 9.65417 4.37435 9.99935 4.37435Z"
      fill="currentColor"
    />
    <path
      d="M14.791 10.8327C14.791 10.4875 14.5112 10.2077 14.166 10.2077C13.8208 10.2077 13.541 10.4875 13.541 10.8327V14.9993C13.541 15.3445 13.8208 15.6243 14.166 15.6243C14.5112 15.6243 14.791 15.3445 14.791 14.9993V10.8327Z"
      fill="currentColor"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.95153 1.04102C8.02787 1.04101 6.52034 1.041 5.3441 1.19914C4.14016 1.361 3.19014 1.69879 2.44446 2.44446C1.69879 3.19014 1.361 4.14016 1.19914 5.3441C1.041 6.52034 1.04101 8.02787 1.04102 9.95153V10.0472C1.04101 11.9708 1.041 13.4784 1.19914 14.6546C1.361 15.8585 1.69879 16.8086 2.44446 17.5542C3.19014 18.2999 4.14016 18.6377 5.3441 18.7996C6.52034 18.9577 8.02788 18.9577 9.95154 18.9577H10.0472C11.9708 18.9577 13.4784 18.9577 14.6546 18.7996C15.8585 18.6377 16.8086 18.2999 17.5542 17.5542C18.2999 16.8086 18.6377 15.8585 18.7996 14.6546C18.9577 13.4784 18.9577 11.9708 18.9577 10.0472V9.95154C18.9577 8.02788 18.9577 6.52034 18.7996 5.3441C18.6377 4.14016 18.2999 3.19014 17.5542 2.44446C16.8086 1.69879 15.8585 1.361 14.6546 1.19914C13.4784 1.041 11.9708 1.04101 10.0472 1.04102H9.95153ZM3.32835 3.32835C3.80306 2.85363 4.44533 2.58122 5.51066 2.43799C6.59398 2.29234 8.0175 2.29102 9.99935 2.29102C11.9812 2.29102 13.4047 2.29234 14.488 2.43799C15.5534 2.58122 16.1956 2.85363 16.6704 3.32835C17.1451 3.80306 17.4175 4.44533 17.5607 5.51066C17.7064 6.59398 17.7077 8.0175 17.7077 9.99935C17.7077 11.9812 17.7064 13.4047 17.5607 14.488C17.4175 15.5534 17.1451 16.1956 16.6704 16.6704C16.1956 17.1451 15.5534 17.4175 14.488 17.5607C13.4047 17.7064 11.9812 17.7077 9.99935 17.7077C8.0175 17.7077 6.59398 17.7064 5.51066 17.5607C4.44533 17.4175 3.80306 17.1451 3.32835 16.6704C2.85363 16.1956 2.58122 15.5534 2.43799 14.488C2.29234 13.4047 2.29102 11.9812 2.29102 9.99935C2.29102 8.0175 2.29234 6.59398 2.43799 5.51066C2.58122 4.44533 2.85363 3.80306 3.32835 3.32835Z"
      fill="currentColor"
    />
  </svg>
);

// const DocumentIOIcon = ({ className }: { className?: string }) => (
//   <svg
//     width="20"
//     height="20"
//     viewBox="0 0 20 20"
//     fill="none"
//     xmlns="http://www.w3.org/2000/svg"
//     className={className}
//   >
//     <path
//       d="M12.8268 3.37739L12.4087 3.84195V3.84195L12.8268 3.37739ZM16.1258 6.34647L15.7077 6.81103L16.1258 6.34647ZM18.0443 8.4611L17.4734 8.71537V8.71537L18.0443 8.4611ZM2.64233 17.3564L3.08427 16.9144H3.08427L2.64233 17.3564ZM17.3564 17.3564L16.9144 16.9144L17.3564 17.3564ZM11.666 18.3327V17.7077H8.33268V18.3327V18.9577H11.666V18.3327ZM1.66602 11.666H2.29102V8.33268H1.66602H1.04102V11.666H1.66602ZM18.3327 11.3018H17.7077V11.666H18.3327H18.9577V11.3018H18.3327ZM12.8268 3.37739L12.4087 3.84195L15.7077 6.81103L16.1258 6.34647L16.5439 5.88191L13.2449 2.91283L12.8268 3.37739ZM18.3327 11.3018H18.9577C18.9577 9.8948 18.9703 9.00395 18.6153 8.20682L18.0443 8.4611L17.4734 8.71537C17.6951 9.21306 17.7077 9.78439 17.7077 11.3018H18.3327ZM16.1258 6.34647L15.7077 6.81103C16.8355 7.8261 17.2518 8.21768 17.4734 8.71537L18.0443 8.4611L18.6153 8.20682C18.2603 7.40969 17.5897 6.82312 16.5439 5.88191L16.1258 6.34647ZM8.35751 1.66602V2.29102C9.67567 2.29102 10.1731 2.30066 10.6165 2.47079L10.8404 1.88728L11.0643 1.30377C10.3544 1.03137 9.58101 1.04102 8.35751 1.04102V1.66602ZM12.8268 3.37739L13.2449 2.91283C12.3399 2.09833 11.7741 1.57614 11.0643 1.30377L10.8404 1.88728L10.6165 2.47079C11.0599 2.64096 11.4339 2.96465 12.4087 3.84195L12.8268 3.37739ZM8.33268 18.3327V17.7077C6.74366 17.7077 5.61478 17.7064 4.75839 17.5912C3.91998 17.4785 3.43694 17.2671 3.08427 16.9144L2.64233 17.3564L2.20038 17.7983C2.82402 18.4219 3.61481 18.6987 4.59183 18.8301C5.55087 18.959 6.779 18.9577 8.33268 18.9577V18.3327ZM1.66602 11.666H1.04102C1.04102 13.2197 1.03969 14.4478 1.16863 15.4069C1.29998 16.3839 1.57675 17.1747 2.20038 17.7983L2.64233 17.3564L3.08427 16.9144C2.73159 16.5618 2.5202 16.0787 2.40748 15.2403C2.29234 14.3839 2.29102 13.255 2.29102 11.666H1.66602ZM11.666 18.3327V18.9577C13.2197 18.9577 14.4478 18.959 15.4069 18.8301C16.3839 18.6987 17.1747 18.4219 17.7983 17.7983L17.3564 17.3564L16.9144 16.9144C16.5618 17.2671 16.0787 17.4785 15.2403 17.5912C14.3839 17.7064 13.255 17.7077 11.666 17.7077V18.3327ZM18.3327 11.666H17.7077C17.7077 13.255 17.7064 14.3839 17.5912 15.2403C17.4785 16.0787 17.2671 16.5618 16.9144 16.9144L17.3564 17.3564L17.7983 17.7983C18.4219 17.1747 18.6987 16.3839 18.8301 15.4069C18.959 14.4478 18.9577 13.2197 18.9577 11.666H18.3327ZM1.66602 8.33268H2.29102C2.29102 6.74366 2.29234 5.61478 2.40748 4.75839C2.5202 3.91998 2.73159 3.43694 3.08427 3.08427L2.64233 2.64233L2.20038 2.20038C1.57675 2.82402 1.29998 3.61481 1.16863 4.59183C1.03969 5.55087 1.04102 6.779 1.04102 8.33268H1.66602ZM8.35751 1.66602V1.04102C6.79549 1.04102 5.56136 1.0397 4.59841 1.16858C3.61795 1.2998 2.82451 1.57626 2.20038 2.20038L2.64233 2.64233L3.08427 3.08427C3.43646 2.73208 3.92098 2.52039 4.76422 2.40753C5.62497 2.29233 6.76027 2.29102 8.35751 2.29102V1.66602Z"
//       fill="currentColor"
//     />
//     <path
//       d="M10.834 2.08398V4.16732C10.834 6.1315 10.834 7.1136 11.4442 7.72379C12.0544 8.33398 13.0365 8.33398 15.0007 8.33398H18.334"
//       stroke="currentColor"
//       strokeWidth="1.25"
//     />
//     <path
//       d="M7.08333 15.4167L7.08333 11.25M7.08333 11.25L5.41667 12.8125M7.08333 11.25L8.75 12.8125"
//       stroke="currentColor"
//       strokeWidth="1.25"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     />
//   </svg>
// );

const TransferIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_7_183822)">
      <path
        d="M1.66602 9.99935C1.66602 6.07098 1.66602 4.10679 2.8864 2.8864C4.10679 1.66602 6.07098 1.66602 9.99935 1.66602C13.9277 1.66602 15.8919 1.66602 17.1123 2.8864C18.3327 4.10679 18.3327 6.07098 18.3327 9.99935C18.3327 13.9277 18.3327 15.8919 17.1123 17.1123C15.8919 18.3327 13.9277 18.3327 9.99935 18.3327C6.07098 18.3327 4.10679 18.3327 2.8864 17.1123C1.66602 15.8919 1.66602 13.9277 1.66602 9.99935Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M14.1673 8.33398H5.83398L8.69857 5.83398"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.83268 11.666L14.166 11.666L11.3014 14.166"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_7_183822">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const PendingTransferIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_7_183826)">
      <path
        d="M1.66602 9.99935C1.66602 6.07098 1.66602 4.10679 2.8864 2.8864C4.10679 1.66602 6.07098 1.66602 9.99935 1.66602C13.9277 1.66602 15.8919 1.66602 17.1123 2.8864C18.3327 4.10679 18.3327 6.07098 18.3327 9.99935C18.3327 13.9277 18.3327 15.8919 17.1123 17.1123C15.8919 18.3327 13.9277 18.3327 9.99935 18.3327C6.07098 18.3327 4.10679 18.3327 2.8864 17.1123C1.66602 15.8919 1.66602 13.9277 1.66602 9.99935Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.33398 5.83268L8.33398 14.166L5.83398 11.3014"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.668 14.1673L11.668 5.83398L14.168 8.69857"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.5" cy="2.5" r="2.5" fill="#757575" />
    </g>
    <defs>
      <clipPath id="clip0_7_183826">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const FundAdjustmentsIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_7_183841)">
      <path
        d="M1.66602 9.99935C1.66602 6.07098 1.66602 4.10679 2.8864 2.8864C4.10679 1.66602 6.07098 1.66602 9.99935 1.66602C13.9277 1.66602 15.8919 1.66602 17.1123 2.8864C18.3327 4.10679 18.3327 6.07098 18.3327 9.99935C18.3327 13.9277 18.3327 15.8919 17.1123 17.1123C15.8919 18.3327 13.9277 18.3327 9.99935 18.3327C6.07098 18.3327 4.10679 18.3327 2.8864 17.1123C1.66602 15.8919 1.66602 13.9277 1.66602 9.99935Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.33268 11.666C9.25316 11.666 9.99935 12.4122 9.99935 13.3327C9.99935 14.2532 9.25316 14.9993 8.33268 14.9993C7.41221 14.9993 6.66602 14.2532 6.66602 13.3327C6.66602 12.4122 7.41221 11.666 8.33268 11.666Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="1.66667"
        cy="1.66667"
        r="1.66667"
        transform="matrix(-4.37114e-08 -1 -1 4.37114e-08 13.334 8.33398)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M11.666 13.334L15.8327 13.334"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.33398 6.66602L4.16732 6.66602"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.16602 13.334L4.99935 13.334"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.834 6.66602L15.0007 6.66602"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_7_183841">
        <rect width="20" height="20" rx="5" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const FundRequestsIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_7_183845)">
      <path
        d="M7.5 12.5L12.5 7.5M12.5 7.5H8.75M12.5 7.5V11.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.66602 9.99935C1.66602 6.07098 1.66602 4.10679 2.8864 2.8864C4.10679 1.66602 6.07098 1.66602 9.99935 1.66602C13.9277 1.66602 15.8919 1.66602 17.1123 2.8864C18.3327 4.10679 18.3327 6.07098 18.3327 9.99935C18.3327 13.9277 18.3327 15.8919 17.1123 17.1123C15.8919 18.3327 13.9277 18.3327 9.99935 18.3327C6.07098 18.3327 4.10679 18.3327 2.8864 17.1123C1.66602 15.8919 1.66602 13.9277 1.66602 9.99935Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </g>
    <defs>
      <clipPath id="clip0_7_183845">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const PendingAdjustmentsIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_7_183849)">
      <path
        d="M1.66602 9.99935C1.66602 6.07098 1.66602 4.10679 2.8864 2.8864C4.10679 1.66602 6.07098 1.66602 9.99935 1.66602C13.9277 1.66602 15.8919 1.66602 17.1123 2.8864C18.3327 4.10679 18.3327 6.07098 18.3327 9.99935C18.3327 13.9277 18.3327 15.8919 17.1123 17.1123C15.8919 18.3327 13.9277 18.3327 9.99935 18.3327C6.07098 18.3327 4.10679 18.3327 2.8864 17.1123C1.66602 15.8919 1.66602 13.9277 1.66602 9.99935Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.33268 11.666C9.25316 11.666 9.99935 12.4122 9.99935 13.3327C9.99935 14.2532 9.25316 14.9993 8.33268 14.9993C7.41221 14.9993 6.66602 14.2532 6.66602 13.3327C6.66602 12.4122 7.41221 11.666 8.33268 11.666Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="1.66667"
        cy="1.66667"
        r="1.66667"
        transform="matrix(-4.37114e-08 -1 -1 4.37114e-08 13.334 8.33398)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M11.666 13.334L15.8327 13.334"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.33398 6.66602L4.16732 6.66602"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.16602 13.334L4.99935 13.334"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15.834 6.66602L15.0007 6.66602"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="17.5" cy="2.5" r="2.5" fill="#757575" />
    </g>
    <defs>
      <clipPath id="clip0_7_183849">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const AssumptionIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 2.5V4.16667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M10 15.8333V17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4.16667 10H2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M17.5 10H15.8333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle
      cx="10"
      cy="10"
      r="4.16667"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M5.83333 5.83333L4.58333 4.58333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M15.4167 15.4167L14.1667 14.1667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M14.1667 5.83333L15.4167 4.58333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4.58333 15.4167L5.83333 14.1667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
const PendingRequestsIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_7_183861)">
      <path
        d="M7.5 12.5L12.5 7.5M12.5 7.5H8.75M12.5 7.5V11.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1.66602 9.99935C1.66602 6.07098 1.66602 4.10679 2.8864 2.8864C4.10679 1.66602 6.07098 1.66602 9.99935 1.66602C13.9277 1.66602 15.8919 1.66602 17.1123 2.8864C18.3327 4.10679 18.3327 6.07098 18.3327 9.99935C18.3327 13.9277 18.3327 15.8919 17.1123 17.1123C15.8919 18.3327 13.9277 18.3327 9.99935 18.3327C6.07098 18.3327 4.10679 18.3327 2.8864 17.1123C1.66602 15.8919 1.66602 13.9277 1.66602 9.99935Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="17.5" cy="2.5" r="2.5" fill="#757575" />
    </g>
    <defs>
      <clipPath id="clip0_7_183861">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const UserManagementIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle
      cx="9.99935"
      cy="4.99935"
      r="3.33333"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.5"
      d="M15 7.50065C16.3807 7.50065 17.5 6.56791 17.5 5.41732C17.5 4.26672 16.3807 3.33398 15 3.33398"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.5"
      d="M5 7.50065C3.61929 7.50065 2.5 6.56791 2.5 5.41732C2.5 4.26672 3.61929 3.33398 5 3.33398"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <ellipse
      cx="10"
      cy="14.1673"
      rx="5"
      ry="3.33333"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.5"
      d="M16.666 15.8327C18.1279 15.5121 19.166 14.7002 19.166 13.7493C19.166 12.7985 18.1279 11.9866 16.666 11.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.5"
      d="M3.33398 15.8327C1.87211 15.5121 0.833984 14.7002 0.833984 13.7493C0.833984 12.7985 1.87211 11.9866 3.33398 11.666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const WorkflowIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M4.14837 8.07155C2.49347 7.40959 1.66602 7.07861 1.66602 6.66732C1.66602 6.25603 2.49347 5.92505 4.14837 5.26308L6.48876 4.32693C8.14367 3.66497 8.97112 3.33398 9.99935 3.33398C11.0276 3.33398 11.855 3.66497 13.5099 4.32693L15.8503 5.26308C17.5052 5.92505 18.3327 6.25603 18.3327 6.66732C18.3327 7.07861 17.5052 7.40959 15.8503 8.07155L13.5099 9.00771C11.855 9.66967 11.0276 10.0007 9.99935 10.0007C8.97112 10.0007 8.14367 9.66967 6.48876 9.00771L4.14837 8.07155Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M4.80446 8.33398L4.14837 8.59642C2.49347 9.25838 1.66602 9.58936 1.66602 10.0007C1.66602 10.4119 2.49347 10.7429 4.14837 11.4049L6.48876 12.341C8.14367 13.003 8.97112 13.334 9.99935 13.334C11.0276 13.334 11.855 13.003 13.5099 12.341L15.8503 11.4049C17.5052 10.7429 18.3327 10.4119 18.3327 10.0007C18.3327 9.58936 17.5052 9.25838 15.8503 8.59642L15.1942 8.33398"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M4.80446 11.666L4.14837 11.9284C2.49347 12.5904 1.66602 12.9214 1.66602 13.3327C1.66602 13.744 2.49347 14.075 4.14837 14.7369L6.48876 15.6731C8.14367 16.335 8.97112 16.666 9.99935 16.666C11.0276 16.666 11.855 16.335 13.5099 15.6731L15.8503 14.7369C17.5052 14.075 18.3327 13.744 18.3327 13.3327C18.3327 12.9214 17.5052 12.5904 15.8503 11.9284L15.1942 11.666"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M7.41602 6.29922C7.67435 3.29922 9.21602 2.07422 12.591 2.07422H12.6993C16.4243 2.07422 17.916 3.56589 17.916 7.29089V12.7242C17.916 16.4492 16.4243 17.9409 12.6993 17.9409H12.591C9.24102 17.9409 7.69935 16.7326 7.42435 13.7826"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.5009 10H3.01758"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.87565 7.20898L2.08398 10.0007L4.87565 12.7923"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SegmentConfigIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g clipPath="url(#clip0_13_224621)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.21 0.9C14.8386 0.27 15.7071 0 16.6557 0C17.6043 0 18.4714 0.27 19.1014 0.9C19.73 1.52857 20.0014 2.39571 20.0014 3.34429C20.0014 4.29286 19.73 5.16143 19.1014 5.79C18.4729 6.41857 17.6043 6.69 16.6557 6.69L16.4929 6.68714C15.9594 7.72241 15.6319 8.85138 15.5286 10.0114C15.679 10.1114 15.819 10.2262 15.9486 10.3557C16.5771 10.9857 16.8471 11.8529 16.8471 12.8029C16.8471 13.7514 16.5771 14.6186 15.9471 15.2486C15.3186 15.8771 14.4514 16.1471 13.5029 16.1471C12.5543 16.1471 11.6857 15.8771 11.0571 15.2471C10.4286 14.6186 10.1571 13.7514 10.1571 12.8029C10.1571 12.2886 10.2371 11.7971 10.41 11.3543C10.0087 10.9214 9.5552 10.5399 9.06 10.2186C9.0219 10.2614 8.98286 10.3033 8.94286 10.3443C8.31429 10.9729 7.44571 11.2443 6.49714 11.2443C6.19333 11.2443 5.90095 11.2157 5.62 11.1586C5.2327 11.929 5.00436 12.7695 4.94857 13.63C5.26 13.77 5.54095 13.9633 5.79143 14.21C6.42 14.8386 6.69 15.7057 6.69 16.6557C6.69 17.6043 6.41857 18.4714 5.79 19.1014C5.16143 19.73 4.29429 20 3.34429 20C2.39571 20 1.52857 19.73 0.898571 19.1C0.271429 18.4714 0 17.6057 0 16.6571C0 15.7086 0.27 14.84 0.9 14.2114C1.49143 13.6171 2.29714 13.3443 3.18143 13.3143C3.27282 12.2743 3.56333 11.2617 4.03714 10.3314C3.41714 9.70286 3.15143 8.84143 3.15143 7.9C3.15143 6.95143 3.42286 6.08286 4.05143 5.45429C4.68 4.82571 5.54857 4.55429 6.49714 4.55429C7.44571 4.55429 8.31286 4.82571 8.94286 5.45429C9.57143 6.08286 9.84286 6.95143 9.84286 7.9C9.84286 8.12952 9.82619 8.35333 9.79286 8.57143C10.4386 8.96571 11.0214 9.42143 11.55 9.96429C12.1086 9.61429 12.7814 9.45857 13.5029 9.45857C13.6 9.45857 13.6967 9.46143 13.7929 9.46714C13.9371 8.32143 14.25 7.25429 14.7414 6.20857C14.5484 6.09103 14.37 5.951 14.21 5.79143C13.5814 5.16286 13.31 4.29571 13.31 3.34571C13.31 2.39714 13.5814 1.53 14.21 0.9ZM12.1743 11.8014C12.2006 11.7678 12.2254 11.733 12.2486 11.6971L12.32 11.6171C12.5243 11.4129 12.8829 11.2414 13.5029 11.2414C14.1229 11.2414 14.4814 11.4129 14.6857 11.6171C14.89 11.8214 15.0614 12.18 15.0614 12.8014C15.0614 13.4229 14.89 13.78 14.6857 13.9843C14.4814 14.1886 14.1229 14.36 13.5029 14.36C12.8829 14.36 12.5243 14.1886 12.32 13.9843C12.1157 13.78 11.9429 13.4214 11.9429 12.8014C11.9429 12.3357 12.04 12.0186 12.1743 11.8014ZM1.78571 16.6571C1.78571 16.0357 1.95714 15.6771 2.16143 15.4729C2.36571 15.2686 2.72429 15.0971 3.34429 15.0971C3.96571 15.0971 4.32286 15.2686 4.52857 15.4729C4.73429 15.6771 4.90429 16.0357 4.90429 16.6571C4.90429 17.2786 4.73286 17.6357 4.52857 17.84C4.32429 18.0443 3.96571 18.2157 3.34429 18.2157C2.72286 18.2157 2.36571 18.0443 2.16143 17.84C1.95714 17.6357 1.78571 17.2771 1.78571 16.6571Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_13_224621">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const SecurityGroupsIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 1.66602L3.33333 4.16602V9.16602C3.33333 13.041 6.06667 16.6743 10 17.4993C13.9333 16.6743 16.6667 13.041 16.6667 9.16602V4.16602L10 1.66602Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 10.8327C11.3807 10.8327 12.5 9.71339 12.5 8.33268C12.5 6.95197 11.3807 5.83268 10 5.83268C8.61929 5.83268 7.5 6.95197 7.5 8.33268C7.5 9.71339 8.61929 10.8327 10 10.8327Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.25 14.166C6.75 13.3327 7.91667 12.916 10 12.916C12.0833 12.916 13.25 13.3327 13.75 14.166"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.66602 10.7327V9.26602C1.66602 8.39935 2.36602 7.69102 3.23935 7.69102C4.73935 7.69102 5.35768 6.61602 4.60768 5.29935C4.17435 4.54935 4.43268 3.57435 5.19102 3.14102L6.63268 2.32435C7.29935 1.93268 8.14935 2.16602 8.54102 2.83268L8.63268 2.98268C9.37435 4.29935 10.616 4.29935 11.366 2.98268L11.4577 2.83268C11.8493 2.16602 12.6993 1.93268 13.366 2.32435L14.8077 3.14102C15.566 3.57435 15.8243 4.54935 15.391 5.29935C14.641 6.61602 15.2593 7.69102 16.7593 7.69102C17.6243 7.69102 18.3327 8.39102 18.3327 9.26602V10.7327C18.3327 11.5993 17.6327 12.3077 16.7593 12.3077C15.2593 12.3077 14.641 13.3827 15.391 14.6993C15.8243 15.4577 15.566 16.4243 14.8077 16.8577L13.366 17.6743C12.6993 18.066 11.8493 17.8327 11.4577 17.166L11.366 17.016C10.6243 15.6993 9.38268 15.6993 8.63268 17.016L8.54102 17.166C8.14935 17.8327 7.29935 18.066 6.63268 17.6743L5.19102 16.8577C4.43268 16.4243 4.17435 15.4493 4.60768 14.6993C5.35768 13.3827 4.73935 12.3077 3.23935 12.3077C2.36602 12.3077 1.66602 11.5993 1.66602 10.7327Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  onToggle?: () => void; // desktop arrow toggler
  desktopHidden?: boolean; // controls arrow direction
};

const getSections = (
  userRole: string | null,
  userAbilities: string[],
  t: (key: string) => string,
) => {
  // Superadmin sees everything
  if (userRole === "superadmin") {
    return [
      {
        title: "",
        items: [
          {
            to: "/app",
            label: t("dashboard"),
            icon: DashboardIcon,
          },
          {
            to: "/app/reports",
            label: t("reports.title"),
            icon: ReportsIcon,
          },
          {
            to: "/app/analytical-report",
            label: t("analyticalReport.title"),
            icon: ReportsIcon,
          },
          {
            to: "/app/all-transfers",
            label: t("allTransfers.title"),
            icon: TransferIcon,
          },
        ],
      },
      {
        title: t("transfer.title"),
        items: [
          {
            to: "/app/transfer",
            label: t("transfer.title"),
            icon: TransferIcon,
          },
          {
            to: "/app/PendingTransfer",
            label: t("pendingTransfers.title"),
            icon: PendingTransferIcon,
          },
        ],
      },
      {
        title: t("reservations.title"),
        items: [
          {
            to: "/app/reservations",
            label: t("reservations.title"),
            icon: TransferIcon,
          },
          {
            to: "/app/pending-reservations",
            label: t("pendingReservations.title"),
            icon: PendingRequestsIcon,
          },
        ],
      },
      {
        title: t("fundRequests.title"),
        items: [
          {
            to: "/app/fund-requests",
            label: t("fundRequests.title"),
            icon: FundRequestsIcon,
          },
          {
            to: "/app/PendingRequests",
            label: t("pendingRequests.title"),
            icon: PendingRequestsIcon,
          },
        ],
      },
      {
        title: t("fundAdjustments.title"),
        items: [
          {
            to: "/app/FundAdjustments",
            label: t("fundAdjustments.title"),
            icon: FundAdjustmentsIcon,
          },
          {
            to: "/app/PendingAdjustments",
            label: t("pendingAdjustments.title"),
            icon: PendingAdjustmentsIcon,
          },
        ],
      },
      {
        title: t("workflow.title"),
        items: [
          {
            to: "/app/users",
            label: t("users.title"),
            icon: UserManagementIcon,
          },
          {
            to: "/app/WorkFlow",
            label: t("workflow.title"),
            icon: WorkflowIcon,
          },
          {
            to: "/app/Assumption",
            label: t("assumptions.title"),
            icon: AssumptionIcon,
          },
          {
            to: "/app/segment-configuration",
            label: t("segmentConfiguration.title"),
            icon: SegmentConfigIcon,
          },
          {
            to: "/app/security-groups",
            label: t("securityGroups.title"),
            icon: SecurityGroupsIcon,
          },
          {
            to: "/app/settings",
            label: t("settings.title"),
            icon: SettingsIcon,
          },
        ],
      },
      {
        title: t("navbar.notifications"),
        items: [
          {
            to: "/logout",
            label: t("logout"),
            icon: LogoutIcon,
          },
        ],
      },
    ];
  }

  // Regular users - based on abilities
  const sections: Array<{
    title: string;
    items: Array<{
      to: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }>;
  }> = [];

  // Dashboard - always visible
  const dashboardItems = [
    {
      to: "/app",
      label: t("dashboard"),
      icon: DashboardIcon,
    },
  ];

  // Add reports if user has REPORT ability
  const hasReport = userAbilities.includes("REPORT");
  if (hasReport) {
    dashboardItems.push(
      {
        to: "/app/reports",
        label: t("reports.title"),
        icon: ReportsIcon,
      },
      {
        to: "/app/analytical-report",
        label: t("analyticalReport.title"),
        icon: ReportsIcon,
      },
    );
  }

  // Add All Transfers if user is superadmin OR has REPORT/TRANSFER/APPROVE ability
  const hasAllTransfersAccess =
    userRole === "superadmin" ||
    userAbilities.includes("REPORT") ||
    userAbilities.includes("TRANSFER") ||
    userAbilities.includes("APPROVE");
  if (hasAllTransfersAccess) {
    dashboardItems.push({
      to: "/app/all-transfers",
      label: t("allTransfers.title"),
      icon: TransferIcon,
    });
  }

  sections.push({
    title: "",
    items: dashboardItems,
  });

  const hasTransfer = userAbilities.includes("TRANSFER");
  const hasApprove = userAbilities.includes("APPROVE");

  // Budget Transfers Section - combined creation and pending
  if (hasTransfer || hasApprove) {
    const transferItems = [];

    if (hasTransfer) {
      transferItems.push({
        to: "/app/transfer",
        label: t("transfer.title"),
        icon: TransferIcon,
      });
    }

    if (hasApprove) {
      transferItems.push({
        to: "/app/PendingTransfer",
        label: t("pendingTransfers.title"),
        icon: PendingTransferIcon,
      });
    }

    sections.push({
      title: t("transfer.title"),
      items: transferItems,
    });
  }

  // Reservations Section - combined creation and pending
  if (hasTransfer || hasApprove) {
    const reservationItems = [];

    if (hasTransfer) {
      reservationItems.push({
        to: "/app/reservations",
        label: t("reservations.title"),
        icon: TransferIcon,
      });
    }

    if (hasApprove) {
      reservationItems.push({
        to: "/app/pending-reservations",
        label: t("pendingReservations.title"),
        icon: PendingRequestsIcon,
      });
    }

    sections.push({
      title: t("reservations.title"),
      items: reservationItems,
    });
  }

  // Fund Requests Section - combined creation and pending
  if (hasTransfer || hasApprove) {
    const fundRequestItems = [];

    if (hasTransfer) {
      fundRequestItems.push({
        to: "/app/fund-requests",
        label: t("fundRequests.title"),
        icon: FundRequestsIcon,
      });
    }

    if (hasApprove) {
      fundRequestItems.push({
        to: "/app/PendingRequests",
        label: t("pendingRequests.title"),
        icon: PendingRequestsIcon,
      });
    }

    sections.push({
      title: t("fundRequests.title"),
      items: fundRequestItems,
    });
  }

  // Fund Adjustments Section - combined creation and pending
  if (hasTransfer || hasApprove) {
    const fundAdjustmentItems = [];

    if (hasTransfer) {
      fundAdjustmentItems.push({
        to: "/app/FundAdjustments",
        label: t("fundAdjustments.title"),
        icon: FundAdjustmentsIcon,
      });
    }

    if (hasApprove) {
      fundAdjustmentItems.push({
        to: "/app/PendingAdjustments",
        label: t("pendingAdjustments.title"),
        icon: PendingAdjustmentsIcon,
      });
    }

    sections.push({
      title: t("fundAdjustments.title"),
      items: fundAdjustmentItems,
    });
  }

  // Logout - always visible
  sections.push({
    title: t("navbar.notifications"),
    items: [
      {
        to: "/logout",
        label: t("logout"),
        icon: LogoutIcon,
      },
    ],
  });

  return sections.filter((section) => section.items.length > 0);
};

export default function Sidebar({
  onClose,
  onToggle,
  desktopHidden,
}: SidebarProps) {
  const { t } = useTranslation();
  const logout = useLogout();
  const userRole = useUserRole();

  // Fetch user profile to get abilities - skip if user is not authenticated
  const {
    data: userProfile,
    isError,
    isLoading,
  } = useGetUserProfileQuery(undefined, {
    skip: !userRole, // Only fetch if user has a role (is authenticated)
  });

  // Extract all abilities from user groups
  const userAbilities: string[] = userProfile?.groups
    ? userProfile.groups.flatMap((group) => group.abilities)
    : [];

  // If there's an error fetching profile, fallback to empty abilities
  const sections = getSections(
    userRole || null,
    isError || isLoading ? [] : userAbilities,
    t,
  );
    const { mainLogo } = useTheme();
  

  return (
    <aside className="w-full h-full bg-white rounded-2xl overflow-y-auto overflow-x-hidden flex flex-col">
      {/* Header */}
      <div className="relative flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 lg:border-none flex-shrink-0">
        <div className="flex items-start min-w-0 flex-1">
          <img
            src={mainLogo || Tanfeez}
            alt="Tanfeez"
            className="w-[70%] mx-auto max-w-[130px] sm:max-w-none"
            width={130}
            height={40}
          />
        </div>

        {/* Close (mobile) */}
        <button
          className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X
            className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600"
            aria-hidden="true"
          />
        </button>

        {/* Arrow (desktop) */}
        <button
          type="button"
          onClick={onToggle}
          className="hidden lg:flex absolute right-2 top-2 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Collapse/Expand sidebar"
          title="Collapse/Expand"
        >
          {desktopHidden ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 sm:px-4 flex-1 overflow-y-auto overflow-x-hidden">
        {sections.map((sec, i) => (
          <div key={i} className="sm:mb-1">
            {!desktopHidden && sec.title && (
              <div className="px-2 sm:px-3 pb-1 sm:pb-2 text-[11px] sm:text-[12px] font-medium tracking-wider text-[#AFAFAF] uppercase">
                {sec.title}
              </div>
            )}
            <ul className="space-y-0.5 sm:space-y-1">
              {sec.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  {to === "/logout" ? (
                    <button
                      onClick={() => {
                        logout();
                        onClose?.();
                      }}
                      className={`flex items-center ${
                        desktopHidden ? "justify-center" : "gap-2 sm:gap-3"
                      } px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-[13px] sm:text-[14px] font-medium transition-colors text-[#545454] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] w-full text-left`}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      {/* hide label when collapsed */}
                      {!desktopHidden && (
                        <span className="truncate min-w-0">{label}</span>
                      )}
                    </button>
                  ) : (
                    <NavLink
                      to={to}
                      className={({ isActive }) => {
                        let finalIsActive = false;

                        if (to === "/app") {
                          finalIsActive = window.location.pathname === "/app";
                        } else if (to === "/app/transfer") {
                          finalIsActive =
                            window.location.pathname === "/app/transfer" ||
                            window.location.pathname.startsWith(
                              "/app/transfer/",
                            );
                        } else if (to === "/app/reservations") {
                          finalIsActive =
                            window.location.pathname === "/app/reservations" ||
                            window.location.pathname.startsWith(
                              "/app/reservations/",
                            );
                        } else {
                          finalIsActive = isActive;
                        }

                        return `flex items-center ${
                          desktopHidden ? "justify-center" : "gap-2 sm:gap-3"
                        } px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-[13px] sm:text-[14px] font-medium transition-colors
                          ${
                            finalIsActive
                              ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-r-2 sm:border-r-4 border-[var(--color-primary)]"
                              : "text-[#545454] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
                          }`;
                      }}
                      onClick={onClose}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      {/* hide label when collapsed */}
                      {!desktopHidden && (
                        <span className="truncate min-w-0">{label}</span>
                      )}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
