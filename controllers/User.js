module.exports = {

	login: function(req, res, next){
		var realPassword = process.env.PASSWORD;
		var password = req.param('password') || req.body.password;

		// Redirect if no password required or user is already logged in
		if(!realPassword || realPassword == req.session.authentication)
			return res.redirect('/');

		/*
			Check if password is ok, and save
			it in the user session
		*/
		if(password == realPassword){
			req.session.authentication = realPassword;
			res.redirect('/');
		}else{
			delete req.session.authentication;

			// Render login view and show wrong password error if needed
			res.view({
				wrongPassword: (realPassword && password)
			});
		}
	},

	logout: function(req, res, next){
		// Logout and redirect to login if password exist
		delete req.session.authentication;
		if(process.env.PASSWORD)
			res.redirect('/login');
	},


	/**
	* Overrides for the settings in `config/controllers.js`
	* (specific to TeamsController)
	*/
	_config: {
		menus: [
			{name: 'Logout', path: '/logout', order: 999}
		]
	}

};

// Clear Logout item in menu if no password is given
if(!process.env.PASSWORD)
	delete module.exports._config.menus;
