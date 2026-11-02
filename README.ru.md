# daneiel.github.io

[Português](README.md) · [English](README.en.md) · [中文](README.zh-CN.md) · **Русский**

Личный сайт Даниэла Созы, опубликованный через GitHub Pages: **https://daneiel.github.io/**. Статические HTML, CSS и JavaScript, без сборки.

## Что здесь есть

| Путь | Страница | Источник |
| --- | --- | --- |
| [`index.html`](index.html) | [Портфолио](https://daneiel.github.io/): обо мне, проекты, дизайн-токены и контакты | этот репозиторий |
| [`virapets/`](virapets/) | [ViraPets Studio](https://daneiel.github.io/virapets/): редактор пиксельных маскотов (процедурная отрисовка, локальное фото в пиксель-арт и стикеры), работает офлайн | [viralabs-dev/virapets](https://github.com/viralabs-dev/virapets) · [руководство](https://github.com/viralabs-dev/virapets/blob/main/site/README.md) (на английском) |
| `/brabo/` | [Документация Brabo](https://daneiel.github.io/brabo/) | публикуется самим репозиторием [daneiel/brabo](https://github.com/daneiel/brabo) |

## Локальный запуск

```bash
python3 -m http.server 8000
# откройте http://localhost:8000/ и http://localhost:8000/virapets/
```

## Публикация

GitHub Pages раздаёт ветку `main` из корня. Push в `main` публикует сайт.

## Лицензия

ViraPets Studio распространяется по лицензии MIT ([`virapets/LICENSE`](virapets/LICENSE)); уведомления ML-библиотек находятся в `virapets/vendor/`.
