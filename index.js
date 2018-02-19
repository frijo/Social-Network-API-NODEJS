'use strict'
var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;


// Conexion a DB
mongoose.Promise= global.Promise;
mongoose.connect('mongodb://localhost:27017/curso_mean_social')
.then(() => {
	console.log('Conexion a la DB curso_mean_social se ha realizado exitosamente!!');
	// Crear Servidor
	app.listen(port,() => {
		console.log('Servidor corriendo en http://localhost:3800');
	});

}).catch(err => console.log(err));
