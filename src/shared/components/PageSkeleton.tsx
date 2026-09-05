import { FeedbackDialog } from './ui/FeedbackDialog'

export function PageSkeleton() {
  return <FeedbackDialog open title="Carregando" description="Aguarde um instante." variant="loading" />
}
