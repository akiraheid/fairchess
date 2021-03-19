pack ::= public.tgz
unpackDir ::= "~/fairchess"
pwd ::= $(shell pwd)
user ::= $(shell id -u)
group ::= $(shell id -g)
buildContainer = fairchess-build

build: Dockerfile lint
	docker build -t ${buildContainer} .
	-rm -r dist
	mkdir -p dist
	docker run \
		--name ${buildContainer} \
		-v ${pwd}/render.js:/build/render.js:ro \
		-v ${pwd}/src/:/build/src/:ro \
		-v ${pwd}/dist/:/build/dist/ \
		${buildContainer} node render.js

	docker cp ${buildContainer}:/build/dist/ .
	docker stop ${buildContainer}
	docker rm ${buildContainer}
	cp -r src/public/js/chessboardjs dist/js
	cp -r src/public/img dist/img
	cp -r src/public/css dist/css

clean:
	-rm -r dist node_modules ${pack}

deploy: clean build package upload

lint:
	docker run --rm -v ${pwd}:/data:ro cytopia/eslint .

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
