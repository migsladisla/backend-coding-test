'use strict';

const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swagger.json');
const port = 8010;

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const buildSchemas = require('./src/schemas');

db.serialize(() => {
	buildSchemas(db);

	const app = require('./src/app')(db);

	app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

	app.listen(port, () =>
		// eslint-disable-next-line no-undef
		console.log(`App started and listening on port ${port}`)
	);
});
