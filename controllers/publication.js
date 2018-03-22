'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment')
var mongoosePaginate = require('mongoose-pagination');
//var mongoosePaginate =require('mongoose-pagination');
var jwt = require('../services/jwt');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function probando(req,res) {
	res.status(200).send({message: 'Hola desde el controlador de publication'});
}
function savePublication(req,res) {
	var params =req.body;
	if(!params.text) return res.status(200).send({message: 'Debes enviar un texto!!'});
	
	var publication = new Publication();
	publication.text = params.text;
	publication.file = 'null';
	publication.user = req.user.sub;
	publication.created_at = moment().unix();

	publication.save((err,publicationStored)=>{
		if(err) return res.status(500).send({message: 'Error al guardar publicacion'});
		if(!publicationStored) return res.status(404).send({message: 'La publicacion NO ha sido guardada'});
		return res.status(200).send({publication: publicationStored});
	});


}
function getPublications(req,res) {
	var page =1;
	if(req.params.page){
		page =req.params.page;
	}
	var itemsPerPage =4;
	Follow.find({user: req.user.sub}).populate('followed').exec((err,follows)=>{
		if(err) return res.status(500).send({message: 'Error al devolver el seguimiento'});
		var follows_clean=[];
		follows.forEach((follow)=>{
			follows_clean.push(follow.followed);
		});
		follows_clean.push(req.user.sub);
		//console.log(follows_clean);
		// lo que hace $in es  recorrer el array y asi ejecutar el find()   -- el sort('created_at') lo que hace es acomodar los datos x fecha mas reciente
		Publication.find({user: {'$in': follows_clean}}).sort('-created_at').populate('user').paginate(page,itemsPerPage,(err,publications,total)=>{
			if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});
			if(!publications) return res.status(404).send({message: 'no hay publicaciones'});
			
			return res.status(200).send({
				total_items: total,
				pages: Math.ceil(total/itemsPerPage),
				page:page,
				items_per_page: itemsPerPage,
				publications
			});
		});

	});
}
function getUserPublications(req,res) {
	var page =1;
	if(req.params.page){
		page =req.params.page;
	}
	var itemsPerPage =4;
	
	var user = req.user.sub;
	
	if(req.params.user){
		user= req.params.user;
	}

	Publication.find({user: user}).sort('-created_at').populate('user').paginate(page,itemsPerPage,(err,publications,total)=>{
			if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});
			if(!publications) return res.status(404).send({message: 'no hay publicaciones'});
			
			return res.status(200).send({
				total_items: total,
				pages: Math.ceil(total/itemsPerPage),
				page:page,
				items_per_page: itemsPerPage,
				publications
			});
	});	
}
function getPublication(req,res) {
	var publicationId = req.params.id;
	Publication.findById(publicationId,(err,publication)=>{
		if(err) return res.status(500).send({message: 'Error al devolver la publicacion'});
		if(!publication) return res.status(404).send({message: 'No se ha obtenido la publicacion'});
		return res.status(200).send({
			publication: publication
		});
	});
}
function deletePublication(req,res) {
	var publicationId= req.params.id;
	Publication.findOneAndRemove({'user': req.user.sub,'_id':publicationId},(err,publicationRemoved)=> {
		
		if(err) return res.status(500).send({message: 'Error al borrar la publicacion'});
		if(!publicationRemoved) return res.status(404).send({message: 'No se ha borrado la publicacion'});
		
		return res.status(200).send({
			message: 'publicacion eliminada correctamente'
		});
	});
}

function uploadImage(req,res){
	var publicationId = req.params.id;
	
	if(req.files){

		var file_path = req.files.image.path;
	//	console.log(file_path);
		var file_split= file_path.split('\/');
	//	console.log(file_split);
		var file_name = file_split[2];
	//	console.log(file_name);
		var ext_split = file_name.split('\.');
	//	console.log(ext_split);
		var file_ext = ext_split[1];
	//	console.log(file_ext);
		
		if(file_ext == 'png'|| file_ext =='jpg' || file_ext == 'jpeg' || file_ext =='gif'){
			//Actualizar imagen en la BD
			
			Publication.findOne({'user':req.user.sub,'_id':publicationId}).exec((err,publication)=>{
				console.log(publication);
				if(publication){
					Publication.findByIdAndUpdate(publicationId,{file: file_name},{new: true},(err,publicationUpdate) =>{
						if(err) return res.status(500).send({message: 'Error en la peticion'});
						if(!publicationUpdate) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
						return res.status(200).send({publication: publicationUpdate});
					});		
				}else{
					return res.status(200).send({message: 'No tienes permisos para modificar esta publicaion'});
				}

			});

			
		}
		else{
			return removeFilesOfUploads(res,file_path,'Extension no Valida');	
		}

	}else{
		return res.status(200).send({message: 'No se han subido alguna imagen'});
	}

}
function removeFilesOfUploads(res,file_path,message)
{
	fs.unlink(file_path,(err) =>{
				return res.status(200).send({message: message});
			});
}
function getImageFile(req,res){
	var image_file = req.params.imageFile;
	var path_file = './uploads/publications/'+image_file;

	fs.exists(path_file,(exists) =>{
		if(exists){
			res.sendFile(path.resolve(path_file));	
		}else{
		 return	res.status(200).send({message: 'No existe la imagen'});
		}
		
	}); 

}



module.exports= {
	probando,
	savePublication,
	getPublications,
	getUserPublications,
	getPublication,
	deletePublication,
	uploadImage,
	getImageFile
}