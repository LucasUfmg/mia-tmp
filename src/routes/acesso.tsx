import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/acesso")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
