'use strict'
var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');



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
	var params = req.body;
	
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
module.exports ={
	home,
	pruebas,
	saveUser,
	loginUser
}
