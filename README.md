# CampusHub API

Backend API проєкту CampusHub, створений з використанням Node.js, TypeScript та Express.

## Вимоги

* Node.js >= 20
* npm

## Встановлення

Клонуйте репозиторій і встановіть залежності:

```bash
npm install
```

Створіть файл `.env`:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
MAX_EVENTS=100
```

## Розробка

Запустіть сервер розробки:

```bash
npm run dev
```

API буде доступний за адресою:

```text
http://localhost:3000
```

## ПР4: router подій та middleware

Маршрути ПР4 використовують окремий router `src/routes/events.router.js`, підключений у застосунку так:

```js
app.use('/api/events', eventsRouter);
```

Дані цього router зберігаються в пам'яті у звичайному масиві, тому після перезапуску сервера повертаються до початкового стану.

| Метод | Маршрут | Дія |
| --- | --- | --- |
| GET | `/api/events` | Повертає всі події |
| GET | `/api/events/:id` | Повертає подію за `id` |
| POST | `/api/events` | Створює подію |
| PATCH | `/api/events/:id` | Частково оновлює подію |
| DELETE | `/api/events/:id` | Видаляє подію |

### Порядок middleware

1. `requestId` підключено перед маршрутами, щоб кожен запит — включно з помилковим — отримав `requestId` та заголовок відповіді `X-Request-Id`.
2. `logger` також підключено перед маршрутами: він починає відлік до обробника, а після `finish` бачить остаточний HTTP-статус і тривалість відповіді.
3. Router підключається після базових middleware, тому його обробники вже мають доступ до `requestId`.
4. `notFound` підключено після всіх маршрутів, щоб спрацьовувати лише тоді, коли жоден маршрут не відповів. Він повертає `404` у єдиному форматі.
5. Глобальний `errorHandler` має бути останнім: Express передає йому помилки з усіх попередніх middleware та маршрутів. Для перевірки використайте `GET /api/events/error/test`.

Після завершення запиту logger показує метод, URL, HTTP-статус, тривалість і requestId. Тимчасові повідомлення порядку з ПР4 прибрано.

### Команди для перевірки

```bash
curl -i http://localhost:3000/api/events
curl -i http://localhost:3000/api/events/1
curl -i -X POST http://localhost:3000/api/events -H "Content-Type: application/json" -d '{"title":"Node.js Workshop","date":"2026-11-15"}'
curl -i -X PATCH http://localhost:3000/api/events/1 -H "Content-Type: application/json" -d '{"title":"Updated Event"}'
curl -i -X DELETE http://localhost:3000/api/events/1
curl -i http://localhost:3000/api/unknown
curl -i http://localhost:3000/api/events/error/test
```

## Перевірка стану

Надішліть GET-запит:

```text
GET http://localhost:3000/health
```

Приклад відповіді:

```json
{
  "status": "ok",
  "service": "campushub-api",
  "timestamp": "2026-09-16T10:00:00.000Z"
}
```

## API подій

Дані подій зберігаються у файлі `data/events.json`.

### GET /api/events-from-file

Повертає список усіх подій із JSON-файлу.

```text
GET http://localhost:3000/api/events-from-file
```

Приклад відповіді:

```json
[
  {
    "id": "1",
    "title": "Зустріч студентів",
    "date": "2026-10-15"
  },
  {
    "id": "2",
    "title": "Практична робота з Node.js",
    "date": "2026-10-20"
  }
]
```

### POST /api/events-from-file

Додає нову подію до списку.

Приклад запиту:

```json
{
  "title": "Практична робота з Node.js",
  "date": "2026-10-20"
}
```

ID створюється сервером автоматично за допомогою `randomUUID()`.

При успішному створенні повертається статус `201`.

Приклад відповіді:

```json
{
  "id": "унікальний-ідентифікатор",
  "title": "Практична робота з Node.js",
  "date": "2026-10-20"
}
```

## Робота з файлами

Для роботи з JSON-файлом використовується `fs/promises` та `async/await`.

Файл `fileEventStore.js` містить функції:

* `readEvents()` — читає події з файлу;
* `writeEvents(events)` — зберігає список подій у файл.

Під час запису дані спочатку зберігаються у тимчасовий файл, після чого він перейменовується у `events.json`.

Для обробки помилок роботи з файлом створено власний клас `DataFileError`.

## Обробка помилок

Якщо файл відсутній, пошкоджений або виникла помилка читання чи запису, сервер повертає статус `500`:

```json
{
  "type": "https://example.com/problems/internal-server-error",
  "title": "Internal server error",
  "status": 500,
  "detail": "An unexpected server error occurred",
  "instance": "/api/events-from-file",
  "code": "INTERNAL_SERVER_ERROR",
  "requestId": "ідентифікатор-запиту"
}
```

Технічні деталі помилки виводяться у консоль сервера за допомогою `console.error()` і не передаються користувачу.

## Перевірка помилок

### 1. Відсутній файл

Файл `events.json` було тимчасово перейменовано.

Після виконання:

```text
GET /api/events-from-file
```

отримано:

```text
Status: 500
```

```json
{
  "type": "https://example.com/problems/internal-server-error",
  "title": "Internal server error",
  "status": 500,
  "detail": "An unexpected server error occurred",
  "instance": "/api/events-from-file",
  "code": "INTERNAL_SERVER_ERROR",
  "requestId": "ідентифікатор-запиту"
}
```

Після перевірки файл було відновлено.

### 2. Пошкоджений JSON

У файлі `events.json` було навмисно видалено кому між об'єктами.

Після виконання:

```text
GET /api/events-from-file
```

отримано:

```text
Status: 500
```

```json
{
  "type": "https://example.com/problems/internal-server-error",
  "title": "Internal server error",
  "status": 500,
  "detail": "An unexpected server error occurred",
  "instance": "/api/events-from-file",
  "code": "INTERNAL_SERVER_ERROR",
  "requestId": "ідентифікатор-запиту"
}
```

Після перевірки JSON-файл було відновлено.

## Збірка

Скомпілювати TypeScript:

```bash
npm run build
```

## Перевірка типів

Запустити перевірку TypeScript:

```bash
npm run typecheck
```

## Тести

Запустити тести:

```bash
npm test
```
## Node.js

Для цього проєкту потрібен Node.js версії 20 або новішої.

## ПР5: конфігурація, валідація та Problem Details

### Запуск та відтворення

Залежності `dotenv` і `zod` зазначено в package.json. Після отримання проєкту:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Копіювання потрібне лише якщо локального `.env` ще немає. Він ігнорується Git; `.env.example` містить безпечний приклад без секретів.
`src/config/env.js` перевіряє конфігурацію перед запуском: PORT — ціле число 1–65535, NODE_ENV — development/test/production, LOG_LEVEL — debug/info/warn/error, MAX_EVENTS — додатне ціле число. PORT і MAX_EVENTS стають числами. Якщо значення не задані, діють стандартні значення зі схеми. Якщо задані неправильно — процес завершується з кодом 1 до відкриття порту.

Підтримано ESM (`type: module`) для JavaScript-модулів та `allowJs` для їх включення до TypeScript-збірки. Команди `npm run build` та `npm start` запускають той самий API зі збірки.

### Структура

- `src/config/env.js` — перевірені змінні середовища.
- `src/schemas/event.schemas.js` — Zod-схеми створення, оновлення, id та query.
- `src/middleware/validate.js` — універсальна перевірка body/params/query.
- `src/middleware/request-id.js`, `logger.js`, `not-found.js`, `error-handler.js` — middleware.
- `src/routes/events.router.js` — обробники та бізнес-перевірки.
- `docs/pr5-results.md` — фактичні результати 17 curl-запитів та чотирьох перевірок конфігурації.

### Валідація

Для POST обов'язкові title (3–100 символів після trim) та date (формат YYYY-MM-DD). description необов'язкове, до 500 символів після trim; isOnline — boolean, стандартно false. Схеми strict забороняють невідомі поля. Перевіряється формат дати, відповідно до завдання.

PATCH дозволяє будь-яку непорожню підмножину цих полів. Стандартне isOnline=false додається лише під час створення, тому оновлення назви не скидає вже встановлений isOnline=true.
ID перевіряється як додатне ціле число та перетворюється з рядка до виконання логіки маршруту.

GET /api/events дозволяє query `title` (пошук за фрагментом без урахування регістру) і `date` (точний збіг). Інші query-поля, неправильна дата й порожня назва відхиляються з 400.
Через getter req.query в Express 5 validate записує результат за допомогою Object.defineProperty.

Подія, якої немає, повертає 404/EVENT_NOT_FOUND. Однакові title (без урахування регістру) та date повертають 409/EVENT_ALREADY_EXISTS; це перевіряється і для PATCH. Перевищення MAX_EVENTS повертає 409/EVENT_LIMIT_REACHED. Видалені ID не використовуються повторно. Події зберігаються в пам'яті та скидаються після перезапуску.

### Обробка помилок

Порядок: requestId → logger → express.json → маршрути → notFound → errorHandler.
requestId і logger стоять перед JSON-парсером, щоб пошкоджений JSON також мав X-Request-Id та лог. Це уточнення порядку з методички потрібне для вимоги «кожна помилка містить requestId».

Усі помилки API, включно з файловими маршрутами попередніх робіт, мають Content-Type: application/problem+json та поля type, title, status, detail, instance, code, requestId. errors додається лише для помилок полів. Невідомий маршрут передається через next(error) з кодом ROUTE_NOT_FOUND; пошкоджений JSON має код INVALID_JSON.

Для 500 клієнт отримує лише загальне повідомлення. Stack trace та внутрішнє повідомлення доступні лише в серверному логу з requestId. LOG_LEVEL задає мінімальний рівень журналу запитів; серверні помилки завжди фіксуються.

### Перевірки та матеріали для здачі

```powershell
npm run typecheck
npm run build
npm test -- --run
node scripts/verify-pr5.mjs
```

Усі команди зі звіту використовують порт 3000. Для ручної перевірки спочатку запустіть `npm run dev` в окремому терміналі. Команди у звіті сумісні з Windows PowerShell 5.1: JSON передається в curl.exe через stdin.

Перед запуском `node scripts/verify-pr5.mjs` зупиніть свій сервер (Ctrl+C), щоб звільнити порт 3000. Скрипт сам запускає тестовий сервер на 3000, перевіряє HTTP-відповіді через curl.exe, зупиняє його й повторно запускає на тому самому порту з MAX_EVENTS=1 для перевірки ліміту. Після перевірок тестові процеси завершуються. `.env` скрипт не змінює; для подальшої ручної роботи знову виконайте `npm run dev`.

[Звіт із командами, статусами, X-Request-Id та JSON](docs/pr5-results.md) містить успішну відповідь 201 і приклади всіх помилок 400/404/409/500, а також перевірку ліміту й неправильних змінних середовища. Повторний запуск генерує нові requestId.

Старі Postman-перевірки негативних відповідей з попередньої роботи слід оновити: тепер Content-Type помилок — application/problem+json, а текст помилки міститься в detail замість message.

