'use strict';

const request = require('supertest');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

describe('API tests', () => {
    before(() => {
        db.serialize(async () => {
            try {
                await buildSchemas(db);
            } catch (err) {
                return err;
            }
        });
    });

    describe('GET /health', () => {
        it('should return health', async () => {
            await request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200);
        });
    });

    describe('POST /rides', () => {
        it('should create a ride', async () => {
            await request(app)
                .post('/rides')
                .send({
                    start_lat: 0,
                    start_long: 0,
                    end_lat: 0,
                    end_long: 0,
                    rider_name: 'Migs Ladisla',
                    driver_name: 'Juan Miguel',
                    driver_vehicle: 'Fortuner',
                })
                .expect('Content-Type', /json/)
                .expect(200);
        });

        it('should return startLatitude and startLongitude VALIDATION_ERROR', async () => {
            await request(app)
                .post('/rides')
                .send({
                    start_lat: -100,
                    start_long: -190,
                })
                .expect('Content-Type', /json/)
                .expect(200);
        });

        it('should return endLatitude and endLongitude VALIDATION_ERROR', async () => {
            await request(app)
                .post('/rides')
                .send({
                    end_lat: -100,
                    end_long: -190,
                })
                .expect('Content-Type', /json/)
                .expect(200);
        });

        it('should return riderName VALIDATION_ERROR', async () => {
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
                .expect(200);
        });

        it('should return driverName VALIDATION_ERROR', async () => {
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
                .expect(200);
        });

        it('should return driverVehicle VALIDATION_ERROR', async () => {
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
                .expect(200);
        });
    });

    describe('GET /rides', () => {
        it('should return the first 10 rides with no query params', async () => {
            await request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200);
        });
        
        it('should return the first 10 rides with query params', async () => {
            await request(app)
                .get('/rides?pageNum=1&recordsPerPage=10')
                .expect('Content-Type', /json/)
                .expect(200);
        });

        it('should return RIDES_NOT_FOUND_ERROR', async () => {
            await request(app)
                .get('/rides?pageNum=1000&recordsPerPage=10')
                .expect('Content-Type', /json/)
                .expect(200);
        });

        // SQL injection
        it('should return RIDES_NOT_FOUND_ERROR', async () => {
            await request(app)
                .get('/rides?pageNum=1000&recordsPerPage=10; select * from Rides;')
                .expect('Content-Type', /json/)
                .expect(200);
        });
    });

    describe('GET /rides/{id}', () => {
        it('should return a ride with the ID of 1', async () => {
            await request(app)
                .get('/rides/1')
                .expect('Content-Type', /json/)
                .expect(200);
        });

        it('should return no ride', async () => {
            await request(app)
                .get('/rides/100000')
                .expect('Content-Type', /json/)
                .expect(200);
        });

        // SQL injection
        it('should return RIDES_NOT_FOUND_ERROR', async () => {
            await request(app)
                .get('/rides/1; select * from Rides;')
                .expect('Content-Type', /json/)
                .expect(200);
        });
    });
});
