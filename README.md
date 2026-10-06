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

У консолі сервер тимчасово показує порядок: `1. requestId`, `2. logger`, `3. router`, а для невідомого маршруту — `4. notFound`; для тестової помилки — `5. errorHandler`.

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
  "message": "Не вдалося прочитати або зберегти події"
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
  "message": "Не вдалося прочитати або зберегти події"
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
  "message": "Не вдалося прочитати або зберегти події"
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

