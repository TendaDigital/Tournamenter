module.exports = function(req, res, next) {

	// If no Password is set on enviroment vars, we skip this policy
	if(!process.env.PASSWORD) return next();

	// User is allowed, proceed to the next policy,
	// or if this is the last policy, the controller
	if (req.session.authentication == process.env.PASSWORD)
		return next();

	// User is not allowed
	// (default res.forbidden() behavior can be overridden in `config/403.js`)
	return res.redirect('/login');
}
