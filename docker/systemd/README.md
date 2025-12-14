# Systemd сервисы для BelBird

Автоматический запуск Supabase и Edge Functions при старте VDS.

## Установка

```bash
# Перейти в директорию
cd docker/systemd

# Сделать скрипты исполняемыми
chmod +x *.sh

# Установить сервисы (от root)
sudo ./install-services.sh
```

## Структура сервисов

```
belbird-supabase.service    # Self-hosted Supabase (PostgreSQL, Auth, Storage, Kong)
       ↓
belbird-functions.service   # Edge Functions (Deno containers)
```

Edge Functions зависят от Supabase и запускаются после него.

## Управление

### Supabase

```bash
# Запуск
sudo systemctl start belbird-supabase

# Остановка
sudo systemctl stop belbird-supabase

# Перезапуск
sudo systemctl restart belbird-supabase

# Статус
sudo systemctl status belbird-supabase

# Логи
sudo journalctl -u belbird-supabase -f
```

### Edge Functions

```bash
# Запуск
sudo systemctl start belbird-functions

# Остановка
sudo systemctl stop belbird-functions

# Перезапуск
sudo systemctl restart belbird-functions

# Статус
sudo systemctl status belbird-functions

# Логи
sudo journalctl -u belbird-functions -f
```

## Порядок запуска при старте VDS

1. `docker.service` — Docker daemon
2. `belbird-supabase.service` — Supabase (БД, Auth, API)
3. `belbird-functions.service` — Edge Functions

## Проверка работы

```bash
# Проверить статус всех сервисов
systemctl status belbird-supabase belbird-functions

# Проверить что контейнеры запущены
docker ps

# Проверить healthcheck
curl http://localhost:9000/health
curl http://localhost:8000/rest/v1/
```

## Удаление

```bash
sudo ./uninstall-services.sh
```

## Troubleshooting

### Сервис не запускается

```bash
# Посмотреть детальные логи
sudo journalctl -u belbird-functions -n 50 --no-pager

# Проверить Docker
sudo systemctl status docker
docker ps -a

# Попробовать запустить вручную
cd /opt/belbird/docker
docker compose -f docker-compose.functions.yml up
```

### Долгий запуск

Supabase может стартовать 2-5 минут. Это нормально.

```bash
# Следить за прогрессом
sudo journalctl -u belbird-supabase -f
```

### Ошибка "docker compose not found"

На старых системах используется `docker-compose`:

```bash
# Редактировать сервис
sudo nano /etc/systemd/system/belbird-functions.service

# Заменить:
# ExecStart=/usr/bin/docker compose ...
# На:
# ExecStart=/usr/local/bin/docker-compose ...

sudo systemctl daemon-reload
```
