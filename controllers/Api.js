var count = 0;

exports.ping = function (req, res){

	res.send({hello: 'world', count: count++});

}
