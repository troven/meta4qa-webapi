var assert = require('assert');
var request = require('request');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var debug = require('debug')("apigeek:webapi");

var self = module.exports = function(learn, config) {
    assert(learn, "missing learn");
    assert(config, "missing config");

    require("./dialect/webapi")(learn,config);
    require("./dialect/tcp")(learn,config);


    self.feature = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");

    };

    self.scenario = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");

    };

    self.annotations = function(dialect, annotations, scope) {
        assert(dialect, "missing dialect");
        assert(annotations, "missing annotations");
        assert(scope, "missing scope");

        debug("Annotate: %s", scope.name);

        // initialize request/response + targets + agents

        _.defaults(scope, { agent:{}, agents: { default: {} }, targets: {default: {} }, target:{}, certificates: { default: {} } } );
        _.extend(scope, { stopwatch: {}, request: { qs: {}, headers: {} }, response: {} } );

        // merge default agents/targets with their @nnotations

        scope.target = _.extend({}, scope.targets.default, scope.target, scope.targets[annotations.target]);
        scope.agent = _.extend({}, scope.agents.default, scope.agent, scope.agents[annotations.agent]);

    };

    debug("understands Web APIs");
    return self;
};
