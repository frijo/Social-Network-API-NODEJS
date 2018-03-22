'use strict'

var express = require('express');
var MessageController = require('../controllers/message');
var api = express.Router();
var md_auth = require('../middlewares/authentication');

	api.get('/pruebaMessage',md_auth.ensureAuth,MessageController.probando);
	api.post('/message',md_auth.ensureAuth,MessageController.saveMessage);
	api.get('/get-my-messages/:page?',md_auth.ensureAuth,MessageController.getRecievedMessages);
	api.get('/get-my-send-messages/:page?',md_auth.ensureAuth,MessageController.getSendedMessages);
	api.get('/unviewed-messages',md_auth.ensureAuth,MessageController.getUnviewedMessages);
	api.get('/set-viewed-messages',md_auth.ensureAuth,MessageController.setViewedMessages);

module.exports =api;