"use server";

import { signIn, signOut } from "@/auth";

export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}

export async function signInWithX() {
  await signIn("twitter", { redirectTo: "/app" });
}
