var pkg = require("../../package");
var assert = require('assert');
var async = require('async');
var meta4qa = require('meta4qa'), helps = meta4qa.helpers, http=helps.http, _ = meta4qa._;
var debug = require("debug")("meta4qa:dialect-tcp");
var dns = require('dns');
var tcp = helps.tcp = require('../helpers/tcp');
// var ping = require ("net-ping");

/**
 * X.509 Server Certificates
 * Configures the Yadda parser with phrases that support operations on HTTP Server Certificates
 *
 * @module Web API Dialect
 * @class X.509 Server Certificates
 *
 */
var self = module.exports = function(learn, config) {

    // ***** WHEN *****

    learn.when(["I get a server certificate", "I get an SNI server certificate", "I get a server certificate using SNI"], function(done) {
        assert(this.peer, "scope not initialised");
        assert(this.target, "Missing an HTTP target");
        var hostname = this.target.hostname;
        assert(hostname, "Missing an target hostname");

        var port = this.target.port || 443;
        var self = this;

        tcp.getServerCert(hostname, port, {}, function(err, peer) {
            assert(!err, "TCP: "+err);
            _.extend(self.peer,peer);
            done && done();
        })
    });

    learn.when(["I get $target server certificate", "I get $target SNI certificate"], function($target, done) {
        assert(this.peer, "scope not initialised");
        assert(this.targets, "Missing HTTP targets");
        var target = this.targets[$target];
        assert(target, "Missing HTTP target: "+$target);

        var hostname = target.hostname;
        assert(hostname, "Missing an target hostname");

        var port = target.port || 443;
        var self = this;

        tcp.getServerCert(hostname, port, {}, function(err, peer) {
            assert(!err, "TCP: "+err);
            _.extend(self.peer,peer);
            done && done();
        })
    });


    learn.when(["I trust $host", "I get a server certificate from $host", "I get SNI certificate from $host"], function(hostname, done) {
        assert(this.peer, "scope not initialised");
        assert(hostname, "Missing an target hostname");

        var port = 443;
        var self = this;

        tcp.getServerCert(hostname, port, {}, function(err, peer) {
            assert(!err, "TCP: "+err);
            _.extend(self.peer,peer);
            done && done();
        })
    });

    learn.when(["I get a server certificate without SNI"], function(done) {
        assert(this.peer, "scope not initialised");
        assert(this.target, "Missing an HTTP target");
        var hostname = this.target.hostname;
        assert(hostname, "Missing an target hostname");

        var port = this.target.port || 443;
        var self = this;

        tcp.getServerCert(hostname, port, { legacy: true }, function(err, peer) {
            assert(!err, "TCP error: "+e);
            _.extend(self.peer,peer);
            done && done();
        })

    });


    // ***** THEN *****

    learn.then(["server certificate is authorized", "server certificate must be authorized"], function(done) {
        assert(this.peer, "server cert missing");
        assert(this.peer.authorized, "Server cert not authorized");
        done && done();
    });

    learn.then(["server certificate $varname must match $pattern", "$varname in server certificate must match $pattern"], function(name, pattern, done) {
        assert(this.peer, "server cert missing");
        assert(this.peer.authorized, "Server cert not authorized");
        var found = helps.vars.findNamed(this.peer, name);
        assert(found, "Variable not found for: "+name);
        var regexp = new RegExp(pattern);
        assert(regexp.matches(found), "Pattern /"+pattern+"/ not found");
        done && done();
    });

    // **********************************************************************
    // * Dialect Controller
    // **********************************************************************

    self.feature = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");
    };

    self.scenario = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");

        _.defaults(scope, {peer: { authorized: false} });
    };

    self.annotations = function(dialect, annotations, scope) {
        assert(dialect, "missing dialect");
        assert(annotations, "missing annotations");
        assert(scope, "missing scope");
    }

    debug("understands X.509 hosts - v"+pkg.version);

    return self;
}
