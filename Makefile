pack ::= public.tgz
unpackDir ::= "~/fairchess"
pwd ::= $(shell pwd)
user ::= $(shell id -u)
group ::= $(shell id -g)
buildContainer = fairchess-build
updateContainer = fairchess-lock-update

audit: build-container
	podman run --rm ${buildContainer} npm audit

build: Dockerfile lint build-container
	-rm -r dist
	mkdir -p dist
	podman run \
		--name ${buildContainer} \
		-v ${pwd}/render.js:/build/render.js:ro \
		-v ${pwd}/src/:/build/src/:ro \
		-v ${pwd}/dist/:/build/dist/ \
		${buildContainer} node render.js
	podman cp ${buildContainer}:/build/dist/ dist/
	podman stop ${buildContainer}
	podman rm ${buildContainer}
	cp -r src/public/js/chessboardjs dist/js
	cp -r src/public/img dist/img
	cp -r src/public/css dist/css

build-container: Dockerfile
	podman build -t ${buildContainer} .

clean:
	-rm -r dist node_modules ${pack}

deploy: clean build package upload

gh-pages: clean build
	-git branch -D gh-pages
	git checkout -b gh-pages
	git rm --cached COPYING
	git reset --hard `git rev-list --max-parents=0 HEAD`
	find . -maxdepth 1 ! -name 'dist' ! -name '.git' ! -name 'COPYING' -exec rm -r {} \;
	git add dist COPYING
	git mv dist/* .
	rm -r dist
	git commit -am "website"
	git push -f --set-upstream origin gh-pages

lint:
	podman run --rm -v ${pwd}:/data:ro docker.io/cytopia/eslint .

package: build
	cd dist && tar -czf ../${pack} .

serve: build
	cd dist && python3 -m http.server

test: lint

update: package.json
	-podman stop ${updateContainer}
	-podman rm ${updateContainer}
	podman run \
		--name ${updateContainer} \
		-v ${pwd}/package.json:/package.json:ro \
		-w / \
		docker.io/node:16-alpine npm install --package-lock
	podman cp ${updateContainer}:/package-lock.json .
	podman stop ${updateContainer}
	podman rm ${updateContainer}

upload: package
	-ssh fairchess "cd ${unpackDir} && rm -r *"
	scp ${pack} fairchess:${unpackDir}
	ssh fairchess "cd ${unpackDir} && tar -xzf ${pack} && rm ${pack}"

.PHONY: build clean deploy lint package serve test update upload
