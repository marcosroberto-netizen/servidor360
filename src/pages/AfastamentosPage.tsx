import { useAuth, useCurrentUserAuthz } from "@/features/auth";
import { AfastamentosPage as AfastamentosFeaturePage } from "@/features/afastamentos";

export default function AfastamentosPage() {
  const { session } = useAuth();
  const { data: authz } = useCurrentUserAuthz(Boolean(session));

  return (
    <AfastamentosFeaturePage
      authorization={{
        permissions: authz?.permissoes ?? [],
        profiles: authz?.perfis ?? [],
        allowedUnitIds: authz?.unidades ?? [],
      }}
    />
  );
}
