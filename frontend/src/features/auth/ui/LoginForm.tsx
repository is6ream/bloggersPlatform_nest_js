import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { HttpError } from '../../../shared/api/httpClient'
import { useAuth } from '../model/AuthContext'

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [loginOrEmail, setLoginOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = loginOrEmail.trim().length > 0 && password.trim().length > 0

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await login({ loginOrEmail: loginOrEmail.trim(), password })
      navigate('/home', { replace: true })
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        setError('Неверный логин/email или пароль.')
      } else {
        setError('Не удалось выполнить вход. Попробуй еще раз.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Логин или Email</span>
        <input
          type="text"
          value={loginOrEmail}
          onChange={(event) => setLoginOrEmail(event.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label className="field">
        <span>Пароль</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button className="primary-button" type="submit" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? 'Входим...' : 'Войти'}
      </button>
    </form>
  )
}
