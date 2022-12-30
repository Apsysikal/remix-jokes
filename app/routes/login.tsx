import { Link } from "@remix-run/react";
import { useSearchParams } from "@remix-run/react";
import { useActionData } from "@remix-run/react";
import { Form } from "@remix-run/react";

import type { ActionArgs } from "@remix-run/node";
import type { LinksFunction } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/node";

import { db } from "~/utils/db.server";
import { badRequest } from "~/utils/request.server";
import { login } from "~/utils/session.server";
import { register } from "~/utils/session.server";
import { createUserSession } from "~/utils/session.server";

import loginCss from "~/styles/login.css";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: loginCss,
    },
  ];
};

export const meta: MetaFunction = () => ({
  title: "Remix Jokes | Login",
  description: "Login to submit your own jokes to Remix Jokes!",
});

function validateUsername(username: string) {
  if (username.length < 4) {
    return "That username is too short";
  }
}

function validatePassword(password: string) {
  if (password.length < 6) {
    return "That password is too short";
  }
}

function validateRedirectUrl(url: string) {
  const allowedUrls = ["/", "/jokes", "/jokes/new"];

  if (allowedUrls.includes(url)) {
    return url;
  }

  return "/jokes";
}

export const action = async ({ request }: ActionArgs) => {
  const body = await request.formData();

  const loginType = String(body.get("loginType"));
  const username = String(body.get("username"));
  const password = String(body.get("password"));
  const redirectTo = validateRedirectUrl(String(body.get("redirectTo")));

  if (!loginType || !username || !password || !redirectTo) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: "Bad form submission",
    });
  }

  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };

  const fields = {
    loginType,
    username,
    password,
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({
      fieldErrors,
      fields,
      formError: null,
    });
  }

  switch (loginType) {
    case "login": {
      const user = await login(username, password);

      if (!user) {
        return badRequest({
          fieldErrors,
          fields,
          formError: "Username or Password is incorrect",
        });
      }

      return createUserSession(user.id, redirectTo);
    }

    case "register": {
      const existingUser = await db.user.findFirst({ where: { username } });

      if (existingUser) {
        return badRequest({
          fieldErrors,
          fields,
          formError: "Username is already in use",
        });
      }

      const newUser = await register(username, password);

      if (!newUser) {
        return badRequest({
          fieldErrors,
          fields,
          formError: "Something went wrong trying to create the user",
        });
      }

      return createUserSession(newUser.id, redirectTo);
    }

    default: {
      return badRequest({
        fieldErrors,
        fields,
        formError: "Invalid Login type",
      });
    }
  }
};

export default function LoginRoute() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();

  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <Form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? undefined}
          />
          <fieldset>
            <legend className="sr-only">Login or Register?</legend>
            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === "login"
                }
              />{" "}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={actionData?.fields?.loginType === "register"}
              />{" "}
              Register
            </label>
          </fieldset>
          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              defaultValue={actionData?.fields?.username}
              aria-invalid={Boolean(actionData?.fieldErrors?.username)}
              aria-errormessage={
                actionData?.fieldErrors?.username ? "username-error" : undefined
              }
            />
            {actionData?.fieldErrors?.username && (
              <p
                className="form-validation-error"
                role="alert"
                id="username-error"
              >
                {actionData.fieldErrors.username}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              type="password"
              defaultValue={actionData?.fields?.password}
              aria-invalid={Boolean(actionData?.fieldErrors?.password)}
              aria-errormessage={
                actionData?.fieldErrors?.password ? "password-error" : undefined
              }
            />
            {actionData?.fieldErrors?.password && (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {actionData.fieldErrors.password}
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
            Submit
          </button>
        </Form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
