const AUTH_ERROR_MESSAGES: Array<[string, string]> = [
  ['invalid login credentials', 'E-mail ou senha incorretos.'],
  ['email not confirmed', 'Confirme seu e-mail antes de acessar.'],
  ['user already registered', 'Este e-mail já está cadastrado.'],
  ['user not found', 'Usuário não encontrado.'],
  ['signup disabled', 'O cadastro de novos usuários está desativado.'],
  ['password should be at least', 'A senha deve atender ao tamanho mínimo exigido.'],
  ['new password should be different', 'A nova senha deve ser diferente da senha atual.'],
  ['same password', 'A nova senha deve ser diferente da senha atual.'],
  ['session not found', 'Sessão não encontrada. Acesse novamente para continuar.'],
  ['refresh token not found', 'Sua sessão expirou. Acesse novamente para continuar.'],
  ['invalid refresh token', 'Sua sessão expirou. Acesse novamente para continuar.'],
  ['expired', 'O link expirou. Solicite um novo link e tente novamente.'],
  ['otp expired', 'O link expirou. Solicite um novo link e tente novamente.'],
  ['token has expired', 'O link expirou. Solicite um novo link e tente novamente.'],
  ['rate limit', 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.'],
  ['too many requests', 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.'],
  ['network', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'],
  ['failed to fetch', 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'],
]

export function getAuthErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof Error)) return fallbackMessage

  if ('status' in error && error.status === 429) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.'
  }

  const normalizedMessage = error.message.toLowerCase()
  const translatedMessage = AUTH_ERROR_MESSAGES.find(([message]) =>
    normalizedMessage.includes(message)
  )?.[1]

  return translatedMessage ?? fallbackMessage
}
