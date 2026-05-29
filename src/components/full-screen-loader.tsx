export function FullScreenLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-label="Loading"
    >
      <div className="full-screen-loader" aria-hidden="true"></div>

      <style>{`
        .full-screen-loader {
          width: 55px;
          aspect-ratio: 1;
          --loader-primary: var(--primary);
          --loader-secondary: color-mix(in oklab, var(--foreground) 58%, var(--background));

          --g1: conic-gradient(
            from 90deg at 3px 3px,
            transparent 90deg,
            var(--loader-primary) 0
          );

          --g2: conic-gradient(
            from -90deg at 22px 22px,
            transparent 90deg,
            var(--loader-secondary) 0
          );

          background:
            var(--g1),
            var(--g1),
            var(--g1),
            var(--g2),
            var(--g2),
            var(--g2);

          background-size: 25px 25px;
          background-repeat: no-repeat;

          animation: full-screen-loader-motion 1.5s infinite;
        }

        @keyframes full-screen-loader-motion {
          0% {
            background-position:
              0 0,
              0 100%,
              100% 100%,
              0 0,
              0 100%,
              100% 100%;
          }

          25% {
            background-position:
              100% 0,
              0 100%,
              100% 100%,
              100% 0,
              0 100%,
              100% 100%;
          }

          50% {
            background-position:
              100% 0,
              0 0,
              100% 100%,
              100% 0,
              0 0,
              100% 100%;
          }

          75% {
            background-position:
              100% 0,
              0 0,
              0 100%,
              100% 0,
              0 0,
              0 100%;
          }

          100% {
            background-position:
              100% 100%,
              0 0,
              0 100%,
              100% 100%,
              0 0,
              0 100%;
          }
        }
      `}</style>
    </div>
  );
}
