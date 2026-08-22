export function LoadingLabel({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="loading-dot" />
        <span className="loading-dot [animation-delay:180ms]" />
        <span className="loading-dot [animation-delay:360ms]" />
      </span>
      {children}
    </span>
  );
}

