'use strict';

const port = 8010;
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swagger.json');
const logger = require('./src/logger');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const buildSchemas = require('./src/schemas');

db.serialize(() => {
    buildSchemas(db);

    const app = require('./src/app')(db);

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

    app.listen(port, () =>
        logger.log('info', `App started and listening on port ${port}`)
    );
});
