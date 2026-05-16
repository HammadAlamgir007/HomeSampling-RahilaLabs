# 🐳 Docker Quick Reference - Rahila Labs

## Start Services

### Development (Hot Reload)
```bash
docker-compose -f docker-compose.dev.yml up -d
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```
- Frontend: http://localhost:3001
- Backend: http://localhost:5000
- Nginx: http://localhost/

### With Rider App (Web)
```bash
docker-compose -f docker-compose.prod.yml --profile rider-web up -d
```
- Rider App: http://localhost:8080

## Stop & Clean

```bash
# Stop services
docker-compose down

# Stop and remove volumes (data loss)
docker-compose down -v

# Remove everything
docker-compose down --rmi all
```

## View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

## Run Commands

```bash
# Backend shell
docker-compose exec backend sh

# Run Python script
docker-compose exec backend python scripts/seed_data.py

# Frontend shell
docker-compose exec frontend sh

# View containers
docker-compose ps

# Rebuild images
docker-compose build --no-cache
```

## Configuration

Create `.env` file:
```bash
cp .env.example .env
```

Edit environment variables before starting services.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Change port in docker-compose.yml |
| Out of memory | Increase Docker desktop memory |
| Can't connect to backend | Check `NEXT_PUBLIC_API_URL` in .env |
| Database locked | Remove volumes: `docker-compose down -v` |

## More Info

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed documentation.
