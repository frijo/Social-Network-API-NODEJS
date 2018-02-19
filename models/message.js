'use strict'

var moongose= require('moongose');
var Schema = moongose.Schema;

var MessageSchema = Schema({
	text: String,
	created_at: String,
	emitter: { type: Schema.ObjectId, ref: 'User'},
	reciber: { type: Schema.ObjectId, ref: 'User'}


});
module.exports = moongose.model('Message',MessageSchema);