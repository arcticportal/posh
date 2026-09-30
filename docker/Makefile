up:
	docker compose up --menu=false

down:
	docker compose down --remove-orphans

buildup:
	docker compose up --build --menu=false

detachup:
	docker compose up -d

attach:
	docker compose logs -f

logs:
	docker compose logs

clean:
	docker compose down --rmi local --remove-orphans

prune:
	docker system prune -a --volumes
