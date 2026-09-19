import { AfastamentosView } from "../components/AfastamentosView";
import { useAfastamentosAuthorization } from "../hooks/useAfastamentosAuthorization";

export default function AfastamentosEducacaoPage() {
  const authorization = useAfastamentosAuthorization();

  return (
    <AfastamentosView
      scope="administrative"
      variant="educacao"
      authorization={authorization}
    />
  );
}
