var TAG = 'config.mongoose';
var mongoose = require('mongoose');

function config(app, next){
	var options = {
		server: {
			socketOptions: {
				keepAlive: 1
			}
		}
	};

	var attempts = 10;
	function connect(){
		if(--attempts <= 0){
			app.error(TAG, 'Failed to connect multiple times');
			process.exit(1);
			return;
		}
		setTimeout(function (){
			mongoose.connect(app.config.db, options);
		}, 20);
	}
	
	mongoose.connection.on('error', console.error);
	mongoose.connection.on('disconnected', connect);
	mongoose.connection.once('open', function () {
		attempts = 50;
		next();
	});
	
	connect();
}

module.exports = config;