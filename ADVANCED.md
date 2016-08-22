
I want to reuse test scenarios in different environments
========================================================

We can inject the "protocol", "hostname", "port" and "basePath" parameters from CLI options or a configuration file.

So, our example Scenario can be re-written to specify the resource only:
	
	    When I GET /

Then for each environment - we'd want to change the parameters.

By default:

	{
		"protocol": "http",
		"hostname": "localhost",
		"port": "80"
	}


When constructing URLs for HTTP commands, we use "{{protocol}}://{{hostname}}:{{port}}/{{basePath}}{{resource}}" as a URL template.

If we wanted to define "https://google.com:443" as our endpoint, we'd use a JSON config file that looks like this:

	{
		"protocol": "https",
		"hostname": "google.com",
		"port": "443"
	}


I want to re-use tests across multiple endpoints
=================================================

Apigeek-Affirm was designed to support a declarative style so that tests are portable between dev, test and production environments. 

To achieve portability, environment-specific properties can be declared in a "config" file.

By default, affirm will try to load a configuration file called "affirm.json" from your current directory. 

If no file is found, then sensible default values are defined.

You can change the name of the file using the "--config <file" option.

In this way, your BDD tests are neatly abstracted from your runtime configuration.

To specify a custom configuration, use:

	dialect --config config.json

If you omit the --config option, then the "affirm.json" file in the current folder will be used.

Supplying a different "config" file for each environment allows Feature tests to be re-used across multiple environments.

The config file supports setting the following:

	A default target - hostname and port. Multiple target sets are supported.

	A default user agent - credentials for multiple named agents can be supplied.

	client certificates - multiple named certificates are supported for example: valid, expired, invalid.

	Webhooks - asynchronous notifications sent to Slack when tests start, finish and fail.

I want my tests to authenticate
===============================

You can specify sets of credentials for authentication (login) using the "agent" directive:

		"agent": {
			"default": {
				"username": "someone",
				"password": "TEST"
			},
			"robot": {
				"username": "robot@example.com",
				"password": "TEST321"
			}
		}

This will configure two authentication agents - "default" and "robot". Each has separate credentials.

The Gherkin vocabulary you to use different agents to perform Basic Authentication.

Experimental support for OAUTH 2.0 is also implemented.

Authentication Vocabulary:
==========================

	GIVEN I use basic authentication
	    I login
	    I authenticate
	GIVEN I use basic authentication as $AGENT
	    I login as $AGENT
	    I authenticate as $AGENT
	GIVEN I use OAuth2
	GIVEN I use OAuth2 as $AGENT

For example: You login to a web service using:

	GIVEN I login as robot

See the [Affirm Vocabulary](docs/vocab.md) for details.

I want to test APIs that use 2-way TLS
======================================

If your server requires 2-way TLS, you can supply client certificates.

	GIVEN I use a valid client certificate

You can  refer to named certificates from within your scenarios.

		"certificate": {
			"valid": {
				"key": "../etc/certs2/client/app-client.key.pem",
				"cert": "../etc/certs2/client/app-client.crt.pem",
				"ca": "../etc/certs2/ca/root-ca.crt.pem",
				"passphrase": "test"
			}, 
			"expired": { ... }
		}

Certificate Vocabulary
======================

	GIVEN I use a $CERT client certificate
	    I use an $CERT client certificate
    
See the [Affirm Vocabulary](docs/vocab.md) for details.


I want to perform operations before every scenario
==================================================

A feature test may contain a background that are prepended to each scenario.
Backgrounds are similar to scenarios, except they do not support annotations.

Background: Authenticate

	GIVEN I login
	AND I use a valid client certificate
