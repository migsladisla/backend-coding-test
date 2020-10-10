'use strict';

const express = require('express');
const app = express();

const logger = require('./logger');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

module.exports = (db) => {
    app.get('/health', (req, res) => {
        logger.log('info', '%s %s %s %s', 'GET', '/health', '200', 'OK');
        res.send('Healthy');
    });

    app.post('/rides', jsonParser, (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
            logger.log('error', '%s %s %s %s', 'POST', '/rides', 'VALIDATION_ERROR', 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively');
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
            logger.log('error', '%s %s %s %s', 'POST', '/rides', 'VALIDATION_ERROR', 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively');
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (typeof riderName !== 'string' || riderName.length < 1) {
            logger.log('error', '%s %s %s %s', 'POST', '/rides', 'VALIDATION_ERROR','Rider name must be a non empty string');
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverName !== 'string' || driverName.length < 1) {
            logger.log('error', '%s %s %s %s', 'POST', '/rides', 'VALIDATION_ERROR', 'Rider name must be a non empty string');
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
            logger.log('error', '%s %s %s %s', 'POST', '/rides', 'VALIDATION_ERROR', 'Rider name must be a non empty string');
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        var values = [parseInt(req.body.start_lat), parseInt(req.body.start_long), parseInt(req.body.end_lat), parseInt(req.body.end_long), req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];
        
        db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, function (err) {
            if (err) {
                logger.log('error', '%s %s %s %s', 'POST', '/rides', 'SERVER_ERROR', 'Unknown error');
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, function (err, rows) {
                if (err) {
                    logger.log('error', '%s %s %s %s', 'POST', '/rides', 'SERVER_ERROR', 'Unknown error');
                    return res.send({
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    });
                }

                logger.log('info', '%s %s %s %s', 'POST', '/rides', '201', 'Created');
                res.send(rows);
            });
        });
    });

    app.get('/rides', (req, res) => {
        const currentPage = typeof req.query.pageNum === 'undefined' ? 1 : parseInt(req.query.pageNum);
        const limit = req.query.recordsPerPage ? parseInt(req.query.recordsPerPage) : 10;
        const page = currentPage ? (currentPage - 1) * limit : 0;
        const values = [Number(limit), Number(page)];
        
        db.all('SELECT * FROM Rides LIMIT ? OFFSET ?', values, function (err, rows) {
            if (err) {
                logger.log('error', '%s %s %s %s', 'GET', '/rides', 'SERVER_ERROR', 'Unknown error');
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                logger.log('error', '%s %s %s %s', 'GET', '/rides', 'RIDES_NOT_FOUND_ERROR', 'Could not find any rides');
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            console.log(rows);
            logger.log('info', '%s %s %s %s', 'GET', '/rides', '200', 'OK');
            res.send({
                data: rows,
                links: {
                    prev_page: `http://localhost:8010/rides?pageNum=${currentPage == 1 ? 1 : currentPage - 1}&recordsPerPage=${limit}`,
                    next_page: `http://localhost:8010/rides?pageNum=${currentPage + 1}&recordsPerPage=${limit}`
                }
            });
        });
    });

    app.get('/rides/:id', (req, res) => {
        const rideID = Number(req.params.id);

        db.all('SELECT * FROM Rides WHERE rideID = ?', rideID, function (err, rows) {
            if (err) {
                logger.log('error', '%s %s %s %s', 'GET', '/rides/{id}', 'SERVER_ERROR', 'Unknown error');
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                logger.log('error', '%s %s %s %s', 'GET', '/rides/{id}', 'RIDES_NOT_FOUND_ERROR', 'Could not find any rides');
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            logger.log('info', '%s %s %s %s', 'GET', '/rides/{id}', '200', 'OK');
            res.send(rows);
        });
    });

    return app;
};
