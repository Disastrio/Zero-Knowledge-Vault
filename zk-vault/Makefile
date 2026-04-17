 COMPOSE ?= $(shell \
	if docker compose version >/dev/null 2>&1; then \
		echo "docker compose"; \
	elif command -v docker-compose >/dev/null 2>&1; then \
		echo "PYTHONNOUSERSITE=1 docker-compose"; \
	else \
		echo "docker compose"; \
	fi)

FRONTEND_PORT ?= 5175
BACKEND_PORT ?= 3001

export FRONTEND_PORT
export BACKEND_PORT

.PHONY: dev up down logs ps build restart clean

dev:
	$(COMPOSE) up --build

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down --remove-orphans

logs:
	$(COMPOSE) logs -f --tail=200

ps:
	$(COMPOSE) ps

build:
	$(COMPOSE) build

restart:
	$(COMPOSE) down --remove-orphans
	$(COMPOSE) up --build -d

clean:
	$(COMPOSE) down --volumes --remove-orphans