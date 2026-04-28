"use client";

/**
 * Greeting is a client component so that `new Date().getHours()` runs
 * in the user's browser — accurate for their local timezone regardless
 * of where the Vercel server is deployed (UTC).
 */
export function Greeting({ firstName }: { firstName: string | null }) {
  const hour = new Date().getHours();
  const timeOfDay =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <h1 className="text-2xl font-bold tracking-tight text-foreground">
      {firstName ? (
        <>
          {timeOfDay}, <span className="text-primary">{firstName}</span>
        </>
      ) : (
        timeOfDay
      )}
    </h1>
  );
}
