import { useAuth, useCurrentUserAuthz } from "@/features/auth";
import type { AfastamentosAuthorization } from "../types/afastamentos.types";

export function useAfastamentosAuthorization(): AfastamentosAuthorization {
  const { session } = useAuth();
  const { data: authz } = useCurrentUserAuthz(Boolean(session));

  return {
    permissions: authz?.permissoes ?? [],
    profiles: authz?.perfis ?? [],
    allowedUnitIds: authz?.unidades ?? [],
  };
}
