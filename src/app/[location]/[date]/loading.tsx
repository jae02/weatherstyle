export default function Loading() {
  return (
    <div className="container">
      {/* Page Header Skeleton */}
      <div className="page-header">
        <div
          className="skeleton"
          style={{
            width: "180px",
            height: "28px",
            borderRadius: "9999px",
            margin: "0 auto var(--space-lg)",
          }}
        />
        <div
          className="skeleton skeleton--title"
          style={{ margin: "0 auto var(--space-md)", width: "50%" }}
        />
        <div
          className="skeleton skeleton--text skeleton--text-medium"
          style={{ margin: "0 auto" }}
        />
      </div>

      {/* Dashboard Skeleton */}
      <div className="dashboard">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="skeleton skeleton--card"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>

      {/* Condition Banner Skeleton */}
      <div
        className="skeleton"
        style={{ height: "100px", borderRadius: "var(--radius-xl)", marginBottom: "var(--space-3xl)" }}
      />

      {/* Outfit Section Skeleton */}
      <div style={{ marginBottom: "var(--space-4xl)" }}>
        <div className="skeleton skeleton--title" />
        <div className="outfit-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                height: "220px",
                borderRadius: "var(--radius-xl)",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Article Skeleton */}
      <div
        className="skeleton"
        style={{
          height: "500px",
          borderRadius: "var(--radius-2xl)",
          marginBottom: "var(--space-4xl)",
        }}
      />
    </div>
  );
}
