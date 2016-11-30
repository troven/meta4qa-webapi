var pkg = require("../../package");
var assert = require('assert');
var request = require('request');
var fs = require('fs');
var path = require('path');
var debug = require('debug')("dialect:webapi");
var meta4qa = require('meta4qa'),
	helps = meta4qa.helpers,
	files = helps.files,
	http = helps.http,
    _ = meta4qa._;
var speakeasy = require("speakeasy");
var webapi = helps.webapi = require("../helpers/webapi");

/**
 * Web API
 * Configures the Yadda parser with phrases that support operations on HTTP APIs
 *
 * @module Web API Dialect
 * @class Web API
 *
 */

var WebAPI = module.exports = function (learn, config) {

	var VERBOSE = false;

	// ******** GIVEN ********


	/**
	 * Add a client certificate to an HTTP request.
	 * The certificate itself is defined in the config.json file.
	 *
	 *      I use a $CERT client certificate
	 *
	 *      I use an $CERT client certificate
	 *
	 * @example
	 *
	 *      I use a valid client certificate
	 *
	 * @method Use Client Certificate
	 * @param {String} cert - certificate name
	 */
	learn.given(["I use a $CERT client certificate", "I use an $CERT client certificate"], function (certName, done) {
		assert(this.certificates, "No client certificates");
		var cert = this.certificates[certName];
		assert(cert, "Missing a '" + certName + "' certificate");
		var cert_dir = this.paths.certificates || this.paths.files || this.files;
		assert(cert_dir, "Missing cert directory: " + cert_dir);
		assert(helps.files.exists(cert_dir), "Cert directory not found: " + cert_dir);
		http.certificate(this.request, cert, {}, cert_dir);
		this.request.requestCert = true;
		done && done();
	});

	/**
	 * Set an HTTP Header to a value
	 *
	 *      I set $header header to $value
	 *
	 *      I set header $header = $value
	 *
	 * @example
	 *
	 *      I set header Accept to application/json
	 *
	 * @method Set HTTP Request Header
	 * @param {String} name - header name
	 * @param {String} value - header value
	 */
	learn.given(["I set $header header to $value", "I set header $header = $value"], function (name, value, done) {
		// debug("HTTP header %s => %s", name, value);
		this.request.headers[name] = value;
		done && done();
	})

	/**
	 * Set an HTTP Header from a variable
	 *
	 *      I set $header header from $varname
	 *
	 * @example
	 *
	 *      I set test = 123
	 *      I set header x-my-header from test
	 *
	 * @method Set HTTP Request Header
	 * @param {String} name - header name
	 * @param {String} varname - a scoped variable name
	 */
	learn.given(["I set $header header from $varname", "I set header $header from $varname"], function (name, varname, done) {
		var value = helps.vars.find(this, varname);
		// debug("HTTP header %s => (%s) %s", name, varname, value);
		this.request.headers[name] = value;
		done && done();
	})

	/**
	 * Add an HTTP Query Parameter to the Request
	 *
	 *      I set parameter $key to $value
	 *
	 *      I set $key parameter to $value
	 *
	 *      I set $key param to $value
	 *
	 *      I set param $key to $value
	 *
	 * @example
	 *
	 *      I set parameter api_key to ABCD1234
	 *
	 * @method Set HTTP Request Parameter
	 * @param {String} name - query parameter name
	 * @param {String} value - query parameter value
	 */

	learn.given(["I set parameter $key to $value", "I set $key parameter to $value", "I set $key param to $value", "I set param $key to $value"], function (key, value, done) {
		this.request.qs[key] = value;
		done && done();
	});

	learn.given(["I set parameter $key from $varname", "I set $key parameter from $varname", "I set $key param from $varname", "I set param $key from $varname"], function (key, varname, done) {
		this.request.qs[key] = helps.vars.get(this, varname);
		done && done();
	});

	learn.given(/^I set headers to$/, function (headers, done) {
		done && done();
	});

	learn.given(["I use basic authentication", "I login", "I authenticate"], function (done) {
		assert(this.agent, "Missing user agent - refer to config JSON");

		http.authorize(this.request, this.agent);
		debug("authorised: %j ", this.agent);
		done && done();
	});

	learn.given(["I use basic authentication as $agent", "I login as $agent"], function (agent, done) {
		assert(this.agents, "Missing user agents - refer to config JSON");
		var credentials = this.agents[agent];
		assert(credentials, "Missing user agent: " + agent);

		http.authorize(this.request, credentials);
		debug("authorised: %j ", credentials);
		done && done();
	});

	/**
	 * Use OAUTH flow to authenticate using default agent
	 *
	 *      I use OAuth2
	 *
	 *      I use oauth
	 *
	 * @example
	 *
	 *      I use oauth
	 *
	 * @method Use Client Credentials to authenticate as default agent
	 *
	 */

	learn.given(["I use OAuth2", "I use oauth", "I use OAuth2 credentials", "I use oauth credentials"], function (done) {
		assert(this.agent, "Missing default agent");
		if (this.agent.access_token) {
			http.bearer(this.request, this.agent.access_token);
			done && done();
		} else {
			var self = this;
			http.client_credentials(this, this.agent, function (err, json) {
				if (err) {
					throw new Error(err);
				}
				vars.set(self.agent, "access_token", json.access_token);
				http.bearer(self.request, self.agent.access_token);
				done && done(err, json);
			});
		}
	});

	/**
	 * Use OAUTH flow to authenticate using a named agent
	 *
	 *      I use OAuth2 credentials as $agent
	 *
	 *      I use oauth credentials as $agent
	 *
	 *      I use client-credentials as $agent
	 *
	 * @example
	 *
	 *      I use client-credentials as default
	 *
	 * @method Use Client Credentials to authenticate
	 * @param {String} agent - named agent
	 */

	learn.given(["I use OAuth2 credentials as $agent", "I use oauth credentials as $agent", "I use client-credentials as $agent"], function (agent, done) {
		assert(this.agents, "Missing agents");
		assert(agent, "Missing agent");
		assert(this.agents[agent], "Missing agent: " + agent);

		http.client_credentials(this, this.agents[agent], function (err, json) {
			vars.set(self.agent, "access_token", json);
			http.bearer(this.request, self.agent.access_token);
			done && done(err, json);
		});
	});

	/**
	 * Set a named HTTP cookie to value
	 *
	 *     I set cookie $cookie to $value
	 *
	 *     I set cookie $cookie = $value
	 *
	 * @example
	 *
	 *     I set cookie my-tag = abc-1234
	 *
	 * @method Set named cookies
	 * @param {String} name - cookie name
	 * @param {String} value - cookie value
	 */

	learn.given(["I set cookie $cookie to $value", "I set cookie $cookie = $value"], function (name, value, done) {
		this.request.jar = this.cookies;
		this.request.cookie(name + "=" + value);
		done && done();
	});

	/**
	 * Set a named HTTP timeout to a time in milliseconds
	 *
	 *     I set request timeout to $time
	 *
	 * @example
	 *
	 *     GIVEN I set request timeout to 3000
	 *
	 * @method Set HTTP timeout
	 * @param {String} timeout - duration in milliseconds
	 */

	learn.given(["I set request timeout to $time"], function (timeInMillis, done) {
		this.request.timeout = timeInMillis ? timeInMillis : 10000;
		debug("HTTP timeout: %j ", this.request.timeout);
		done && done();
	});

	/**
	 * Enable HTTP keep-alive
	 *
	 *     I enable keep-alive
	 *
	 * @example
	 *
	 *     GIVEN I enable keep-alive
	 *
	 * @method Enable HTTP keep alive
	 */

	learn.given(["I enable keep alive"], function (done) {
		this.request.forever = true;
		done && done();
	});

	/**
	 * Disable HTTP keep-alive
	 *
	 *     I disable keep-alive
	 *
	 * @example
	 *
	 *     GIVEN I disable keep-alive
	 *
	 * @method Disable HTTP keep alive
	 */


	learn.given(["I disable keep alive"], function (done) {
		this.request.forever = false;
		done && done();
	})

	/**
	 * Enable HTTP GZIP compression
	 *
	 *     I enable gzip
	 *
	 * @example
	 *
	 *     GIVEN I enable gzip
	 *
	 * @method Enable HTTP GZIP compression
	 */

	learn.given(["I enable gzip"], function (done) {
		this.request.gzip = true;
		done && done();
	})

	/**
	 * Disable HTTP GZIP compression
	 *
	 *     I disable gzip
	 *
	 * @example
	 *
	 *     GIVEN I disable gzip
	 *
	 * @method Disable HTTP GZIP compression
	 */

	learn.given(["I disable gzip"], function (done) {
		this.request.gzip = false;
		done && done();
	})

	learn.given(["I set encoding to $encoding"], function (encoding, done) {
		this.request.encoding = encoding ? encoding : "utf8";
		done && done();
	})

	learn.given(["I enable redirects"], function (done) {
		this.request.followRedirect = true;
		done && done();
	})

	learn.given(["I disable redirects"], function (done) {
		this.request.followRedirect = false;
		done && done();
	})

	learn.given(["I enable strict SSL"], function (done) {
		this.request.strictSSL = true;
		done && done();
	})

	learn.given(["I disable strict SSL"], function (done) {
		this.request.strictSSL = false;
		done && done();
	})

	learn.given(["I enable client certificates"], function (done) {
		this.request.requestCert = true;
		done && done();
	})

	learn.given(["I disable client certificates"], function (done) {
		this.request.requestCert = false;
		done && done();
	})

	learn.given(["I request JSON"], function (done) {
		this.request.headers['Content-Type'] = this.request.headers['Content-Type'] || "application/json";
		done && done();
	})

	learn.when(["I upload $file"], function (file, done) {
		http.header(this.request, "Content-Type", helps.webapi.EXT_TO_MIME.xml);
		webapi.uploadFormFile(this, "files", file, done);
	});

	learn.when(["I upload $path $file"], function (path, file, done) {
		webapi.uploadFormFile(this, path, file, done);
	});

	learn.when(["I upload $path from $file"], function (path, file, done) {
		webapi.uploadFormFile(this, path, file, done);
	});

	learn.given(["I send $path $file as body", "I upload $path $file as body", "I send $path $file as attachment", "I upload $path $file as attachment"], function (file, done) {
		webapi.attachFile(this, path, file, done);
	});

	learn.given(["I send $file as body", "I upload $file as body", "I send $file as attachment", "I upload $file as attachment"], function (file, done) {
		webapi.attachFile(this, "files", file, done);
	});

	/**
	 * Set HTTP response to payload. Objects are sent as JSON, everything else as BODY text.
	 *
	 *     I set body to $payload
	 *
	 * @example
	 *
	 *     I set body to hello world
	 *
	 * @method Set HTTP response
	 * @param {String} payload - JSON or text payload
	 */

	learn.given(["I set body to $payload"], function (value, done) {
		assert(value != undefined, "Payload is undefined");

		if (_.isString(value)) {
			this.request.body = value;
			debug("set HTTP body: %j ", value);
		} else {
			this.request.json = value;
			debug("set HTTP json body: %j ", value);
		}
		done && done();
	});

	learn.given(["I set body from $varname"], function (name, done) {
		var value = helps.vars.find(this, name);
		assert(value != undefined, "Variable " + name + " is undefined");

		if (_.isString(value)) {
			this.request.body = value;
			debug("set HTTP body: %j ", value);
		} else {
			this.request.json = value;
			debug("set HTTP json body: %j ", value);
		}
		done && done();
	});

	learn.given(["I set text body from $varname"], function (name, done) {
		var value = helps.vars.find(this, name);
		assert(value != undefined, "Variable " + name + " is undefined");
		this.request.body = JSON.stringify(value);
		debug("set HTTP text body: %j ", value);
		done && done();
	});

	/**
	 * Set HTTP response to CSV payload.
	 *
	 *     I set body to CSV:
	 *     ------------
	 *     $CSV
	 *     ------------
	 *
	 *     I send CSV:
	 *     ------------
	 *     $CSV
	 *     ------------
	 *
	 * @example
	 *
	 *     I set body to CSV:
	 *     ------------
	 *     what, who
	 *     hello, world
	 *     ------------
	 *
	 * @method Set HTTP response
	 * @param {String} payload - JSON or text payload
	 */

	learn.given(["I set body to CSV:\n$CSV", "I send CSV:\n$CSV"], function (value, done) {
		this.request.json = value;
		done && done();
	});

	/**
	 * Set HTTP response to JSON payload.
	 *
	 *     I set body to JSON:
	 *     ------------
	 *     $JSON
	 *     ------------
	 *
	 *     I send JSON:
	 *     ------------
	 *     $JSON
	 *     ------------
	 *
	 * @example
	 *
	 *     I set body to JSON:
	 *     ------------
	 *     { "what": "hello", "who": "world" }
	 *     ------------
	 *
	 * @method Set HTTP response
	 * @param {String} payload - JSON or text payload
	 */

	learn.given(["I set body to JSON:\n$JSON", "I send JSON:\n$JSON"], function (value, done) {
		assert(this.request, "Missing HTTP request");
		this.request.json = value;
		done && done();
	});

	/**
	 * Set HTTP response to JSON payload.
	 *
	 *     I set body to JSON:
	 *     ------------
	 *     $JSON
	 *     ------------
	 *
	 *     I send JSON:
	 *     ------------
	 *     $JSON
	 *     ------------
	 *
	 * @example
	 *
	 *     I set body to JSON:
	 *     ------------
	 *     { "what": "hello", "who": "world" }
	 *     ------------
	 *
	 * @method Set HTTP response
	 * @param {String} payload - JSON or text payload
	 */

	learn.given(["I set body to XML:\n$XML", "I send XML:\n$XML"], function (value, done) {
		assert(this.request, "Missing HTTP request");
		debug("Body XML: %s", value);

		http.header(this.request, "Content-Type", helps.webapi.EXT_TO_MIME.xml);
		this.request.body = value;
		done && done();
	});

	/**
	 * Set HTTP response to raw (text) payload.
	 *
	 *     I set body to:
	 *     ------------
	 *     $TEXT
	 *     ------------
	 *
	 *     I send:
	 *     ------------
	 *     $TEXT
	 *     ------------
	 *
	 * @example
	 *
	 *     I set body to:
	 *     ------------
	 *     Hello World
	 *     ------------
	 *
	 * @method Set HTTP response
	 * @param {String} text payload
	 */

	learn.given(["I set body to:\n$TEXT", "I send:\n$TEXT"], function (value, done) {
		this.request.body = value;
		done && done();
	});

	/**
	 * Issue an HTTP GET request to default target or an absolute URL.
	 * The @target annotation is used to select a target
	 *
	 *     I GET $resource
	 *
	 * @example
	 *
	 *     I GET /
	 *     I GET http://example.com
	 *
	 * @method Send HTTP GET request
	 * @param {String} resource - target resource path or full URL
	 */

	learn.when("I GET $resource", function (resource, done) {
		assert(resource, "Missing GET resource");
		assert(done, "Missing callback");
		assert(this.request, "Missing request");
        assert(this.target, "Missing target");
		var cmd = http.command("GET", resource, this.request, this.target);
		request(cmd, http.handleResponse(this, done));
	});

	learn.when("I GET JSON from $resource", function (resource, done) {
		assert(resource, "Missing GET resource");
		assert(done, "Missing callback");
		assert(this.request, "Missing request");
        assert(this.target, "Missing target");
		var cmd = http.command("GET", resource, this.request, this.target);
		cmd.json = true;
		request(cmd, http.handleResponse(this, done));
	});

	/**
	 * Issue an HTTP POST request to default target or an absolute URL.
	 * The @target annotation is used to select a target
	 *
	 *     I POST $resource
	 *
	 * @example
	 *
	 *     I POST /
	 *     I POST http://example.com
	 *
	 * @method Send HTTP POST request
	 * @param {String} resource - target resource path or full URL
	 */

	learn.when("I POST $resource", function (resource, done) {
		var cmd = http.command("POST", resource, this.request, this.target);
		var r = request(cmd, http.handleResponse(this, done));
	});

	/**
	 * Issue an HTTP PUT request to default target or an absolute URL.
	 * The @target annotation is used to select a target
	 *
	 *     I PUT $resource
	 *
	 * @example
	 *
	 *     I PUT /
	 *     I PUT http://example.com
	 *
	 * @method Send HTTP PUT request
	 * @param {String} resource - target resource path or full URL
	 */

	learn.when("I PUT $resource", function (resource, done) {
		var cmd = http.command("PUT", resource, this.request, this.target);
		request(cmd, http.handleResponse(this, done));
	});

	/**
	 * Issue an HTTP DELETE request to default target or an absolute URL.
	 * The @target annotation is used to select a target
	 *
	 *     I DELETE $resource
	 *
	 * @example
	 *
	 *     I DELETE /
	 *     I DELETE http://example.com
	 *
	 * @method Send HTTP DELETE request
	 * @param {String} resource - target resource path or full URL
	 */

	learn.when("I DELETE $resource", function (resource, done) {
		var cmd = http.command("DELETE", resource, this.request, this.target);
		request(cmd, http.handleResponse(this, done));
	});

	//learn.when("I $verb $resource", function(verb, resource, done) {
	//    var cmd = http.command(verb.toUpperCase(), resource, this.request, this.target );
	//    request(cmd, http.handleResponse(this, done));
	//});

	/**
	 * Issue an HTTP PATCH request to default target or an absolute URL.
	 * The @target annotation is used to select a target
	 *
	 *     I PATCH $resource
	 *
	 * @example
	 *
	 *     I PATCH /
	 *     I PATCH http://example.com
	 *
	 * @method Send HTTP PATCH request
	 * @param {String} resource - target resource path or full URL
	 */
	learn.when("I PATCH $resource", function (resource, done) {
		var cmd = http.command("PATCH", resource, this.request, this.target);
		request(cmd, http.handleResponse(this, done));
	});

	/**
	 * Issue an HTTP HEAD request to default target or an absolute URL.
	 * The @target annotation is used to select a target
	 *
	 *     I request HEAD for $resource
	 *
	 * @example
	 *
	 *     I request HEAD for /
	 *     I request HEAD for http://example.com
	 *
	 * @method Send HTTP HEAD request
	 * @param {String} resource - target resource path or full URL
	 */

	learn.when("I request HEAD for $resource", function (resource, done) {
		var cmd = http.command("HEAD", resource, this.request, this.target);
		request(cmd, http.handleResponse(this, done));
	});

	/**
	 * Issue an HTTP POST request to default target or an absolute URL.
	 * The @target annotation is used to select a target
	 *
	 *     I request OPTIONS for $resource
	 *
	 * @example
	 *
	 *     I request OPTIONS for /
	 *     I request OPTIONS for  http://example.com
	 *
	 * @method Send request for HTTP OPTIONS
	 * @param {String} resource - target resource path or full URL
	 */

	learn.when("I request OPTIONS for $resource", function (resource, done) {
		var cmd = http.command("OPTIONS", resource, this.request, this.target);
		request(cmd, http.handleResponse(this, done));
	});

	/**
	 * Set an OAUTH access_token both as scoped variable for use in subsequent requests.
	 * The $path parameter is a JSON path used to access the (non-standard) access_token from the current HTTP response.
	 *
	 *     I store body path $path as access token
	 *
	 * @example
	 *
	 *     I store body path $.access_token as access token
	 *
	 * @method Set access_token
	 * @param {String} token - valid oauth access token
	 */

	learn.when("I store body path $path as access token", function (path, done) {
		var access_token = http.findInPath(this.response.body, path);
		assert(access_token, "Body path " + path + " does not contains an access_token");
		this.vars.access_token = access_token;
		done && done();
	});

	/**
	 * Extra a value from the (JSON) body and store as a scoped variable
	 *
	 *     I store body path $path as $name
	 *
	 * @example
	 *
	 *     I store body path $.access_token as access-token
	 *
	 * @method Extract variable from a JSON response
	 * @param {String} path - JSON Path to extract variable
	 * @param {String} name - scoped variable to store result
	 */

	learn.when("I store body path $path as $name", function (path, name, done) {
		var value = http.findInPath(this.response.body, path);
		assert(value, "Value for " + path + " is empty");
		vars.set(this.vars, name, value);
		done && done();
	});

	/**
	 * Extract avalue from HTTP header and store as a scoped variable
	 *
	 *     I store header $header as $name
	 *
	 * @example
	 *
	 *     I store header ApiKey as client_id
	 *
	 * @method Extract variable from an HTTP header
	 * @param {String} header - name of header to extract
	 * @param {String} name - scoped variable to store result
	 */

	learn.when("I store header $header as $name", function (header, name, done) {
		header = header.toLowerCase();
		this.vars[name] = this.response.headers[header];
		done && done();
	});

    learn.when(["I parse body as JSON", "I convert body to JSON"], function (done) {
        this.response.body = JSON.parse(this.response.body);
        done && done();
    });

	/**
	 * Generate a TOTP token based on the shared secret and current time.
	 *
	 * @example
	 *
	 *     I use totp
	 *
	 */

	learn.when("I use totp", function (done) {
		assert(this.agent, "Missing agent");

		var agent = this.agent;
		assert(agent.totp, "Missing agent.totp");
		assert(agent.totp.secret, "Missing agent.totp.secret");

		agent.totp.token = speakeasy.totp({
			secret: agent.totp.secret,
			encoding: agent.totp.encoding || 'base32',
			window: agent.totp.window || 2,
			step: agent.totp.step || 60
		});

		done && done();
	});

	learn.when("I use totp as $agent", function (actor, done) {
		assert(this.agents, "Missing agents");
		assert(this.agents[actor], "Missing agent " + actor);

		var agent = this.agents[actor];
		assert(agent.totp, "Missing config for agent.totp");
		assert(agent.totp.secret, "Missing agent.totp.secret");

		agent.totp.token = speakeasy.totp({
			secret: agent.totp.secret,
			encoding: agent.totp.encoding || 'base32',
			window: agent.totp.window || 2,
			step: agent.totp.step || 60
		});

		done && done();
	});


	// ******** THEN ********

	learn.then("response code should be $code", function (code, done) {
		assert(this.response, "No HTTP response");
		var codes = code.split(",");
		var passed = false;
		var self = this;
		_.each(codes, function (code) {
			passed = passed || http.IsStatusCodeXX(code.trim(), self.response.statusCode);
		});
		assert(passed, "Status code is " + this.response.statusCode + " not " + code);
		done && done();
	});

	learn.then("response code should not be $code", function (code, done) {
		assert(this.response, "No HTTP response");
		var codes = code.split(",");
		var failed = false;
		var self = this;
		_.each(codes, function (code) {
			failed = failed || !http.IsStatusCodeXX(code.trim(), self.response.statusCode);
		});
		assert(failed, "Status code is " + this.response.statusCode);
		done && done();
	});


	learn.then(["elapsed time should be less than $elapsed", "duration should be less than $elapsed"], function (elapsed, done) {
		assert(this.stopwatch.duration < elapsed);
		done && done();
	});

	learn.then("header $header should be $value", function (header, value, done) {
		header = header.toLowerCase();
		assert(this.response.headers[header] == value, "Header " + header + " should match " + value + " but not " + this.response.headers[header]);
		done && done();
	});

	learn.then("header $header should contain $value", function (header, value, done) {
		header = header.toLowerCase();
		assert(this.response.headers[header].indexOf(value) >= 0, "Header " + header + " should contain " + value + " but does not: " + this.response.headers[header]);
		done && done();
	});

	learn.then("header $header should not be $value", function (header, value, done) {
		header = header.toLowerCase();
		assert(this.response.headers[header] != value, "Header " + header + " should not match " + value);
		done && done();
	});

	learn.then("header $header should exist", function (header, done) {
		header = header.toLowerCase();
		assert(this.response.headers[header], "Missing " + header + " header");
		done && done();
	});

	learn.then("header $header should not exist", function (header, done) {
		header = header.toLowerCase();
		assert(this.response.headers[header] == undefined, "Found " + header + " header");
		done && done();
	});

	learn.then(/^response body should be valid (xml|json)$/, function (contentType, done) {
		var simpleType = http.detectContentType(this.response.body);
		assert(simpleType == contentType, "Payload is "+simpleType+" not valid " + contentType.toUpperCase());
		done && done();
	});

	learn.then("/^response body should not be valid (xml|json)$/", function (contentType, done) {
		var simpleType = http.detectContentType(this.response.body);
		assert(simpleType != contentType, "Payload is valid " + contentType.toUpperCase());
		done && done();
	});

	learn.then("response body should contain $expression", function (expression, done) {
		var found = new RegExp(expression).test(this.response.body);
		assert(found, "Body does not contain /" + expression + "/");
		done && done();
	});

	learn.then("response body should not contain $expression", function (expression, done) {
		var found = new RegExp(expression).test(this.response.body);
		assert(!found, "Body contains /" + expression + "/");
		done && done();
	});

	learn.then(/^response body path (.*) should exist/, function (path, done) {
		var found = http.findInPath(this.response.body, path);
		assert(found, "Body path " + path + " not found");
		done && done();
	});

	learn.then(/^response body path (.*) should not exist/, function (path, done) {
		var found = http.findInPath(this.response.body, path);
		assert(!found, "Body path " + path + " was found");
		done && done();
	});

	learn.then([/^response body path (.*) should be ((?!of type).+)$/, /^response body path (.*) should contain ((?!of type).+)$/], function (path, expression, done) {
		var found = http.findInPath(this.response.body, path);
		var matched = new RegExp(expression).test(found);
		assert(matched, "Body path " + path + " does not contain /" + expression + "/");
		done && done();
	});

	learn.then([/^response body path (.*) should not be ((?!of type).+)$/, /^response body path (.*) should not contain ((?!of type).+)$/], function (path, expression, done) {
		var found = http.findInPath(this.response.body, path);
		var matched = new RegExp(expression).test(found);
		assert(!matched, "Body path " + path + " contains /" + expression + "/");
		done && done();
	});

	learn.then("cookie $cookie should exist", function (cookieJar, done) {
		this.request.jar = http.cookies();
		done && done();
	})


	WebAPI.feature = function (dialect, scope) {
		assert(dialect, "missing dialect");
		assert(scope, "missing scope");
	};

	WebAPI.scenario = function (dialect, scope) {
		assert(dialect, "missing dialect");
		assert(scope, "missing scope");

		_.defaults(scope, {
			peer: {
				authorized: false
			},
            request: {
			    headers: {}
            }
		});
	};

	WebAPI.annotations = function (dialect, annotations, scope) {
		assert(dialect, "missing dialect");
		assert(annotations, "missing annotations");
		assert(scope, "missing scope");

        // @target
        if (annotations.target) {
            scope.target = scope.targets[annotations.target];
        } else {
            scope.target = scope.target || scope.targets.default;
        }

        // @agent
        if (annotations.agent) {
            scope.agent = scope.agents[annotations.agent];
        } else {
            scope.agent = scope.agent || scope.agents.default;
        }
	}

	debug("understands RESTful APIs - v"+pkg.version);

};
