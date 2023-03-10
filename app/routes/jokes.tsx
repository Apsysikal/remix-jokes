import { Outlet } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";

import { json } from "@remix-run/node";

import type { LinksFunction } from "@remix-run/node";
import type { LoaderArgs } from "@remix-run/node";

import type { Joke } from "@prisma/client";

import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

import jokesCss from "~/styles/jokes.css";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: jokesCss,
    },
  ];
};

export const loader = async ({ request }: LoaderArgs) => {
  const jokes = await db.joke.findMany({
    take: 5,
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const user = await getUser(request);

  return json({
    jokes,
    user,
  });
};

export default function JokesRoute() {
  const { jokes, user } = useLoaderData<typeof loader>(); // Maybe needs validation

  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>
          {user ? (
            <div className="user-info">
              <span>{`Hi, ${user.username}`}</span>
              <form action="/logout" method="post">
                <button type="submit" className="button">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      <main className="jokes-main">
        <div className="container">
          <div className="jokes-list">
            <Link to=".">Get a random joke</Link>
            <p>Here are a few more jokes to check out:</p>
            <ul>
              {jokes.map(({ id, name }) => {
                return (
                  <li key={id}>
                    <Link to={`${id}`} prefetch="intent">
                      {name}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link to="new" className="button">
              Add your own
            </Link>
            <p>
              <Link to="/jokes.rss" reloadDocument>
                RSS Feed
              </Link>
            </p>
          </div>
          <div className="jokes-outlet">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
