build: Dockerfile clean
	docker build -t fairchess .

clean:
	-rm -r dist node_modules tests_output

node_modules:
	npm i

serve: clean build
	docker-compose up -d

serve-down:
	docker-compose down

serve-log:
	-docker-compose logs -f

.PHONY: serve
