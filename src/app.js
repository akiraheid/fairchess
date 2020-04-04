const errorHandler = require('errorhandler')
const express = require('express')
const path = require('path')

const app = express()

const {
	NODE_ENV,
} = process.env

app.set('host', '0.0.0.0')
app.set('port', 3000)
app.use(express.json())
app.use(express.urlencoded())
app.disable('x-powered-by')

// Static resources
app.use('/', express.static(path.resolve(__dirname, '..', 'dist'),
	{ maxAge: 31557600000 }))

// Dynamic resources
app.use('/game', require('./routes/game'))

// Deployment settings
if (NODE_ENV === 'development') {
	app.use(errorHandler())
} else {
	app.use((err, req, res, _) => {
		console.error(err)
		res.status(500).send('Server Error')
	})
}

// Start app
app.listen(app.get('port'), () => {
	console.log(`App is running at http://localhost:${app.get('port')} in ${app.get('env')} mode`)
	console.log('Press CTRL-C to stop\n')
})
