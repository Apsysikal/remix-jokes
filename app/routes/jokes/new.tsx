import { Link } from "@remix-run/react";
import { useActionData } from "@remix-run/react";
import { useCatch } from "@remix-run/react";
import { useTransition } from "@remix-run/react";
import { Form } from "@remix-run/react";

import { json, redirect } from "@remix-run/node";

import type { LoaderArgs } from "@remix-run/node";
import type { ActionArgs } from "@remix-run/node";

import { JokeDisplay } from "~/components/joke";

import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { getUserId } from "~/utils/session.server";
import { requireUserId } from "~/utils/session.server";

function validateJokeName(name: string) {
  if (name.length < 3) {
    return "That joke name is too short";
  }
}

function validateJokeContent(content: string) {
  if (content.length < 10) {
    return "That joke is too short";
  }
}

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return json({});
};

export const action = async ({ request }: ActionArgs) => {
  const userId = await requireUserId(request);
  const body = await request.formData();

  const name = String(body.get("name"));
  const content = String(body.get("content"));

  if (!name || !content) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: "Bad form submission",
    });
  }

  const fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content),
  };

  const fields = {
    name,
    content,
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
      formError: null,
    });
  }

  const joke = await db.joke.create({
    data: { jokesterId: userId, ...fields },
  });

  return redirect(`/jokes/${joke.id}`);
};

export const CatchBoundary = () => {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a joke.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }
};

export const ErrorBoundary = () => {
  return (
    <div className="error-contaienr">
      Something unexpected went wrong. Sorry about that.
    </div>
  );
};

export default function JokesNewRoute() {
  const actionData = useActionData<typeof action>();
  const transition = useTransition();

  if (transition.submission) {
    const name = String(transition.submission.formData.get("name"));
    const content = String(transition.submission.formData.get("content"));

    if (
      !name ||
      !content ||
      !validateJokeName(name) ||
      !validateJokeContent(content)
    ) {
      return (
        <JokeDisplay
          joke={{ name, content }}
          isOwner={true}
          canDelete={false}
        />
      );
    }
  }

  return (
    <>
      <p>Add your own hilarious joke!</p>
      <Form method="post">
        <div>
          <label htmlFor="name">
            Name:{" "}
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={actionData?.fields?.name}
              aria-invalid={Boolean(actionData?.fieldErrors?.name)}
              aria-errormessage={
                actionData?.fieldErrors?.name ? "name-error" : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.name && (
            <p className="form-validation-error" role="alert" id="name-error">
              {actionData.fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="content">
            Content:{" "}
            <textarea
              name="content"
              id="content"
              defaultValue={actionData?.fields?.content}
              aria-invalid={
                Boolean(actionData?.fieldErrors?.content) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.content ? "content-error" : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.content && (
            <p
              className="form-validation-error"
              role="alert"
              id="content-error"
            >
              {actionData.fieldErrors.content}
            </p>
          )}
        </div>
        <div className="form-error-message">
          {actionData?.formError && (
            <p className="form-validation-error" role="alert">
              {actionData.formError}
            </p>
          )}
        </div>
        <button type="submit" className="button">
          Add
        </button>
      </Form>
    </>
  );
}
