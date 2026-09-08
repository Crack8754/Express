# CampusHub API

Backend API проєкту CampusHub, створений з використанням Node.js, TypeScript та Express.

## Вимоги

* Node.js >= 20
* npm

## Встановлення

Клонуйте репозиторій і встановіть залежності:

npm install

Створіть файл `.env`:

* PORT=3000
* NODE_ENV=development

## Розробка

Запустіть сервер розробки:

npm run dev

API буде доступний за адресою:

http://localhost:3000

## Перевірка стану

Надішліть GET-запит на адресу:

GET http://localhost:3000/health

Приклад відповіді:

{
  "status": "ok",
  "service": "campushub-api",
  "timestamp": "2026-09-02T08:00:00.000Z"
}

## Збірка

Скомпілюйте TypeScript:

npm run build

## Перевірка типів

Запустіть перевірку типів TypeScript:

npm run typecheck

## Тести

Запустіть тести:

npm test

## Node.js

Для цього проєкту потрібен Node.js версії 20 або новішої.
