
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

meta4qa-Affirm was designed to support a declarative style so that tests are portable between dev, test and production environments. 

To achieve portability, environment-specific properties can be declared in a "config" file.

By default, affirm will try to load a configuration file called "meta4qa.json" from your current directory. 

If no file is found, then sensible default values are defined.

You can change the name of the file using the "--config <file" option.

In this way, your BDD tests are neatly abstracted from your runtime configuration.

To specify a custom configuration, use:

	$ meta4qa --config config.json

If you omit the --config option, then the "meta4qa.json" file in the current folder will be used.

Supplying a different "config" file for each environment allows Feature tests to be re-used across multiple environments.

The config file supports setting the following:

	A default target - hostname and port. Multiple target sets are supported.

	A default user agent - credentials for multiple named agents can be supplied.

	client certificates - multiple named certificates are supported for example: valid, expired, invalid.

	Webhooks - asynchronous notifications sent to Slack when tests start, finish and fail.

I want my tests to authenticate
===============================

You can specify sets of credentials for authentication (login) using the "agent" directive:

		"agents": {
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

The Web API Dialect allows multiple agents, about to perform Basic Authentication, OAUTH or something else.

You can switch between agents using the CLI argument:

	$ meta4qa --agent=robot

Or at runtime using an @agent annotation.

Support for OAUTH is partially implemented.

Authentication Vocabulary:
==========================

	GIVEN I use basic authentication
	    I login
	    I authenticate

	GIVEN I use basic authentication as $AGENT
	    I login as $AGENT
	    I authenticate as $AGENT

	GIVEN I use oauth
	GIVEN I use OAuth2 as $AGENT

For example: You login to a web service using:

	GIVEN I login as robot

See the [Web API Dialect](vocab.md) for details.

I want to test APIs that use 2-way TLS
======================================

If your environment requires 2-way TLS, you can use client certificates.

	GIVEN I use a valid client certificate

You can refer to named certificates from within your scenarios.

		"certificates": {
			"valid": {
				"key": "../etc/certs2/client/app-client.key.pem",
				"cert": "../etc/certs2/client/app-client.crt.pem",
				"ca": "../etc/certs2/ca/root-ca.crt.pem",
				"passphrase": "not_very_secret"
			}, 
			"expired": { ... }
		}
		
For production systems, you'll want to set the passphrase using an environment variable:

	export meta4qa_CERTIFICATES_VALID_PASSPHRASE=safer_secret

Certificate Vocabulary
======================

Once you have configured your client certificates, you can easily use them by name.

	GIVEN I use a $CERT client certificate
	    I use an $CERT client certificate
    
See the [Web API Dialect](vocab.md) for details.

I want to use a forward proxy
=============================

You can require that HTTP targets are reached via a HTTP(S) forward proxy. 

You can set a "proxy" option in your ./meta4qa.json config file, like this:

	{
		target: {
			"hostname": "google.com" ,
			"proxy": "localhost":3128
		}
	}

Alternatively, you can set environment variables.

	HTTP_PROXY / http_proxy
	HTTPS_PROXY / https_proxy
	NO_PROXY / no_proxy

When HTTP_PROXY / http_proxy are set, they will be used to proxy non-SSL requests that do not have an explicit proxy configuration option present. 

Similarly, HTTPS_PROXY / https_proxy will be respected for SSL requests that do not have an explicit proxy configuration option. 

It is valid to define a proxy in one of the environment variables, but then override it for a specific request, using the proxy configuration option. 

Furthermore, the proxy configuration option can be explicitly set to false / null to opt out of proxying altogether for that request.

I want to login before every scenario
==================================================

A feature test may contain a background that are prepended to each scenario.
Backgrounds are similar to scenarios, except they do not support annotations.

Background: Authenticate

	GIVEN I login
	AND I use a valid client certificate
