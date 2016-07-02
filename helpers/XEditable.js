/*
	Service to work with library X-Editable.

	Used for X-Editable posts

	POST /post
	{
	    name:  'username',  //name of field (column in db)
	    pk:    1            //primary key (record id)
	    value: 'superuser!' //new value
	}
*/
exports.handle = function(model) {
	return function(req, res, next){
		// console.log('update_x_editable'.red);
    var params = _.merge(req.params, req.query, req.body || {});
		var id = params.pk || params.id;
		var key = params.name || params.key;
		var value = params.value || null;

		if(!id || !key){
			return next('Id or Key are missing');
		}

		var Model = model;
		if(!Model){
			return next('There is a problem with the model!');
		}

		var clonedParams = {};
		clonedParams[key] = value;

		Model.update(id, clonedParams, function(err, models) {
			if(err) return next(err);
			if(!models || models.length === 0) return next('A problem occurred while updating model');

			// Because this should only update a single record and update
			// returns an array, just use the first item
			var model = models[0];

			// If the model is silent, don't use the built-in pubsub
			// (also ignore pubsub logic if the hook is not enabled)
			// if (sails.hooks.pubsub && !Model.silent) {
				// Model.publishUpdate(model.id, model.toJSON(), req.socket);
			// }

			return res.send(model);
		});
	}
}
