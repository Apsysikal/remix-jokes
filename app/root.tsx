import { Outlet } from "@remix-run/react";
import { Links } from "@remix-run/react";
import { Meta } from "@remix-run/react";
import { Scripts } from "@remix-run/react";
import { LiveReload } from "@remix-run/react";
import { useCatch } from "@remix-run/react";

import type { ReactNode } from "react";

import type { LinksFunction } from "@remix-run/node";
import type { MetaFunction } from "@remix-run/node";

import globalCss from "~/styles/global.css";
import globalMediumCss from "~/styles/global-medium.css";
import globalLargeCss from "~/styles/global-large.css";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: globalCss,
    },
    {
      rel: "stylesheet",
      href: globalMediumCss,
      media: "print, (min-width: 640px)",
    },
    {
      rel: "stylesheet",
      href: globalLargeCss,
      media: "screen and (min-width: 1024px)",
    },
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  description: "Learn Remix and laugh at the same time!",
  keywords: "Remix,jokes",
});

function Document({
  children,
  title = "Remix: So great, it's funny!",
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <html lang="en">
      <head>
        <Meta />
        <title>{title}</title>
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export const CatchBoundary = () => {
  const caught = useCatch();

  return (
    <Document>
      <div className="error-container">
        <h1>
          {caught.status} {caught.statusText}
        </h1>
      </div>
    </Document>
  );
};

export const ErrorBoundary = ({ error }: { error: Error }) => {
  return (
    <Document title="Uh-oh!">
      <div className="error-container">
        <h1>App Error</h1>
        <pre>{error.message}</pre>
      </div>
    </Document>
  );
};

export default function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  );
}
