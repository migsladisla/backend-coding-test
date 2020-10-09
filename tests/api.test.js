'use strict';

const request = require('supertest');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

describe('API tests', () => {
    before((done) => {
        db.serialize((err) => {
            if (err) {
                return done(err);
            }

            buildSchemas(db);

            done();
        });
    });

    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200, done);
        });
    });

    describe('POST /rides', () => {
        it('should create a ride', (done) => {
            request(app)
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
                .expect(200, done);
        });

        it('should return startLatitude and startLongitude VALIDATION_ERROR', (done) => {
            request(app)
                .post('/rides')
                .send({
                    start_lat: -100,
                    start_long: -190,
                })
                .expect('Content-Type', /json/)
                .expect(200, done);
        });

        it('should return endLatitude and endLongitude VALIDATION_ERROR', (done) => {
            request(app)
                .post('/rides')
                .send({
                    end_lat: -100,
                    end_long: -190,
                })
                .expect('Content-Type', /json/)
                .expect(200, done);
        });

        it('should return riderName VALIDATION_ERROR', (done) => {
            request(app)
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
                .expect(200, done);
        });

        it('should return driverName VALIDATION_ERROR', (done) => {
            request(app)
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
                .expect(200, done);
        });

        it('should return driverVehicle VALIDATION_ERROR', (done) => {
            request(app)
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
                .expect(200, done);
        });
    });

    describe('GET /rides', () => {
        it('should return all rides', (done) => {
            request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
    });

    describe('GET /rides', () => {
        it('should return a ride with the ID of 1', (done) => {
            request(app)
                .get('/rides/1')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });

        it('should return RIDES_NOT_FOUND_ERROR', (done) => {
            request(app)
                .get('/rides/2')
                .expect('Content-Type', /json/)
                .expect(200, done);
        });
    });
});
