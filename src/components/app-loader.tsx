export function AppLoader() {
  return (
    <div className="tannelli-loader" role="status" aria-label="Loading">
      <span className="tannelli-spinner" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
