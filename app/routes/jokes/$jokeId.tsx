import { Link } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { useParams } from "@remix-run/react";
import { useCatch } from "@remix-run/react";

import { json } from "@remix-run/node";

import type { LoaderArgs } from "@remix-run/node";

import type { Joke } from "@prisma/client";

import { db } from "~/utils/db.server";

export const loader = async ({ params }: LoaderArgs) => {
  const joke = await db.joke.findUnique({
    select: { name: true, content: true },
    where: { id: params.jokeId },
  });

  if (!joke) {
    throw new Response("What a joke! Not found", {
      status: 404,
    });
  }

  return json({ joke });
};

export const CatchBoundary = () => {
  const caught = useCatch();
  const { jokeId } = useParams();

  if (caught.status === 404) {
    return (
      <div className="error-container">Huh? What the heck is "{jokeId}"</div>
    );
  }

  throw new Error(`Unhandled error: ${caught.status}`);
};

export const ErrorBoundary = () => {
  const { jokeId } = useParams();

  return (
    <div className="error-container">
      {`There was an error loading the joke by the id ${jokeId}. Sorry.`}
    </div>
  );
};

export default function JokeRoute() {
  const { joke } = useLoaderData<typeof loader>();

  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{joke.content}</p>
      <Link to=".">{`${joke.name} Permalink`}</Link>
    </div>
  );
}
