# ПР5: результати перевірки

Звіт отримано скриптом `node scripts/verify-pr5.mjs` після `npm run build`. Усі запити виконано на порту 3000. Перед ручною перевіркою запустіть npm run dev в окремому терміналі. Перед автоматичною перевіркою зупиніть свій сервер: скрипт сам послідовно запускає два тестові процеси на порту 3000 і завершує їх.

## 1. Правильне створення

```powershell
'{"title":"Node.js Workshop","date":"2026-11-15","isOnline":true}' | curl.exe -i -X POST "http://localhost:3000/api/events" -H "Content-Type: application/json" --data-binary '@-'
```

HTTP status: **201**; X-Request-Id: `c818c0a4-8d53-4967-84dc-c1b3ff23cdca`; Content-Type: `application/json; charset=utf-8`.

```json
{
  "id": 2,
  "title": "Node.js Workshop",
  "date": "2026-11-15",
  "isOnline": true
}
```

## 2. Закоротка назва

```powershell
'{"title":"JS","date":"2026-11-15","isOnline":true}' | curl.exe -i -X POST "http://localhost:3000/api/events" -H "Content-Type: application/json" --data-binary '@-'
```

HTTP status: **400**; X-Request-Id: `8116599f-a7cc-4d60-9a80-c98bbb953bcc`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/validation-error",
  "title": "Request validation failed",
  "status": 400,
  "detail": "One or more request fields are invalid",
  "instance": "/api/events",
  "code": "VALIDATION_ERROR",
  "requestId": "8116599f-a7cc-4d60-9a80-c98bbb953bcc",
  "errors": [
    {
      "field": "title",
      "message": "Title must contain at least 3 characters"
    }
  ]
}
```

## 3. Неправильна дата

```powershell
'{"title":"Node.js Workshop","date":"15.11.2026","isOnline":true}' | curl.exe -i -X POST "http://localhost:3000/api/events" -H "Content-Type: application/json" --data-binary '@-'
```

HTTP status: **400**; X-Request-Id: `cf26bd7f-0f2d-4369-bc04-99974551edf6`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/validation-error",
  "title": "Request validation failed",
  "status": 400,
  "detail": "One or more request fields are invalid",
  "instance": "/api/events",
  "code": "VALIDATION_ERROR",
  "requestId": "cf26bd7f-0f2d-4369-bc04-99974551edf6",
  "errors": [
    {
      "field": "date",
      "message": "Date must use YYYY-MM-DD format"
    }
  ]
}
```

## 4. Невідоме поле

```powershell
'{"title":"Node.js Workshop","date":"2026-11-15","isOnline":true,"price":500}' | curl.exe -i -X POST "http://localhost:3000/api/events" -H "Content-Type: application/json" --data-binary '@-'
```

HTTP status: **400**; X-Request-Id: `7575cf7e-fc33-4498-9e22-71d22ab6d200`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/validation-error",
  "title": "Request validation failed",
  "status": 400,
  "detail": "One or more request fields are invalid",
  "instance": "/api/events",
  "code": "VALIDATION_ERROR",
  "requestId": "7575cf7e-fc33-4498-9e22-71d22ab6d200",
  "errors": [
    {
      "field": "body",
      "message": "Unrecognized key: \"price\""
    }
  ]
}
```

## 5. Неправильний тип

```powershell
'{"title":"Node.js Workshop","date":"2026-11-15","isOnline":"yes"}' | curl.exe -i -X POST "http://localhost:3000/api/events" -H "Content-Type: application/json" --data-binary '@-'
```

HTTP status: **400**; X-Request-Id: `170d2e9f-2d56-41a3-a701-7f4f67e4bfe4`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/validation-error",
  "title": "Request validation failed",
  "status": 400,
  "detail": "One or more request fields are invalid",
  "instance": "/api/events",
  "code": "VALIDATION_ERROR",
  "requestId": "170d2e9f-2d56-41a3-a701-7f4f67e4bfe4",
  "errors": [
    {
      "field": "isOnline",
      "message": "Invalid input: expected boolean, received string"
    }
  ]
}
```

