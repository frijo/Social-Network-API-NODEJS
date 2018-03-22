'use strict'
var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate =require('mongoose-pagination');
var jwt = require('../services/jwt');
var fs = require('fs');
var path =  require('path');


 // rutas
function home(req,res){
	
	res.status(200).send({
		message: "Inicio de servidor NodeJS"
	});
}

function pruebas(req,res){
	//console.log(req.body);
	res.status(200).send({
		message: "Accion de pruebas de servidor NodeJS"
	});
}
function saveUser(req,res) {
	
	var params = req.body;
	var user = new User();
	if(params.name && params.surname && params.nick && params.email && params.password){
		
		user.name = params.name;
		user.surname = params.surname;
		user.nick= params.nick
		user.email=params.email;
		user.role = 'ROLE_USER';
		user.image = null;
		
		//Busca si exite un usuario en la BD
		User.find({ $or: [
							{email: user.email.toLowerCase()},
							{nick: user.nick.toLowerCase()}
						 ]}).exec((err, users) => {
								if(err) return res.status(500).send({message: 'Error en la peticion de Usuarios'});
								if(users && users.length >= 1){
									return res.status(200).send({message: 'Este usuario que intentas registar ya existe en nuestra BD'});
								}else{
									//Encrypta password y guarda en la base de datos
									bcrypt.hash(params.password,null,null,(err, hash) =>{
										user.password=hash;
										user.save((err,userStored)=>{
											if(err) return res.status(500).send({message: 'Error al guardar el Usuario'});
											if(userStored){
												res.status(200).send({user: userStored});
											}else{
												res.status(404).send({message: 'No se ha registrado el Usuario'});
											}	
										});
									});
								} 
							});
	}
	else{
		res.status(200).send({
			message: 'Llena todos los campos necesarios'
		});
	}


}
function loginUser(req,res) {
	var params = req.body;// se usa  Body cuando son metodos POST  o PUT
	
	var email = params.email
	var password = params.password;

	User.findOne({email: email},(err,user) => {
		if(err) return status(500).send({message: 'Error en la peticion'});
		if(user){
			bcrypt.compare(password,user.password,(err,check)=>{
				if(check){
					//devilver datos de usuarios
					if(params.gettoken){
						//generar y devolver token
						return res.status(200).send({
							token: jwt.createToken(user)
						}); 


					}else{
						user.password = undefined; // quita la propiedad password para que se envie  x el json a la vista	
						return res.status(200).send({user});
					}



					
				}else{
					return res.status(404).send({message: 'El usuario no puede iniciar sesion'});
				}
			});
		}else{
			return res.status(404).send({message: 'El usuario no se puede identficar'});
		}	
	}); 
}
// Conseguir datos del usuario
function getUser(req,res){
	var userId= req.params.id;//se Usa paramsn cuando son metodos GET
	User.findById(userId,(err,user) =>{
		if(err) return res.status(500).send({message: 'Error en la peticion'});
		if(!user) return res.status(404).send({message: 'El usuario no existe'});
		//Verifica si ese usuario que buscas te esta siguendo
		followThisUser(req.user.sub,userId).then((value) => {
			user.password= undefined;
			return res.status(200).send({user,following: value.following,followed: value.followed});	
		});
	});
}
/*async function followThisUser(indentity_user_id,user_id){

	var following = await Follow.findOne({'user':indentity_user_id,'followed':user_id}).exec((err,follow)=>{
		if(err) return handleError(err);
		return follow;
	});
	var followed = await Follow.findOne({'user':user_id,'followed':indentity_user_id}).exec((err,follow)=>{
		if(err) return handleError(err);
		return follow;
	});

	return{
		following: following,
		followed: followed
	}

}*/

//Metodo Asincorono que busca los usuarios que Sigues y que te siguen

async function followThisUser(identity_user_id, user_id){
    try {
        var following = await Follow.findOne({ user: identity_user_id, followed: user_id}).exec()
            .then((following) => {
                return following;
            })
            .catch((err)=>{
                return handleError(err);
            });
        var followed = await Follow.findOne({ user: user_id, followed: identity_user_id}).exec()
            .then((followed) => {
                return followed;
            })
            .catch((err)=>{
                return handleError(err);
            });
        return {
            following: following,
            followed: followed
        }
    } catch(err){
        return handleError(err);
    }
}


