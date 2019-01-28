[ -f ./env ] && echo "Found .env" || echo "Copying .env.sample to .env" & cp ./.env.sample ./.env
