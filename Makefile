build: Dockerfile lint
	docker build -t fairchess .

clean:
	-rm -r dist node_modules

lint: node_modules
	npx eslint . && echo "No issues"

node_modules:
	npm i

serve: build
	docker-compose up -d

serve-down:
	docker-compose down

serve-log:
	-docker-compose logs -f fairchess

test: lint

.PHONY: build build-dist clean lint serve serve-down serve-log
