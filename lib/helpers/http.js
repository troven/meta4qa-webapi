var assert = require('assert');
var request = require('request'); // https://github.com/request/request
var _ = require('underscore');
var fs = require('fs');

var jsonPath = require('JSONPath');
var DOM = require('xmldom').DOMParser;
//var xpath = require('xpath');
var debug = require('debug')("dialect:http");

var http = module.exports;

http._cookies = {};

http.cookies = function(name) {
    (name=name===true||name == undefined)?"default":name;
    return http._cookies[name] = http._cookies[name]?http._cookies[name]:request.jar();
}

http.authorize = function (request, principal) {
    assert(request, "missing request");
    assert(principal, "missing principal");
    var base64 = new Buffer(principal.username + ':' + principal.password).toString('base64');
    return request.headers.Authorization = 'Basic ' + base64;
}

http.bearer= function (request, token) {
    assert(request, "missing request");
    assert(token, "missing token");
    return request.headers.Authorization = 'Bearer' + token;
}

http.url= function (resource, options, target) {
    var url = false;
    var target = target || this.target || {};
    if (resource.indexOf("://")<0) {
        var host = target.protocol + "://" + target.hostname + (target.port > 0 ? ":" + target.port : "");
        var basePath = target.basePath || "";
        url = options.url || (host + basePath+resource);
        debug("URL %s from %j", url, target);
    } else {
        url = resource;
    }
    return url;
}

http.command = function (method, resource, options, target) {
    options.url = http.url(resource, options, target);
    target = target || {};

    var cmd = _.extend({
        method: method,
        jar: options.cookies || target.cookies,
        headers: {},
        strictSSL: false,
        body: null,
        followRedirect: options.followRedirect || false,
        qs: {}
    }, options);

    this.DEBUG && console.log("HTTP %s %s", method, resource);

    return cmd;
}

http.handleResponse = function (self, done) {
    self.stopwatch.start = _.now();

    return function (error, response) {
        self.stopwatch.stop = _.now();
        self.stopwatch.duration = self.stopwatch.stop - self.stopwatch.start;
        if (error) {
            self.error = error;
            http.DEBUG && console.log("ERROR (%s) from %s in %s ms", error, self.request.url, self.stopwatch.duration);
            done && done(error);
            return;
        }
        _.extend(self.response, response);

        http.DEBUG && console.log("Response (%s) from %s in %s ms", self.response.statusCode, self.request.url, self.stopwatch.duration);
        done && done(false, response);
    };
}

http.certificate = function (request, cert, options) {
    var isRawPEM = function(pem) {
        return pem.indexOf("-----BEGIN")==0;
    }

    _.extend(request, {
        agentOptions: {
            key: isRawPEM(cert.key)?cert.key:fs.readFileSync(cert.key),
            cert: isRawPEM(cert.cert)?cert.cert:fs.readFileSync(cert.cert),
            passphrase: cert.passphrase,
        },
        requestCert: true,
        strictSSL: false,
        rejectUnauthorized: false
    }, options);

    if (cert.ca) {
        request.agentOptions.ca = isRawPEM(cert.ca)?cert.ca:fs.readFileSync(cert.ca);
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
    if (statusXX.toLowerCase().indexOf("xx")>0) {
        return statusCode >= (statusXX[0] * 100) && statusCode <= 99 + (statusXX[0] * 100);
    } else return statusCode == statusXX;
}