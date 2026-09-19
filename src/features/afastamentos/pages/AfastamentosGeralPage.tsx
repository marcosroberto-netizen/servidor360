import { AfastamentosView } from "../components/AfastamentosView";
import { useAfastamentosAuthorization } from "../hooks/useAfastamentosAuthorization";

export default function AfastamentosGeralPage() {
  const authorization = useAfastamentosAuthorization();

  return (
    <AfastamentosView
      scope="operational"
      variant="geral"
      authorization={authorization}
    />
  );
}
