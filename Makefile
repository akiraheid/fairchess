build: node_modules

clean:
	-rm -rf node_modules

node_modules:
	npm i

serve: clean build
	npm start

.PHONY: serve
