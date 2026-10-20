# Учебный интернет-магазин — КР №2

Чернышев Антон Дмитриевич, группа ЭФБО-02-25.

Тема: «CSS-фреймворки: разработка интерфейса на Bootstrap или альтернативном CSS-фреймворке».

Отдельная реализация магазина аксессуаров на Bootstrap 5.3.8. КР №1 не изменяется. Проект учебный: продажи не осуществляются, цены и характеристики условные, формы не передают и не сохраняют данные.

- [Сайт GitHub Pages](https://antonxer-1.github.io/kr2-bootstrap-shop/)
- [Репозиторий для сдачи](https://github.com/AntonXer-1/kr2-bootstrap-shop)
- [Что показать на защите](docs/DEFENSE.md)
- [Все 59 ответов по практикам 7, 8 и КР №2](docs/ANSWERS_7_8_KR2.md)

## Четыре согласованные доработки

1. Локальный Bootstrap: CSS и JS Bundle лежат в `vendor/bootstrap/`, CDN не используется.
2. Вкладки `tabs`: описание и таблица характеристик на `product.html`.
3. Карусель `carousel`: две локальные схемы клавиатуры на `product.html`, без автопрокрутки.
4. Пагинация `pagination`: две страницы каталога, по три разных товара. Это реальные ссылки, не декоративные кнопки.

Это четыре функциональные доработки. В таблице критериев PDF вкладки, карусель и пагинация относятся к одной категории дополнительных Bootstrap-компонентов; четыре доработки не означают четыре разные оценочные категории или гарантированные 5 баллов.

## Подключение Bootstrap

Файлы официальной версии [Bootstrap 5.3.8](https://github.com/twbs/bootstrap/releases/tag/v5.3.8) сохранены без изменений. Лицензия MIT: `vendor/bootstrap/LICENSE`.

```html
<link rel="stylesheet" href="vendor/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="css/custom.css?v=20261020">
<script src="vendor/bootstrap/js/bootstrap.bundle.min.js" defer></script>
<script src="js/demo.js" defer></script>
```

`custom.css` подключён после библиотеки и содержит только небольшие настройки. Bundle включает JavaScript Bootstrap и Popper. Сборщик и jQuery не нужны. После скачивания проекта его ресурсы доступны без внешнего интернета; первый вход на GitHub Pages требует сети.

## Структура

```text
index.html               главная, преимущества, популярные товары
catalog.html             каталог, товары 1–3
catalog-page-2.html       каталог, товары 4–6
product.html             клавиатура, tabs, carousel и характеристики
order.html               учебная форма
css/custom.css           небольшие дополнения к Bootstrap
js/demo.js               выбранный товар и учебная проверка формы
images/                  две SVG-схемы клавиатуры
vendor/bootstrap/        локальные CSS, JS Bundle и лицензия
docs/                    защита, ответы, план работы
tests/site.test.cjs      браузерные проверки
```

## Реализованные компоненты

- Сетка: `container`, `row g-4`, `col-12 col-md-6 col-lg-4`. Одна, две или три карточки в строке.
- `navbar`, `navbar-expand-lg`, `collapse`: единое меню с мобильной кнопкой. Шапка закреплена через `sticky-top`.
- `card`, `btn-primary`, `btn-outline-primary`, `btn-secondary`, `badge`.
- `alert-info`, `alert-success`: пояснение учебного режима и результат проверки.
- `modal`: выбранный товар, закрытие и переход к форме.
- `form-control`, `form-select`, `input-group` с `+7`, `form-check`.
- `nav-tabs`, `tab-content`, `tab-pane`; `carousel`; `pagination`.

## Работа формы

Обязательны имя, email, телефон из 10 цифр без +7, товар и согласие. Комментарий необязателен. Поля имеют подписи и `name`; применяются `required`, `type="email"`, `minlength` и `pattern`.

Название товара передаётся из карточки в modal, затем параметром `?product=...` в форму. Неизвестный товар из адреса игнорируется. Персональные данные в адрес не добавляются.

JS отменяет отправку через `preventDefault()` и показывает сообщение только после успешной проверки. Без JS кнопка отключена. Backend, базы данных, оплаты и личного кабинета нет; разработчик не может увидеть «отправленные заявки», потому что они никуда не отправляются. Используйте вымышленные данные.

## Запуск и проверка

Для просмотра открыть `index.html` или запустить из папки проекта `python3 -m http.server 8000` и открыть `http://localhost:8000`.

Для автоматических проверок нужен Node.js с пакетом Playwright и установленным Chromium:

```sh
node --test tests/site.test.cjs
```

Если Playwright установлен вне проекта, указать его каталог через `NODE_PATH`; для отдельной папки браузеров — `PLAYWRIGHT_BROWSERS_PATH`.

Набор из 12 проверок охватывает пять страниц, локальные ссылки и ресурсы, отсутствие CDN-запросов, ширины 375/768/1280, закрепление шапки, разные товары при пагинации, tabs с клавиатуры, carousel, передачу товара через modal, закрытие Escape и возврат фокуса, валидацию, отсутствие POST и безопасное состояние формы без JS.

Вручную: открыть все страницы, поменять ширину окна, прокрутить, раскрыть мобильное меню, переключить страницу каталога, вкладку и картинку. Затем проверить заявку с пустыми и вымышленными корректными данными. На защите показать README и историю коммитов.

## Источники

Требования: «№2 Текущий контроль Фронтенд и бэкенд разработка (Часть 1 из 2).pdf».

Справка: [подключение Bootstrap](https://getbootstrap.com/docs/5.3/getting-started/download/), [сетка](https://getbootstrap.com/docs/5.3/layout/grid/), [tabs](https://getbootstrap.com/docs/5.3/components/navs-tabs/), [carousel](https://getbootstrap.com/docs/5.3/components/carousel/), [modal](https://getbootstrap.com/docs/5.3/components/modal/).
