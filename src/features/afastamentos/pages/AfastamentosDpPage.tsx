import { AfastamentosView } from "../components/AfastamentosView";
import { useAfastamentosAuthorization } from "../hooks/useAfastamentosAuthorization";

export default function AfastamentosDpPage() {
  const authorization = useAfastamentosAuthorization();

  return (
    <AfastamentosView
      scope="administrative"
      variant="dp"
      authorization={authorization}
    />
  );
}
