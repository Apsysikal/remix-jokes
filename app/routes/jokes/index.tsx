import { Link } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { useCatch } from "@remix-run/react";

import { json } from "@remix-run/node";

import { db } from "~/utils/db.server";

export const loader = async () => {
  const count = await db.joke.count();
  const randomJokeNumber = Math.floor(Math.random() * count);
  const [joke] = await db.joke.findMany({
    take: 1,
    skip: randomJokeNumber,
    select: { id: true, name: true, content: true },
  });

  if (!joke) {
    throw new Response("No jokes currently available.", { status: 404 });
  }

  return json({
    joke,
  });
};

export const CatchBoundary = () => {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className="error-container">There are no jokes to display.</div>
    );
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
};

export const ErrorBoundary = () => {
  return (
    <div className="error-container">
      Something unexpected went wrong. Sorry about that.
    </div>
  );
};

export default function JokesIndexRoute() {
  const { joke } = useLoaderData<typeof loader>();

  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{joke.content}</p>
      <Link to={joke.id}>{`${joke.name} Permalink`}</Link>
    </div>
  );
}
