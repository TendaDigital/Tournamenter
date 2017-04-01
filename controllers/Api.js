const path = require('path')

var count = 0;
exports.ping = function (req, res){

	res.send({ping: count++});

}

exports.branding = (req, res) => {
  res.sendFile(path.resolve(app.config.appLogo));
}
