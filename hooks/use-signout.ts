import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function useSignOut() {
  const router = useRouter();

  return async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };
}
