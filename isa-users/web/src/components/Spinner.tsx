export function Spinner({ size = 40 }: { size?: number }) {
  return (
    <svg className="spinner" viewBox="22 22 44 44" width={size} height={size} role="progressbar">
      <circle cx="44" cy="44" r="20.2" fill="none" strokeWidth="3.6" />
    </svg>
  );
}
