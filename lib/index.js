var assert = require('assert');
var request = require('request');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var debug = require('debug')("apigeek:webapi");

var self = module.exports = function(learn, config, apigeek) {
    assert(learn, "missing learn");
    assert(config, "missing config");
    assert(apigeek, "missing apigeek core");

    var WebApi = require("./dialect/webapi");
    var TCP = require("./dialect/tcp");
    var X509 = require("./dialect/certs");

    TCP(learn,config);
    WebApi(learn,config);
    X509(learn,config);


    self.feature = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");

        TCP.feature(dialect,scope);
        WebApi.feature(dialect,scope);
    };

    self.scenario = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");

        TCP.scenario(dialect,scope);
        WebApi.scenario(dialect,scope);
    };

    self.annotations = function(dialect, annotations, scope) {
        assert(dialect, "missing dialect");
        assert(annotations, "missing annotations");
        assert(scope, "missing scope");

        // initialize request/response + targets + agents

        _.defaults(scope, { agent:{}, agents: { default: {} }, targets: {default: {} }, target:{}, certificates: { default: {} } } );
        _.extend(scope, { stopwatch: {}, request: { qs: {}, headers: {}, }, response: {} } );

        // merge default agents/targets with their @nnotations

        scope.target = _.extend({}, scope.targets.default, scope.target, scope.targets[annotations.target]);
        scope.agent = _.extend({}, scope.agents.default, scope.agent, scope.agents[annotations.agent]);
        scope.peer = { authorized: false, cert: {} };
        scope.dns = { };

        TCP.annotations(dialect,annotations, scope);
        WebApi.annotations(dialect,annotations, scope);

    };

    debug("understands Web APIs");
    return self;
};
