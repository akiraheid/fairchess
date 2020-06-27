pack ::= public.tgz
unpackDir ::= "~/fairchess"
pwd ::= $(shell pwd)
user ::= $(shell id -u)
group ::= $(shell id -g)

build: Dockerfile lint
	docker build -t fairchess-build .
	mkdir -p dist
	docker run --rm -v ${pwd}/:/build/:ro -v ${pwd}/dist/:/build/dist/ -u ${user}:${group} -w /build/ fairchess-build node render.js
	-rm -rf tmp
	cp -r src/public/js/chessboardjs dist/js
	cp -r src/public/img dist/img
	cp -r src/public/css dist/css

clean:
	-rm -r dist node_modules ${pack}

deploy: clean build package upload

lint: node_modules/eslint
	npx eslint . && echo "No issues"

node_modules/eslint:
	npm i eslint@6.8.0

package: build
	cd dist && tar -czf ../${pack} .

serve: build
	cd dist && python3 -m http.server

test: lint

upload: package
	-ssh fairchess "cd ${unpackDir} && rm -r *"
	scp ${pack} fairchess:${unpackDir}
	ssh fairchess "cd ${unpackDir} && tar -xzf ${pack} && rm ${pack}"

.PHONY: build clean deploy lint package serve test upload
