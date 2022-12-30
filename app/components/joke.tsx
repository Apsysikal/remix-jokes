import type { Joke } from "@prisma/client";
import { Form, Link } from "@remix-run/react";

export function JokeDisplay({
  canDelete = true,
  isOwner,
  joke,
}: {
  canDelete?: boolean;
  isOwner: boolean;
  joke: Pick<Joke, "content" | "name">;
}) {
  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{joke.content}</p>
      <Link to=".">{joke.name} Permalink</Link>
      {isOwner && (
        <Form method="post">
          <button
            type="submit"
            name="intent"
            value="delete"
            disabled={!canDelete}
            className="button"
          >
            Delete
          </button>
        </Form>
      )}
    </div>
  );
}
