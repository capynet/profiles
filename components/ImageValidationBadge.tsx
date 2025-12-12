interface ImageValidationBadgeProps {
  requiresCrop: boolean;
  reason: string;
  canAutoCrop?: boolean;
}

export default function ImageValidationBadge({
  requiresCrop,
  reason,
  canAutoCrop
}: ImageValidationBadgeProps) {
  if (!requiresCrop) return null;

  return (
    <div
      className="absolute top-1 right-8 bg-yellow-500 dark:bg-yellow-600 text-white rounded-full p-1 z-10 shadow-md"
      title={reason}
      aria-label={reason}
    >
      <svg
        className="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
