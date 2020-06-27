const fs = require('fs')
const path = require('path')
const pug = require('pug')
const webpack = require('webpack')

// "compile" JS files
webpack({
	mode: 'production',
	entry: './src/public/js/app.js',
	output: {
		filename: 'app.js',
		path: path.resolve(__dirname, 'dist', 'js'),
	},
	module: {
		rules: [
			{
				test: /\.svg$/,
				use: ['file-loader'],
			},
		],
	},
}, (err, stats) => {
	if (err || stats.hasErrors()) {
		console.error(err)
		console.error(stats)
	}
	// Done processing
})

const distDir = path.join(__dirname, 'dist')
const pugDir = path.join(__dirname, 'src', 'views')
const files = ['play.pug']

const render = (outPath, filePath) => {
	const content = pug.renderFile(filePath)
	fs.writeFileSync(outPath, content, { mode: 0o644 })
}

// Render index.html
render(path.join(distDir, 'index.html'), path.join(pugDir, 'index.pug'))

// Render the other pages as index.html in directories based on the pug file
// E.g. ai.pug > ai/index.html
files.forEach(file => {
	const filePath = path.join(pugDir, file)
	const basename = path.basename(file, '.pug')
	const outFile = 'index.html'
	const outDir = path.join(distDir, basename)
	const outPath = path.join(outDir, outFile)

	fs.mkdirSync(outDir, { mode: 0o755, recursive: true })

	render(outPath, filePath)
	console.log(`Generated '${outPath}' from '${filePath}'`)
})
