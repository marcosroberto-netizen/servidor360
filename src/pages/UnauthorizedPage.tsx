import { useNavigate } from 'react-router-dom'
import { FeedbackDialog } from '@/shared/components/ui/FeedbackDialog'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <FeedbackDialog
      actionLabel="Voltar ao Portal"
      description="Você não tem permissão para acessar esta página."
      onClose={() => navigate('/portal')}
      open
      title="Acesso negado"
      variant="warning"
    />
  )
}