//Devuelve listado de los Usuarios-- Se usa libreria mongoose pagination
function getUsers(req,res){

	var indentity_user_id = req.user.sub;
	var page =1;
	if(req.params.page){
		page = req.params.page;
	}
	var itemsPerPage=5;
	User.find().sort('_id').paginate(page,itemsPerPage,(err,users,total) =>{
		if(err) return res.status(500).send({message: 'Error en la peticion'});
		if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});
		
		followUsersIds(indentity_user_id).then((value)=>{
			return res.status(200).send({
				users,
				users_following: value.following,
				users_follow_me: value.followed,
				total,
				pages: Math.ceil(total/itemsPerPage)
			});	
		});
		
	});
}
async function followUsersIds(user_id){
	try{

		var following = await Follow.find({'user':user_id}).select({'_id': 0, '_v': 0,'user':0}).exec().then((follows)=>{//el select '_id': 0, '_v': 0,'user':0 lo que hace es indicar que no quiere obtener esos datos x eso es el 0 
			
			var follows_clean=[];
			
			follows.forEach((follow)=>{
				follows_clean.push(follow.followed);
			});

			return follows_clean;
		}).catch((err)=>{

			return handleError(err);

		});

		var followed = await Follow.find({'followed':user_id}).select({'_id': 0, '_v': 0,'followed':0}).exec().then((follows)=>{
			
			var follows_clean=[];
			
			follows.forEach((follow)=>{
				follows_clean.push(follow.user);
			});
			
			return follows_clean;
		}).catch((err)=>{

			return handleError(err);
		
		});

		return {
			following: following,
			followed:followed
		}	
	}catch(err){
		return handleError(err);
	}
	
}
function getCounters(req,res){ 
	var userId =req.user.sub;
	if(req.params.id){
	
	userId = req.params.id;
		
	}
	getCountFollow(userId).then((value)=>{
			return res.status(200).send(value);
	});
}
async function getCountFollow(user_id){
	try{
		
		var following= await Follow.count({'user': user_id}).exec().then((following_count)=>{
			return following_count;
		}).catch((err)=>{
			return handleError(err);
		});

		var followed= await Follow.count({'followed':user_id}).exec().then((followed_count)=>{
			return followed_count;
		}).catch((err)=>{
			return handleError(err);
		});

		var publications = await Publication.count({'user': user_id}).exec().then((publications_count)=>{
			return publications_count;
		}).catch((err)=>{
			return handleError(err);
		});
	}catch(err){
		return handleError(err);
	}
	return {
		following: following,
		followed: followed,
		publications: publications
	}
}

function updateUser(req,res){
	var userId= req.params.id;//GET  se obtiene el ID de la URL
	var update = req.body; //PUT se obtiene los parametros
	//borrar propiedad password
	delete update.password;


	if(userId!= req.user.sub){  //Verifica que el ID del parametro dela URL y el del Token sean el mismo
		return res.status(500).send({message: 'No tienes permiso para modificar este usuario'});
	}
	User.find({$or:[
		{email: update.email.toLowerCase()},
		{nick: update.nick.toLowerCase()}
	]}).exec((err,users)=>{
		var user_isset = false;
		users.forEach((user) => {
			if(user && user._id != userId) user_isset =true;	
		});

		 if(user_isset) return res.status(404).send({message: 'Los  datos ya estan en uso'});		
		
		User.findByIdAndUpdate(userId,update,{new:true},(err,userUpdate)=>{ //con mongoose y mongoDB al devolver la variable envia los datos anteriores(los datos si se actualizan con los nuevos valores) a la actualizacion.... {new:true}  hace que devuelva los datos nuevos
			if(err) return res.status(500).send({message: 'Error en la peticion'});
			if(!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

			return res.status(200).send({user: userUpdate});
		});	
	});
	
}
function uploadImage(req,res){
	var userId = req.params.id;
	
	if(req.files){

		var file_path = req.files.image.path;
		console.log(file_path);
		var file_split= file_path.split('\/');
		console.log(file_split);
		var file_name = file_split[2];
		console.log(file_name);
		var ext_split = file_name.split('\.');
		console.log(ext_split);
		var file_ext = ext_split[1];
		console.log(file_ext);
		if(userId!= req.user.sub){
		
			return removeFilesOfUploads(res,file_path,'No tienes permisos para actualizar datos del Usuario');
		}
		if(file_ext == 'png'|| file_ext =='jpg' || file_ext == 'jpeg' || file_ext =='gif'){
			//Actualizar imagen en la BD
			User.findByIdAndUpdate(userId,{image: file_name},{new: true},(err,userUpdate) =>{
				if(err) return res.status(500).send({message: 'Error en la peticion'});
				if(!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
				return res.status(200).send({user: userUpdate});
			});
		}
		else{
			return removeFilesOfUploads(res,file_path,'Extension no Valida');	
		}

	}else{
		return res.status(200).send({message: 'No se han subido alguna imagen'});
	}

}
function getImageFile(req,res){
	var image_file = req.params.imageFile;
	var path_file = './uploads/users/'+image_file;

	fs.exists(path_file,(exists) =>{
		if(exists){
			res.sendFile(path.resolve(path_file));	
		}else{
		 return	res.status(200).send({message: 'No existe la imagen'});
		}
		
	}); 

}
function removeFilesOfUploads(res,file_path,message)
{
	fs.unlink(file_path,(err) =>{
				return res.status(200).send({message: message});
			});
}

module.exports ={
	home,
	pruebas,
	saveUser,
	loginUser,
	getUser,
	getUsers,
	getCounters,
	updateUser,
	uploadImage,
	getImageFile
}
