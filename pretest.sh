[ -f ./env ] && echo "Found .env" || echo "Copying .env.example to .env" & cp ./.env.example ./.env
