import { connection } from "next/server";

export async function GET() {
  await connection();

  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    "local-development";

  return Response.json(
    { version },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