## 6. Порожній PATCH

```powershell
'{}' | curl.exe -i -X PATCH "http://localhost:3000/api/events/1" -H "Content-Type: application/json" --data-binary '@-'
```

HTTP status: **400**; X-Request-Id: `8a0eb85f-e938-4d07-863f-8218b3c653ed`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/validation-error",
  "title": "Request validation failed",
  "status": 400,
  "detail": "One or more request fields are invalid",
  "instance": "/api/events/1",
  "code": "VALIDATION_ERROR",
  "requestId": "8a0eb85f-e938-4d07-863f-8218b3c653ed",
  "errors": [
    {
      "field": "body",
      "message": "At least one field must be provided"
    }
  ]
}
```

## 7. Неправильний id

```powershell
curl.exe -i -X GET "http://localhost:3000/api/events/abc"
```

HTTP status: **400**; X-Request-Id: `137d3e39-3fc2-4291-aa44-3cfbfe9558af`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/validation-error",
  "title": "Request validation failed",
  "status": 400,
  "detail": "One or more request fields are invalid",
  "instance": "/api/events/abc",
  "code": "VALIDATION_ERROR",
  "requestId": "137d3e39-3fc2-4291-aa44-3cfbfe9558af",
  "errors": [
    {
      "field": "id",
      "message": "Invalid input: expected number, received NaN"
    }
  ]
}
```

## 8. Події немає

```powershell
curl.exe -i -X GET "http://localhost:3000/api/events/9999"
```

HTTP status: **404**; X-Request-Id: `8aab802d-8473-4113-be46-8ccaf800e7fb`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/event-not-found",
  "title": "Event not found",
  "status": 404,
  "detail": "Event with id 9999 was not found",
  "instance": "/api/events/9999",
  "code": "EVENT_NOT_FOUND",
  "requestId": "8aab802d-8473-4113-be46-8ccaf800e7fb"
}
```

## 9. Дубль події

```powershell
'{"title":"Node.js Workshop","date":"2026-11-15","isOnline":true}' | curl.exe -i -X POST "http://localhost:3000/api/events" -H "Content-Type: application/json" --data-binary '@-'
```

HTTP status: **409**; X-Request-Id: `46a76e5b-89c4-4a91-bc11-2d8cfe094a65`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/event-already-exists",
  "title": "Event already exists",
  "status": 409,
  "detail": "Event with the same title and date already exists",
  "instance": "/api/events",
  "code": "EVENT_ALREADY_EXISTS",
  "requestId": "46a76e5b-89c4-4a91-bc11-2d8cfe094a65"
}
```

## 10. Невідомий маршрут

```powershell
curl.exe -i -X GET "http://localhost:3000/api/unknown"
```

HTTP status: **404**; X-Request-Id: `8ca5de81-9dfe-4d8c-a2e4-c1bbc6615601`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/route-not-found",
  "title": "Route not found",
  "status": 404,
  "detail": "Route GET /api/unknown was not found",
  "instance": "/api/unknown",
  "code": "ROUTE_NOT_FOUND",
  "requestId": "8ca5de81-9dfe-4d8c-a2e4-c1bbc6615601"
}
```

## 11. Внутрішня помилка

```powershell
curl.exe -i -X GET "http://localhost:3000/api/events/error/test"
```

HTTP status: **500**; X-Request-Id: `9116c084-3d32-44e7-a766-02c8973b40be`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/internal-server-error",
  "title": "Internal server error",
  "status": 500,
  "detail": "An unexpected server error occurred",
  "instance": "/api/events/error/test",
  "code": "INTERNAL_SERVER_ERROR",
  "requestId": "9116c084-3d32-44e7-a766-02c8973b40be"
}
```

## 12. Пошкоджений JSON

