'use strict';

const express = require('express');
const app = express();

const logger = require('./logger');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();


const getRide = (db, id) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM Rides WHERE rideID = ?', id, function (err, row) {
            if (err) {
                reject({
                    error_code: 500,
                    message: 'Unknown error'
                });
            }
    
            if (row.length === 0) {
                reject({
                    error_code: 404,
                    message: 'Could not find the ride'
                });
            }
            
            resolve(row[0]);
        });
    });
};

const createRide = (db, values) => {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, function (err) {
            if (err) {
                reject({
                    error_code: 500,
                    message: 'Server error'
                });
            }

            resolve(this);
        });
    });
};

const getRides = (db, currentPage, page, limit) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM Rides LIMIT ? OFFSET ?', [limit, page], function (err, rows) {
            if (err) {
                reject({
                    error_code: 500,
                    message: 'Server error'
                });
            }

            if (rows.length === 0) {
                reject({
                    error_code: 404,
                    message: 'Could not find any rides'
                });
            }

            resolve({
                data: rows,
                links: {
                    prev_page: `http://localhost:8010/rides?pageNum=${currentPage == 1 ? 1 : currentPage - 1}&recordsPerPage=${limit}`,
                    next_page: `http://localhost:8010/rides?pageNum=${currentPage + 1}&recordsPerPage=${limit}`
                }
            });
        });
    });
};

module.exports = (db) => {
    app.get('/health', (req, res) => {
        res.send('Healthy');
    });

    app.post('/rides', jsonParser, async (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
            return res.status(400).json({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
            return res.status(400).json({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (typeof riderName !== 'string' || riderName.length < 1) {
            return res.status(400).json({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverName !== 'string' || driverName.length < 1) {
            return res.status(400).json({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver name must be a non empty string'
            });
        }

        if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
            return res.status(400).json({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver vehicle must be a non empty string'
            });
        }

        var values = [parseInt(req.body.start_lat), parseInt(req.body.start_long), parseInt(req.body.end_lat), parseInt(req.body.end_long), req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];
        
        try {
            const { lastID } = await createRide(db, values);
            const result = await getRide(db, lastID);
            res.status(200).json(result);
        } catch (err) {
            res.status(err.error_code).json({ message: err.message });
            logger.log('error', err);
        }
    });

    app.get('/rides', async (req, res) => {
        const currentPage = typeof req.query.pageNum === 'undefined' ? 1 : parseInt(req.query.pageNum);
        const limit = req.query.recordsPerPage ? parseInt(req.query.recordsPerPage) : 10;
        const page = currentPage ? (currentPage - 1) * limit : 0;

        try {
            const result = await getRides(db, currentPage, page, limit);
            res.status(200).json(result);
        } catch (err) {
            res.status(err.error_code).json({ message: err.message });
            logger.log('error', err);
        }
    });

    app.get('/rides/:id', async (req, res) => {
        try {
            const result = await getRide(db, req.params.id);
            res.status(200).send(result);
        } catch (err) {
            res.status(err.error_code).json({ message: err.message });
            logger.log('error', err);
        }
    });

    return app;
};
