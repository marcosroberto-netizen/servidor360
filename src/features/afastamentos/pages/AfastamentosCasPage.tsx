import { AfastamentosView } from "../components/AfastamentosView";
import { useAfastamentosAuthorization } from "../hooks/useAfastamentosAuthorization";

export default function AfastamentosCasPage() {
  const authorization = useAfastamentosAuthorization();

  return (
    <AfastamentosView
      scope="administrative"
      variant="cas"
      authorization={authorization}
    />
  );
}
