// Moved to packages/domain/src/spam-paths.ts so the API and the new web app (apps/web/proxy.ts)
// share one definition of the foreign spam URLs that answer 410 Gone.
export { isSpamProductPath } from "../../../../packages/domain/src/spam-paths.ts";
