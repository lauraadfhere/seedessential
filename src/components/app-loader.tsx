export function AppLoader() {
  return (
    <div className="tannelli-loader" role="status" aria-label="Loading Tannelli">
      <span className="tannelli-loader-letter" aria-hidden="true"><span>T</span></span>
      <span className="sr-only">Loading</span>
    </div>
  );
}
