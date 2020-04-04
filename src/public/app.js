import * as board from './board.js'

const app = function() {

	const init = () => {
		board.init()
	}

	// Exporter
	return {
		init: init
	}
}

$(() => {
	app.init()
})
