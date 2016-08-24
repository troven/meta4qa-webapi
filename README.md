Dialect For Web APIS
====================

A scenario describes a test case - essentially it's a list of instructions and expectations.

The framework interprets each step in the scenario using the [Web API Dialect](vocab.md). 

Read about authentication, proxies and SSL/TLS in [Advanced Web APIs](ADVANCED.md) . 

Let's create a simple example:

	@dialect=webapi
    Scenario: Test Google's homepage 

    Given I enable redirects
    When I GET http://google.com/
    Then response code should be 200
    And header Content-Type should contain text/html


Note: The example deliberately contravenes best practice to showcase a few concepts.

	1) Enable redirect handling.
	2) Issue an HTTP GET request to Google.
	3) Evaluate an arbitrary Javascript expression and store the boolean result in a variable called "ResponseSucceeded".
	4) Test that the HTTP status code is 200 (after an initial 302 redirect)
	5) Test that a Content-Type exists.
	6) Test that a Content-Type contains "text/html".
	7) Check that "ResponseSucceeded" variable was set to "true" in line 3. This is redundant since line 4 already makes same assertion.
	
Configuing Targets
==================

You can create a "target" secion in your configuration file. 

For more sophisticated environments, you can specify a "targets" section that included named targets. 

Then you can switch targets using @target or --target within feature and/or shell scripts.

	"targets": {
		"google": {
			"protocol": "https",
			"hostname": "google.com"
		},
		"yahoo": {
			"protocol": "http",
			"hostname": "yahoo.com",
			"port": "80"
		}
	}

Now, we can simply write:

    When I GET /

This allows us to re-use our features in new environments without recoding. For example:

	$ apigeek --target=yahoo

