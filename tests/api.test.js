'use strict';

const { assert } = require('chai');
const request = require('supertest');

const logger = require('../src/logger');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

describe('API tests', () => {
    before(async () => {
        db.serialize();
        await buildSchemas(db);
        logger.log('info', 'Test initiated');
    });

    describe('GET /health', () => {
        it('should return health', async () => {
            await request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200)
                .then(res => {
                    assert(res.text, 'Healthy');
                });
        });
    });

    describe('POST /rides', () => {
        it('should return validation error when startLatitude is not between -90 to 90', async () => {
            await request(app)
                .post('/rides')
                .send({
                    start_lat: 91,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: 'Migs',
                    driver_name: 'Juan',
                    driver_vehicle: 'Mustang'
                })
                .expect('Content-Type', /json/)
                .expect(400)
                .then(res => {
                    assert(res.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should return validation error when startLongitude is not between -180 to 180 degrees', async () => {
            await request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: -181,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: 'Migs',
                    driver_name: 'Juan',
                    driver_vehicle: 'Mustang'
                })
                .expect('Content-Type', /json/)
                .expect(400)
                .then(res => {
                    assert(res.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should return validation error when endLatitude is not between -90 to 90', async () => {
            await request(app)
                .post('/rides')
                .send({
                    start_lat: 91,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: 'Migs',
                    driver_name: 'Juan',
                    driver_vehicle: 'Mustang'
                })
                .expect('Content-Type', /json/)
                .expect(400)
                .then(res => {
                    assert(res.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should return validation error when endLongitude is not between -180 to 180 degrees', async () => {
            await request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: -181,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: 'Migs',
                    driver_name: 'Juan',
                    driver_vehicle: 'Mustang'
                })
                .expect('Content-Type', /json/)
                .expect(400)
                .then(res => {
                    assert(res.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should return validation error when riderName is an empty string', async () => {
            await request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: '',
                    driver_name: 'Juan Miguel',
                    driver_vehicle: 'Fortuner',
                })
                .expect('Content-Type', /json/)
                .expect(400)
                .then(res => {
                    assert(res.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should return validation error when driverName is an empty string', async () => {
            await request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: 'Migs Ladisla',
                    driver_name: '',
                    driver_vehicle: 'Fortuner',
                })
                .expect('Content-Type', /json/)
                .expect(400)
                .then(res => {
                    assert(res.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should return validation error when vehicleName is an empty string', async () => {
            await request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: 'Migs Ladisla',
                    driver_name: 'Juan Miguel',
                    driver_vehicle: '',
                })
                .expect('Content-Type', /json/)
                .expect(400)
                .then(res => {
                    assert(res.body.error_code, 'VALIDATION_ERROR');
                });
        });

        it('should create a ride', async () => {
            await request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: 'Migs',
                    driver_name: 'Juan',
                    driver_vehicle: 'Mustang'
                })
                .expect('Content-Type', /json/)
                .expect(200);
        });
    });

    describe('GET /rides', () => {
        it('should return data with no parameters', async () => {
            await request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200);
        });
        
        it('should return data with query params', async () => {
            await request(app)
                .get('/rides?pageNum=1&recordsPerPage=10')
                .expect('Content-Type', /json/)
                .expect(200);
        });

        it('should return 404 error when no rides are found', async () => {
            await request(app)
                .get('/rides?pageNum=1000&recordsPerPage=10;')
                .expect('Content-Type', /json/)
                .expect(404)
                .then(res => {
                    assert(res.body.message, 'Could not find any rides');
                });
        });

        it('should return 404 error when injected with SQL query in the URL', async () => {
            await request(app)
                .get('/rides?pageNum=1000&recordsPerPage=10; select * from Rides;')
                .expect('Content-Type', /json/)
                .expect(404)
                .then(res => {
                    assert(res.body.message, 'Could not find the ride');
                });
        });
    });

    describe('GET /rides/{id}', () => {
        it('should return a ride with the ID of 1', async () => {
            await request(app)
                .get('/rides/1')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(res => {
                    assert(res.body.rideID, '1');
                });
        });

        it('should return 404 error when no ride is found', async () => {
            await request(app)
                .get('/rides/100000')
                .expect('Content-Type', /json/)
                .expect(404)
                .then(res => {
                    assert(res.body.message, 'Could not find the ride');
                });
        });

        // SQL injection
        it('should return 404 error when injected with SQL query in the URL', async () => {
            await request(app)
                .get('/rides/1; select * from Rides;')
                .expect('Content-Type', /json/)
                .expect(404)
                .then(res => {
                    assert(res.body.message, 'Could not find the ride');
                });
        });
    });
});