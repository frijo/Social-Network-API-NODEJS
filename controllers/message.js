'use strict'

var moment = require('moment')
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');

function probando(req,res){
	return res.status(200).send({message: 'Prueba del controlador de menssage'});
}

function saveMessage(req,res) {
	var params = req.body;
	if(!params.text || !params.receiver) return res.status(500).send({message: 'No se han ingresado lso campos necesarios'});
	
	var message = new Message();
	message.emitter = req.user.sub;
	message.receiver = params.receiver;
	message.text = params.text;
	message.created_at = moment().unix();
	message.viewed = 'false';
	message.save((err,messageStored)=>{
		if(err) return res.status(500).send({message: 'No se pudo ejecutar la peticion'});
		if(!messageStored) return res.status(404).send({message: 'Error al enviar el mensaje'});
		return res.status(200).send({message: messageStored});
	});

}
function getRecievedMessages(req,res){
	var userId = req.user.sub;
	var page =1;

	if(req.params.page){
		page = req.params.page;
	}
	var itemsPerPage =4;
	//El segundo parametro del populate() lo que hace es solo enviar los campos de la DB especificados
	Message.find({receiver: userId}).populate('emitter','_id name surname nick email image').sort('-created_at').paginate(page,itemsPerPage,(err,messages,total)=>{
		if(err) return res.status(500).send({message: 'No se pudo ejecutar la peticion'});
		if(!messages) return res.status(404).send({message: 'No hay mensajes'});
		return res.status(200).send({
			total:total,
			pages: Math.ceil(total/itemsPerPage),
			messages 
		});
	});
}

function getSendedMessages(req,res){
	var userId = req.user.sub;
	var page =1;

	if(req.params.page){
		page = req.params.page;
	}
	var itemsPerPage =4;
	//El segundo parametro del populate() lo que hace es solo enviar los campos de la DB especificados
	Message.find({emitter: userId}).populate('emitter receiver','_id name surname nick email image').sort('-created_at').paginate(page,itemsPerPage,(err,messages,total)=>{
		if(err) return res.status(500).send({message: 'No se pudo ejecutar la peticion'});
		if(!messages) return res.status(404).send({message: 'No hay mensajes'});
		return res.status(200).send({
			total:total,
			pages: Math.ceil(total/itemsPerPage),
			messages 
		});
	}); 
}
function getUnviewedMessages(req,res){
	var userId =req.user.sub;
	Message.count({receiver: userId, viewed: 'false'}).exec((err,count)=>{
		if(err) return res.status(500).send({message: 'Error en la peticion'});
		return res.status(200).send({
			'unviewed':count
		});
	});
}
function setViewedMessages(req,res) {
	var userId =req.user.sub;
	Message.update({receiver: userId, viewed: 'false'},{viewed: 'true'},{"multi":true},(err,MessageViewed)=>{
		if(err) return res.status(500).send({message: 'Error en la peticion'});
		return res.status(200).send({
			message: MessageViewed
		});		
	});
}


module.exports ={
	probando,
	saveMessage,
	getRecievedMessages,
	getSendedMessages,
	getUnviewedMessages,
	setViewedMessages
}