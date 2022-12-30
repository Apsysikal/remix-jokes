import { Link } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { useParams } from "@remix-run/react";
import { useCatch } from "@remix-run/react";
import { Form } from "@remix-run/react";

import { json } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import type { LoaderArgs } from "@remix-run/node";
import type { ActionArgs } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/node";

import { JokeDisplay } from "~/components/joke";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";
import { requireUserId } from "~/utils/session.server";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return {
      title: "No joke",
      description: "Joke not found",
    };
  }

  return {
    title: `${data.joke.name} joke`,
    description: `Enjoy the ${data.joke.name} joke and much more`,
  };
};

export const action = async ({ params, request }: ActionArgs) => {
  const form = await request.formData();

  const intent = String(form.get("intent"));

  if (intent !== "delete") {
    throw new Response(`The intent "${intent}" is not supported`, {
      status: 400,
    });
  }

  const userId = await requireUserId(request);

  const joke = await db.joke.findUnique({
    select: { jokesterId: true },
    where: { id: params.jokeId },
  });

  if (!joke) {
    throw new Response("That joke does not exist", { status: 404 });
  }

  if (joke.jokesterId !== userId) {
    throw new Response("You're not allowed to delete this", { status: 403 });
  }

  await db.joke.delete({ where: { id: params.jokeId } });

  return redirect("/jokes");
};

export const loader = async ({ params, request }: LoaderArgs) => {
  const userId = await getUserId(request);
  const joke = await db.joke.findUnique({
    select: { name: true, content: true, jokesterId: true },
    where: { id: params.jokeId },
  });

  if (!joke) {
    throw new Response("What a joke! Not found", {
      status: 404,
    });
  }

  const isOwner = userId === joke.jokesterId;

  return json({ joke, isOwner });
};

export const CatchBoundary = () => {
  const caught = useCatch();
  const { jokeId } = useParams();

  switch (caught.status) {
    case 400: {
      return (
        <div className="error-container">What you're trying is forbidden.</div>
      );
    }

    case 403: {
      return (
        <div className="error-container">
          Sorry, but "{jokeId}" is not your joke.
        </div>
      );
    }

    case 404: {
      return (
        <div className="error-container">Huh? What the heck is "{jokeId}"</div>
      );
    }

    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
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
  const { joke, isOwner } = useLoaderData<typeof loader>();

  return <JokeDisplay joke={joke} isOwner={isOwner} />;
}