```powershell
'{"title":' | curl.exe -i -X POST "http://localhost:3000/api/events" -H "Content-Type: application/json" --data-binary '@-'
```

HTTP status: **400**; X-Request-Id: `0a910a13-01f2-4865-9954-90d9f8925571`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/invalid-json",
  "title": "Invalid JSON",
  "status": 400,
  "detail": "Request body must contain valid JSON",
  "instance": "/api/events",
  "code": "INVALID_JSON",
  "requestId": "0a910a13-01f2-4865-9954-90d9f8925571"
}
```

## 13. Query-фільтр

```powershell
curl.exe -i -X GET "http://localhost:3000/api/events?title=Node.js"
```

HTTP status: **200**; X-Request-Id: `beecd5e0-5ffb-4dea-ab38-5235d6af2d6c`; Content-Type: `application/json; charset=utf-8`.

```json
[
  {
    "id": 2,
    "title": "Node.js Workshop",
    "date": "2026-11-15",
    "isOnline": true
  }
]
```

## 14. Невідомий query

```powershell
curl.exe -i -X GET "http://localhost:3000/api/events?price=100"
```

HTTP status: **400**; X-Request-Id: `b7ec889b-4dd1-419c-b81c-f4aaa99ef4bd`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/validation-error",
  "title": "Request validation failed",
  "status": 400,
  "detail": "One or more request fields are invalid",
  "instance": "/api/events?price=100",
  "code": "VALIDATION_ERROR",
  "requestId": "b7ec889b-4dd1-419c-b81c-f4aaa99ef4bd",
  "errors": [
    {
      "field": "query",
      "message": "Unrecognized key: \"price\""
    }
  ]
}
```

## 15. PATCH зберігає isOnline

```powershell
'{"title":"Updated workshop"}' | curl.exe -i -X PATCH "http://localhost:3000/api/events/2" -H "Content-Type: application/json" --data-binary '@-'
```

HTTP status: **200**; X-Request-Id: `4ed04cca-0db0-4b64-9d9f-dddd83db94e8`; Content-Type: `application/json; charset=utf-8`.

```json
{
  "id": 2,
  "title": "Updated workshop",
  "date": "2026-11-15",
  "isOnline": true
}
```

## 16. Видалення

```powershell
curl.exe -i -X DELETE "http://localhost:3000/api/events/2"
```

HTTP status: **204**; X-Request-Id: `2fc2d00f-cb94-4ee3-9c9a-4f3da64ea6ba`; Content-Type: `(absent)`.

```json
(empty body)
```

## Підготовка перевірки ліміту

Для ручного виконання наступного запиту зупиніть сервер (Ctrl+C), встановіть MAX_EVENTS=1 у .env та запустіть npm run dev. Початкова подія вже займає єдине доступне місце. Після перевірки поверніть MAX_EVENTS=100 і перезапустіть сервер.

## 17. Ліміт подій MAX_EVENTS=1

```powershell
'{"title":"Limit workshop","date":"2026-11-15"}' | curl.exe -i -X POST "http://localhost:3000/api/events" -H "Content-Type: application/json" --data-binary '@-'
```

HTTP status: **409**; X-Request-Id: `e11f51b8-f107-4abf-ad8e-7f145713effe`; Content-Type: `application/problem+json; charset=utf-8`.

```json
{
  "type": "https://example.com/problems/event-limit-reached",
  "title": "Event limit reached",
  "status": 409,
  "detail": "Maximum number of events has been reached",
  "instance": "/api/events",
  "code": "EVENT_LIMIT_REACHED",
  "requestId": "e11f51b8-f107-4abf-ad8e-7f145713effe"
}
```

## Перевірка конфігурації

- `{"PORT":"hello"}`: exit code 1; Invalid environment configuration.
- `{"PORT":"99999"}`: exit code 1; Invalid environment configuration.
- `{"NODE_ENV":"local"}`: exit code 1; Invalid environment configuration.
- `{"MAX_EVENTS":"0"}`: exit code 1; Invalid environment configuration.
