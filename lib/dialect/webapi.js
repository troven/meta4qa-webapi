var assert = require('assert');
var request = require('request');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var http = require('../helpers/http');
var debug = require('debug')("dialect:webapi");
var ApiGeek = require('apigeek-dialect');

module.exports = function(learn, config) {

    var EXT_TO_MIME = {
        "json": "application/json",
        "xml": "text/xml",
        "txt": "plain/text"
    }

    var VERBOSE = false;

    // ******** GIVEN ********

    learn.given(["I use a $CERT client certificate", "I use an $CERT client certificate"], function(certName, done) {
        assert(config.certificates, "No client certificates");
        var cert = config.certificates[certName];
        assert(cert, "Missing a '"+certName+"' certificate");
        http.certificate(this.request, cert);
        this.request.requestCert= true;
        done && done();
    });

    learn.given(["I set $header header to $value","I set header $header = $value"], function(name, value, done) {
        this.request.headers[name] = value;
        debug("[WebAPI] header: %j", this.request.headers);
        done && done();
    })

    learn.given(["I set parameter $key to $value","I set $key parameter to $value", "I set $key param to $value", "I set param $key to $value"], function(key, value, done) {
        this.request.qs[key] = value;
        debug("[WebAPI] query params: %j", this.request.qs);
        done && done();
    })

    learn.given(["I set parameter $key from $varname","I set $key parameter from $varname", "I set $key param from $varname", "I set param $key from $varname"], function(key, varname, done) {
        this.request.qs[key] = ApiGeek.helpers.vars.get(this,varname);
        debug("[WebAPI] QUERY PARAMS: %j", this.request.qs);
        done && done();
    })

    learn.given(/^I set headers to$/, function(headers, done) {
        debug("[WebAPI] headers: %j ", headers);
        done && done();
    });

    learn.given(["I use basic authentication", "I login", "I authenticate"], function(done) {
        assert(config.agent, "Missing user agent");

        http.authorize(this.request, config.agent );
        done && done();
    });

    learn.given(["I use basic authentication as $agent", "I login as $agent"], function(agent, done) {
        assert(config.agents, "Missing user agents");
        var agent = config.agents[agent];
        assert(agent, "Missing user agent: "+agent);

        http.authorize(this.request, agent);
        done && done();
    });

    learn.given(["I use OAuth2", "I use oauth"], function(done) {
        this.request.headers.Authorization = 'Bearer ' + this.vars.access_token;
        done && done();
    })

    learn.given(["I set cookie $cookie to $value","I set cookie $cookie = $value"], function(name, value, done) {
        this.request.jar = this.cookies;
        this.request.cookie(name + "="+ value);
        done && done();
    })

    learn.given(["I set request timeout to $time"], function(timeInMillis, done) {
        this.request.timeout= timeInMillis?timeInMillis:10000;
        done && done();
    })

    learn.given(["I enable keep alive"], function(done) {
        this.request.forever= true;
        done && done();
    })

    learn.given(["I disable keep alive"], function(done) {
        this.request.forever= false;
        done && done();
    })

    learn.given(["I enable gzip"], function(done) {
        this.request.gzip= true;
        done && done();
    })

    learn.given(["I disable gzip"], function(done) {
        this.request.gzip = false;
        done && done();
    })

    learn.given(["I set encoding to $encoding"], function(encoding, done) {
        this.request.encoding= encoding?encoding:"utf8";
        done && done();
    })

    learn.given(["I enable redirects"], function(done) {
        this.request.followRedirect = true;
        done && done();
    })

    learn.given(["I disable redirects"], function(done) {
        this.request.followRedirect = false;
        done && done();
    })

    learn.given(["I enable strict SSL"], function(done) {
        this.request.strictSSL= true;
        done && done();
    })

    learn.given(["I disable strict SSL"], function(done) {
        this.request.strictSSL= false;
        done && done();
    })

    learn.given(["I enable client certificates"], function(done) {
        this.request.requestCert= true;
        done && done();
    })

    learn.given(["I disable client certificates"], function(done) {
        this.request.requestCert= false;
        done && done();
    })

    learn.given(["I send $file as body", "I upload $file as body"], function(file, done) {
        var type = http.detectFileType(file);
        var mime = EXT_TO_MIME[type];
        assert(mime, "Unsupported file type");
        this.request.headers['Content-Type'] = mime;
        file = path.join(config.files, file);
        this.request.body = fs.readFileSync(file)
        done && done();
    })

    learn.given(["I set body to $name"], function(name, done) {
        var value = this.vars[name];
        assert(value!=undefined, "Variable "+name+" is undefined");

        if (_.isObject(value)) {
            this.request.json = value;
        } else {
            this.request.body = value;
        }
        done && done();
    })

    learn.given(["I set body to CSV:\n$CSV", "I send CSV:\n$CSV"], function(value, done) {
        this.request.json = value;
        done && done();
    });

    learn.given(["I set body to JSON:\n$JSON", "I send JSON:\n$JSON"], function(value, done) {
        this.request.json = value;
        done && done();
    });

    learn.given(["I set body to:\n$TEXT", "I send:\n$TEXT"], function(value, done) {
        this.request.body = value;
        done && done();
    });

    // ******** WHEN ********

    learn.when("I GET $resource", function(resource, done) {
        assert(resource, "Missing GET resource");
        assert(done, "Missing callback");
        var cmd = http.command("GET", resource, this.request, this.target );
        request(cmd, http.handleResponse(this, done));
    });

    learn.when("I POST $resource", function(resource, done) {
        var cmd = http.command("POST", resource, this.request, this.target );
        request(cmd, http.handleResponse(this, done));
    });

    learn.when("I PUT $resource", function(resource, done) {
        var cmd = http.command("PUT", resource, this.request, this.target );
        request(cmd, http.handleResponse(this, done));
    });

    learn.when("I DELETE $resource", function(resource, done) {
        var cmd = http.command("DELETE", resource, this.request, this.target );
        request(cmd, http.handleResponse(this, done));
    });

    //learn.when("I $verb $resource", function(verb, resource, done) {
    //    var cmd = http.command(verb.toUpperCase(), resource, this.request, this.target );
    //    request(cmd, http.handleResponse(this, done));
    //});

    learn.when("I PATCH $resource", function(resource, done) {
        var cmd = http.command("PATCH", resource, this.request, this.target );
        request(cmd, http.handleResponse(this, done));
    });

    learn.when("I HEAD $resource", function(resource, done) {
        var cmd = http.command("HEAD", resource, this.request, this.target );
        request(cmd, http.handleResponse(this, done));
    });

    learn.when("I request OPTIONS for $resource", function(resource, done) {
        var cmd = http.command("OPTIONS", resource, this.request, this.target );
        request(cmd, http.handleResponse(this, done));
    });

    learn.when("I store body path (.*) as access token", function(path, done) {
        var access_token = http.findInPath(this.response.body, path);
        assert(access_token, "Body path "+path+" does not contains an access_token");
        this.vars.access_token = access_token;
        done && done();
    });

    learn.when("I store body path $path as $name", function(path, name, done) {
        var value = http.findInPath(this.response.body, path);
        vars.set(this.vars,name,value);
        done && done();
    });

    learn.when("I store header $header as $name", function(header, name, done) {
        header = header.toLowerCase();
        this.vars[name] = this.response.headers[header];
        done && done();
    });

    // ******** THEN ********

    learn.then("response code should be $code", function(code, done) {
        assert( http.IsStatusCodeXX(code, this.response.statusCode), "Status code is "+this.response.statusCode+" not "+code );
        done && done();
    });

    learn.then("response code should not be $code", function(code, done) {
        assert( !http.IsStatusCodeXX(code, this.response.statusCode), "Status code is "+this.response.statusCode);
        done && done();
    });


    learn.then(["elapsed time should be less than $elapsed","duration should be less than $elapsed"], function(elapsed, done) {
        assert(this.stopwatch.duration<elapsed);
        done && done();
    });

    learn.then("header $header should be $value", function(header, value, done) {
        header  = header.toLowerCase();
        assert(this.response.headers[header] == value, "Header "+header+" should match "+value+" but not "+this.response.headers[header]);
        done && done();
    });

    learn.then("header $header should contain $value", function(header, value, done) {
        header  = header.toLowerCase();
        assert(this.response.headers[header].indexOf(value)>=0, "Header "+header+" should contain "+value+" but does not: "+this.response.headers[header]);
        done && done();
    });

    learn.then("header $header should not be $value", function(header, value, done) {
        header  = header.toLowerCase();
        assert(this.response.headers[header] != value, "Header "+header+" should not match "+value);
        done && done();
    });

    learn.then("header $header should exist", function(header, done) {
        header  = header.toLowerCase();
        assert(this.response.headers[header], "Missing "+header+" header");
        done && done();
    });

    learn.then("header $header should not exist", function(header, done) {
        header  = header.toLowerCase();
        assert(this.response.headers[header]==undefined, "Found "+header+" header");
        done && done();
    });

    learn.then(/^response body should be valid (xml|json)$/, function(contentType, done) {
        var simpleType = http.detectContentType(this.response.body);
        assert(simpleType==contentType, "Payload is not valid "+contentType.toUpperCase());
        done && done();
    });

    learn.then("/^response body should not be valid (xml|json)$/", function(contentType, done) {
        var simpleType = http.detectContentType(this.response.body);
        assert(simpleType!=contentType, "Payload is valid "+contentType.toUpperCase());
        done && done();
    });

    learn.then("response body should contain $expression", function(expression, done) {
        var found = new RegExp(expression).test(this.response.body);
        assert(found, "Body does not contain /"+expression+"/");
        done && done();
    });

    learn.then("response body should not contain $expression", function(expression, done) {
        var found = new RegExp(expression).test(this.response.body);
        assert(!found, "Body contains /"+expression+"/");
        done && done();
    });

    learn.then(/^response body path (.*) should exist/, function (path, done) {
        var found = http.findInPath(this.response.body, path);
        assert(found, "Body path "+path+" not found");
        done && done();
    });

    learn.then(/^response body path (.*) should not exist/, function (path, done) {
        var found = http.findInPath(this.response.body, path);
        assert(!found, "Body path "+path+" was found");
        done && done();
    });

    learn.then([/^response body path (.*) should be ((?!of type).+)$/, /^response body path (.*) should contain ((?!of type).+)$/], function (path, expression, done) {
        var found = http.findInPath(this.response.body, path);
        var matched = new RegExp(expression).test(found);
        assert(matched, "Body path "+path+" does not contain /"+expression+"/");
        done && done();
    });

    learn.then([/^response body path (.*) should not be ((?!of type).+)$/,/^response body path (.*) should not contain ((?!of type).+)$/], function (path, expression, done) {
        var found = http.findInPath(this.response.body, path);
        var matched = new RegExp(expression).test(found);
        assert(!matched, "Body path "+path+" contains /"+expression+"/");
        done && done();
    });

    learn.then("cookie $cookie should exist", function(cookieJar, done) {
        this.request.jar = http.cookies();
        done && done();
    })
};
