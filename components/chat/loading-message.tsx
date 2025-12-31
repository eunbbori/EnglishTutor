export function LoadingMessage() {
  return (
    <div className="flex items-start gap-3 mb-4">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <svg
          className="w-5 h-5 text-primary-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Loading Content */}
      <div className="flex-1 bg-muted rounded-lg p-4 max-w-3xl">
        <div className="flex items-center gap-2">
          {/* Bouncing Dots Animation */}
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce"></div>
          </div>

          {/* Loading Text */}
          <span className="text-sm text-muted-foreground">
            답변을 생성하고 있습니다...
          </span>
        </div>
      </div>
    </div>
  );
}
