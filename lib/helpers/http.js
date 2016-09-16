var assert = require('assert');
var request = require('request'); // https://github.com/request/request
var _ = require('underscore');
var fs = require('fs');
var debug = require("debug")("apigeek:dialect-http");

var jsonPath = require('JSONPath');
var DOM = require('xmldom').DOMParser;
var path = require('path');
//var xpath = require('xpath');

var http = module.exports;

http._cookies = {};

http.cookies = function(name) {
    (name=name===true||name == undefined)?"default":name;
    return http._cookies[name] = http._cookies[name]?http._cookies[name]:request.jar();
}

http.getClientAddress = function (req) {
    assert(req, "Missing request");
    assert(req.connection, "Missing connection");
    return (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
}

http.authorize = function (request, agent) {
    assert(request, "missing request");
    assert(agent, "missing agent");
    assert(agent.username, "missing agent username");
    assert(agent.password, "missing agent password");
    var base64 = new Buffer(agent.username + ':' + agent.password).toString('base64');
    return request.headers.Authorization = 'Basic ' + base64;
}

http.bearer= function (request, token) {
    assert(request, "missing request");
    assert(token, "missing token");
    return request.headers.Authorization = 'Bearer' + token;
}

http.client_credentials = function(scope, agent, done) {
    assert(scope, "missing scope");
    assert(agent, "missing agent");
    assert(done, "missing callback done()");
    assert(agent.oauth, "missing agent oauth");
    assert(agent.oauth.url, "missing agent oauth URL");

    request({
        url: agent.oauth.url,
        method: agent.oauth.method || 'POST',
        form: {
            'client_id': agent.oauth.client_id,
            'client_secret': agent.oauth.client_secret,
            'grant_type': 'client_credentials'
        }
    }, function(err, res) {
        if (err) {
            throw err;
            //done && done(err);
            //return;
        }
        var json = JSON.parse(res.body);
        debug("OAUTH response: %j", json);
        done && done(null, json);
    });
}

http.url= function (resource, options, target) {
    assert(resource, "missing resource");
    assert(options, "missing options");

    var url = false;
    var target = _.extend({ cookie: http.cookies(), protocol: "http", hostname: "localhost", basePath: "/" }, target);

    if (resource.indexOf("://")<0) {
        var host = target.protocol + "://" + target.hostname + (target.port > 0 ? ":" + target.port : "");
        var basePath = (target.basePath || "") + (target.path || "");
        url = options.url || (host + basePath+resource);
    } else {
        url = resource;
    }
    debug("Using URL %s -> %j", url, target);
    return url;
}

http.command = function (method, resource, options, target) {
    assert(method, "missing method");
    assert(resource, "missing resource");
    assert(options, "missing options");

    options.url = http.url(resource, options, target);

    var cmd = _.extend({
        method: method,
        jar: options.cookies || target.cookies,
        headers: {},
        strictSSL: false,
        body: null,
        followRedirect: options.followRedirect || false,
        qs: {}
    }, options);

    debug("HTTP %s %s -> %j", method, resource, cmd);

    return cmd;
}

http.handleResponse = function (self, done) {
    assert(self, "missing scope");
    assert(done, "missing done() callback");
    self.stopwatch.start = _.now();

    return function (error, response) {
        self.stopwatch.stop = _.now();
        self.stopwatch.duration = self.stopwatch.stop - self.stopwatch.start;
        if (error) {
            self.error = error;
            debug("ERROR (%s) from %s in %s ms", error, self.request.url, self.stopwatch.duration);
            assert(!error, "HTTP: "+error);
            //done && done(error);
            //return;
        }
        _.extend(self.response, response);

        debug("HTTP response (%s) from %s in %s ms\n--> %j", self.response.statusCode, self.request.url, self.stopwatch.duration, (response.body || "No Response Body") );
        done && done(false, response);
    };
}

http.certificate = function (request, cert, options, rootDir) {
    assert(request, "missing request");
    assert(cert, "missing cert");

    rootDir = rootDir || "";

    var isRawPEM = function(pem) {
        return pem.indexOf("-----BEGIN")==0;
    }

    _.extend(request, {
        agentOptions: {
            key: isRawPEM(cert.key)?cert.key:fs.readFileSync(path.join(rootDir, cert.key), "UTF-8"),
            cert: isRawPEM(cert.cert)?cert.cert:fs.readFileSync(path.join(rootDir, cert.cert), "UTF-8")
        },
        requestCert: true,
        strictSSL: false,
        rejectUnauthorized: false
    }, options);
    if (cert.ca) {
        request.agentOptions.ca = isRawPEM(cert.ca)?cert.ca:fs.readFileSync(cert.ca, "UTF-8");
    }
    if (cert.passphrase) {
        request.agentOptions.passphrase = cert.passphrase;
    }

}

http.detectContentType = function (payload) {
    try {
        JSON.parse(payload);
        return 'json';
    } catch (e) {
        try {
            new DOM().parseFromString(payload);
            return 'xml';
        } catch (e) {
            return null;
        }
    }
};

http.parse = function (payload) {
    try {
        return JSON.parse(payload);
    } catch (e) {
        return new DOM().parseFromString(payload);
    }
};

http.detectFileType = function (file) {
    var ix = file.lastIndexOf(".");
    if (ix<0) return "";
    return file.substring(ix+1).toLowerCase();
}

http.findInPath = function (body, path) {
    var json = _.isString(body)?JSON.parse(body):body;
    var found = jsonPath({resultType: 'all'}, path, json);
    return (found.length > 0) ? found[0].value : undefined;
};

/**
 * @return {boolean}
 */
http.IsStatusCodeXX = function(statusXX, statusCode) {
    if (statusXX.indexOf("xx")>0) {
        return statusCode >= (statusXX[0] * 100) && statusCode <= 99 + (statusXX[0] * 100);
    } else return statusCode == statusXX;
}