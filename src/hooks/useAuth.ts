import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(_options?: UseAuthOptions) {
  const user = {
    id: 1,
    unionId: "mock-user-id",
    name: "Cat Lover",
    email: "catlover@example.com",
    avatar: "",
    role: "admin" as const,
  };

  const logout = useCallback(() => {
    console.log("Mock logout");
  }, []);

  return useMemo(
    () => ({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout,
      refresh: async () => {},
    }),
    [logout],
  );
}
