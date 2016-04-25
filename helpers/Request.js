var async = require('async');

/*
	Simple check if user's role is in allowed list, or
	if user role is not in denied list
*/
exports.isAllowed = function (user, allowed, denied){
	var role = user ? user.role : '' || '';

	if(allowed && allowed.indexOf(role) >= 0)
		return true;

	if(denied && denied.indexOf(role) < 0)
		return true;

	return false;
}

/*
	Generic Get (single object) for REST API
*/
exports.get = function (Model, options){
	options = _.defaults(options || {}, {
		allow: null,
		deny: null,
		renderFields: null,
		populate: '',
		populateFields: null,
		idKey: '_id',
	});

	return function (req, res, next) {

		// Checks if user is NOT allowed to access
		if(!exports.isAllowed(req.user, options.allow, options.deny)){
			return res.status(403).send('You do not have access to this content');
		}

		// Build where clause
		var where = {};
		where[options.idKey] = req.params.id;		

		Model.findOne(where)
			.populate(options.populate, options.populateFields)
			.exec(function (err, model){
			if(err) return next(err);

			// Send a 404 if none found
			if(!model)
				return res.status(404).send('Object not found');

			// Convert model
			model = model.toObject({minimize:false, virtuals: true});

			// Filter out a few fields
			if(_.isArray(options.renderFields))
				model = _.pick(model, options.renderFields);
			else if(_.isFunction(options.renderFields))
				model = options.renderFields(model, req);

			res.send(model);
		});
	}
}


/*
	Generic find and rendering for REST API
*/
exports.find = function (Model, options){
	options = _.defaults(options || {}, {
		allow: null,
		deny: null,
		queryFields: null,
		renderFields: null,
		populate: '',
		populateFields: null,
	});

	return function (req, res, next) {

		// Checks if user is NOT allowed to access
		if(!exports.isAllowed(req.user, options.allow, options.deny)){
			return res.status(403).send('You do not have access to this content');
		}

		// Find all query params
		var params = _.merge({}, req.params, req.query);

		// Filter out query properties (starting with $)
		params = _.omit(params, function (val, key){
			return _.startsWith(key, '$');
		});

		// Filter query params if any
		if(options.queryFields)
			fields = _.pick(params, options.queryFields);

		// Build Query
		var query = Model.find(params);

		// Select query params
		var queryParams = _.pick(req.query, function (val, key){
			return _.startsWith(key, '$');
		});

		// Apply query parameters
		queryParams = _.defaults(queryParams, {
			$page: 1,
			$limit: 10,
			$sort: '-createdAt',
		});

		// Filter values
		queryParams.$page = Math.max(queryParams.$page * 1, 1);
		queryParams.$page = Math.min(queryParams.$page * 1, 1000);
		queryParams.$limit = Math.max(queryParams.$limit * 1, 1);
		
		// if(_.isString(queryParams.$sort)){
		// 	console.log(queryParams.$sort);
		// 	queryParams.$sort = {};
		// }
		// 	// queryParams.$sort = JSON.parse(queryParams.$sort) || {};

		query = query.limit(queryParams.$limit);
		query = query.skip((queryParams.$page - 1) * queryParams.$limit);
		query = query.sort(queryParams.$sort);
		query = query.populate(options.populate, options.populateFields);

		// Build count query
		var queryCount = Model.count(params);
		
		// Build queries (and adds count if needed)
		var queries = {
			models: query.exec.bind(query),
			count: queryCount.exec.bind(queryCount),
		};

		async.parallel(queries, function (err, data){
			if(err) return next(err);

			// Convert to Object
			var models = _.map(data.models, function (m){
				return m.toObject({minimize: false, virtuals: true});
			});

			// Filter out a few fields
			if(_.isArray(options.renderFields)){
				models = _.map(models, function(m) {
					return _.pick(m, options.renderFields);
				});
			}else if(_.isFunction(options.renderFields)){
				models = options.renderFields(models, req);
			}

			var out = {
				limit: queryParams.$limit,
				page: queryParams.$page,
				sort: queryParams.$sort,
				count: data.count,
				pages: Math.ceil(data.count / queryParams.$limit),
				models: models,
			};
		
			res.send(out);
		
		});
	}
}

/*
	Generic Create REST method
*/
exports.create = function (Model, options){
	options = _.defaults(options || {}, {
		allow: null,
		deny: null,
		createFields: null,
		renderFields: null,
	});

	return function (req, res, next){

		// Checks if user is NOT allowed to access
		if(!exports.isAllowed(req.user, options.allow, options.deny)){
			return res.status(403).send('You do not have access to this content');
		}

		var params = _.merge({}, req.params, req.query, req.body);
		console.log(params);

		// Filter create fields if any
		if(options.createFields)
			params = _.pick(params, options.createFields);

		var model = new Model(params);

		model.save(function (err, model){
			if(err) return next(err);

			// Convert model
			model = model.toObject({minimize:false, virtuals: true});

			// Filter out a few fields
			if(_.isArray(options.renderFields))
				model = _.pick(model, options.renderFields);
			else if(_.isFunction(options.renderFields))
				model = options.renderFields(model, req);

			res.send(model);
		});
	}
}

/*
	Generic Update REST method
*/
exports.update = function (Model, options){
	options = _.defaults(options || {}, {
		allow: null,
		deny: null,
		updateFields: null,
		renderFields: null,
		populate: '',
		populateFields: null,
		idKey: '_id',
	});

	return function (req, res, next){
		// Checks if user is NOT allowed to access
		if(!exports.isAllowed(req.user, options.allow, options.deny)){
			return res.status(403).send('You do not have access to this content');
		}

		var params = _.merge({}, req.params, req.query, req.body);

		// Build where clause
		var where = {};
		where[options.idKey] = req.params.id;

		// Filter create fields if any
		if(options.updateFields)
			params = _.pick(params, options.updateFields);

		Model.findOneAndUpdate(where, params, {new: true})
			.populate(options.populate, options.populateFields)
			.exec( function (err, model){
			if(err) return next(err);

			// Send a 404 if none found
			if(!model)
				return res.status(404).send('Object not found');

			// Convert model
			model = model.toObject({minimize:false, virtuals: true});

			// Filter out a few fields
			if(_.isArray(options.renderFields))
				model = _.pick(model, options.renderFields);
			else if(_.isFunction(options.renderFields))
				model = options.renderFields(model, req);

			res.send(model);
		});
	}
}

/*
	Generic Destroy REST method
*/
exports.destroy = function (Model, options){
	options = _.defaults(options || {}, {
		allow: null,
		deny: null,
		renderFields: null,
		populate: '',
		populateFields: null,
		idKey: '_id',
	});

	return function (req, res, next){
		// Checks if user is NOT allowed to access
		if(!exports.isAllowed(req.user, options.allow, options.deny)){
			return res.status(403).send('You do not have access to this content');
		}

		// Build where clause
		var where = {};
		where[options.idKey] = req.params.id;

		Model.findOneAndRemove(where)
			.populate(options.populate, options.populateFields)
			.exec( function (err, model){
			if(err) return next(err);

			// Send a 404 if none found
			if(!model)
				return res.status(404).send('Object not found');

			// Convert model
			model = model.toObject({minimize:false, virtuals: true});

			// Filter out a few fields
			if(_.isArray(options.renderFields))
				model = _.pick(model, options.renderFields);
			else if(_.isFunction(options.renderFields))
				model = options.renderFields(model, req);

			res.send(model);
		});
	}
}