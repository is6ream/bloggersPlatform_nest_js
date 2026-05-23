import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AUTH_IP_RESTRICTION_ENABLED } from '../config/auth-ip-restriction.config';

/**
 * Guard ограничения частоты запросов (IP restriction) только для маршрутов `/auth`.
 *
 * ## Зачем отдельный класс, а не `ThrottlerGuard` напрямую
 *
 * `ThrottlerGuard` из `@nestjs/throttler` всегда считает запросы и при превышении лимита
 * отвечает **429 Too Many Requests**. Нам нужен один переключатель для всего auth-модуля
 * (`AUTH_IP_RESTRICTION_ENABLED` в `auth-ip-restriction.config.ts`), без дублирования
 * `@UseGuards` / override в каждом тесте. Этот guard — тонкая обёртка: при выключенном
 * флаге запрос проходит сразу; при включённом — работает стандартная логика throttler.
 *
 * ## Где подключается
 *
 * Один раз на уровне контроллера:
 * `@UseGuards(AuthIpRestrictionGuard)` на `AuthController`.
 * Nest вызывает guard **до** входа в метод handler.
 *
 * ## Что делает родительский `ThrottlerGuard` (через `super.canActivate`)
 *
 * 1. Берёт IP клиента через `getTracker` из `ThrottlerModule.forRoot`
 *    (у нас — `getClientIpFromRequest` в конфиге).
 * 2. Смотрит метаданные маршрута:
 *    - `@SkipThrottle()` — не считать запрос (refresh, logout, me).
 *    - `@Throttle(...)` — свой лимит (например `new-password`: 5 запросов / 60 с).
 *    - без декоратора — лимит по умолчанию из `AUTH_IP_RESTRICTION_LIMITS.default`
 *      (5 запросов / 10 с).
 * 3. Увеличивает счётчик для пары «IP + правило» в хранилище throttler.
 * 4. Если лимит исчерпан в окне TTL — бросает исключение → клиент получает **429**.
 *
 * ## Включение и отключение
 *
 * Меняется **только** константа `AUTH_IP_RESTRICTION_ENABLED` в
 * `../config/auth-ip-restriction.config.ts`. Guard читает её при старте приложения
 * (значение фиксируется на момент импорта модуля).
 *
 * ## Порядок с другими guards на одном маршруте
 *
 * Guards на методе (`LocalAuthValidationGuard`, `RefreshTokenGuard`, …) выполняются
 * вместе с guard контроллера; порядок зависит от порядка в `@UseGuards`.
 * Throttling срабатывает на уровне HTTP-запроса до бизнес-логики handler.
 *
 * @see {@link AUTH_IP_RESTRICTION_ENABLED}
 * @see {@link authIpRestrictionThrottlerOptions}
 * @see AuthController
 */
@Injectable()
export class AuthIpRestrictionGuard extends ThrottlerGuard {
  /**
   * Решает, пускать ли запрос к handler.
   *
   * @param context — контекст Nest: HTTP-запрос, handler, метаданные (`@SkipThrottle`, `@Throttle`).
   * @returns `true` — запрос разрешён; при превышении лимита родитель бросает исключение (429), не `false`.
   *
   * @example
   * // AUTH_IP_RESTRICTION_ENABLED === false
   * // → любой POST /auth/registration проходит без подсчёта, 429 не будет.
   *
   * @example
   * // AUTH_IP_RESTRICTION_ENABLED === true, 6-й POST /auth/registration за 10 с с одного IP
   * // → super.canActivate бросает ThrottlerException → 429.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!AUTH_IP_RESTRICTION_ENABLED) {
      return true;
    }

    return super.canActivate(context);
  }
}
