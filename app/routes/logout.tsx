import { redirect } from "@remix-run/node";

import type { ActionArgs } from "@remix-run/node";

import { logout } from "~/utils/session.server";

export const action = async ({ request }: ActionArgs) => {
  return logout(request);
};

export const Loader = async () => {
  return redirect("/");
};
