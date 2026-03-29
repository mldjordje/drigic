export function isCronAuthorized(request) {
  const authHeader = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return (
    authHeader === `Bearer ${expectedSecret}` ||
    headerSecret === expectedSecret ||
    querySecret === expectedSecret
  );
}
