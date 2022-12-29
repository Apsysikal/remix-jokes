import { createCookieSessionStorage } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { compare } from "bcryptjs";
import { hash } from "bcryptjs";

import { db } from "~/utils/db.server";

const SESSION_SECRET = String(process.env.SESSION_SECRET);

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set");
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "lax",
    secrets: [SESSION_SECRET],
    secure: process.env.NODE_ENV !== "development",
  },
});

export const login = async (username: string, password: string) => {
  const user = await db.user.findUnique({
    where: { username },
  });

  if (!user) return null;

  const passwordMatches = await compare(password, user.passwordHash);

  if (!passwordMatches) return null;

  return { id: user.id, username };
};

export const register = async (username: string, password: string) => {
  const hashedPassword = await hash(password, 10);

  const data = {
    username,
    passwordHash: hashedPassword,
  };

  const user = await db.user.create({ data });

  return { id: user.id, username };
};

export const createUserSession = async (userId: string, redirectTo: string) => {
  const session = await sessionStorage.getSession();

  session.set("userId", userId);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
};

export const getUserSession = async (request: Request) => {
  const cookieHeader = request.headers.get("Cookie");
  const session = await sessionStorage.getSession(cookieHeader);

  return session;
};

export const getUserId = async (request: Request) => {
  const session = await getUserSession(request);
  const userId = session.get("userId");

  if (!userId && typeof userId !== "string") return null;

  return String(userId);
};

export const requireUserId = async (
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) => {
  const userId = await getUserId(request);

  /**
   * User is not logged in yet.
   * Redirect them to the login page.
   * Set the redirect param, so they
   * get redirected there after logging in.
   */
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }

  return userId;
};

export const getUser = async (request: Request) => {
  const userId = await getUserId(request);

  if (!userId) return null;

  try {
    const user = db.user.findUnique({
      select: { id: true, username: true },
      where: { id: userId },
    });

    return user;
  } catch {
    // BAIL! BAIL!
    throw logout(request);
  }
};

export const logout = async (request: Request) => {
  const session = await getUserSession(request);

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
};
