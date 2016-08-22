Dialect For Web APIS
====================

A scenario describes a test case - essentially it's a list of instructions and expectations.

The framework interprets each step in the scenario using the [Gherkin Vocabulary](docs/vocab.md). 

Let's expand our initial example, into a hypothetical scenario. 

    Scenario: Test Google's homepage 

    Given I enable redirects
    When I GET http://google.com/
    And I return this.response.statusCode==200 as ResponseSucceeded
    Then response code should be 200
    And header Content-Type should exist
    And header Content-Type should contain text/html
    And variable ResponseSucceeded should be true

Affirm reads the GIVEN | WHEN | THEN sentences to build up a test suite that initializes, executes tests and make assertions.

Note: The example deliberately contravenes best practice to showcase a few concepts.

1) Enable redirect handling.
2) Issue an HTTP GET request to Google.
3) Evaluate an arbitrary Javascript expression and store the boolean result in a variable called "ResponseSucceeded".
4) Test that the HTTP status code is 200 (after an initial 302 redirect)
5) Test that a Content-Type exists.
6) Test that a Content-Type contains "text/html".
7) Check that "ResponseSucceeded" variable was set to "true" in line 3. This is redundant since line 4 already makes same assertion.

Web API Vocabulary
==================

This Dialect supports [Advanced] options for multiple targets and authentication including OAUTH, 2-way TLS.

GIVEN
=====

    GIVEN I use a $CERT client certificate
        I use an $CERT client certificate

    GIVEN I set $header header to $value
        I set header $header = $value

    GIVEN I set parameter $key to $value
        I set $key parameter to $value

    GIVEN I use basic authentication
        I login
        I authenticate
    GIVEN I use basic authentication as $agent
    GIVEN I use OAuth2

    GIVEN I set cookie $cookie to $value
        I set cookie $cookie = $value
    GIVEN I set timeout to $time

    GIVEN I enable keep alive
    GIVEN I disable keep alive
    GIVEN I enable gzip
    GIVEN I disable gzip
    GIVEN I set encoding to $encoding
    GIVEN I enable redirects
    GIVEN I disable redirects
    GIVEN I enable strict SSL
    GIVEN I disable strict SSL
    GIVEN I enable client certificates
    GIVEN I disable client certificates

    GIVEN I am debugging

A multi-line syntax is supported for injecting more complex objects such as CSV, JSON or XML:

    GIVEN some CSV as $var_name:
  --------
  what, who
  hello, world
  greetings, earthling
  --------

or:

    GIVEN I set $var_name to JSON:
  --------
  { "hello": "world", "earth": { "moon": "cheese" } }
  --------


WHEN
====

    WHEN I GET $resource|$url
    WHEN I POST $resource|$url
    WHEN I PUT $resource|$url
    WHEN I DELETE $resource|$url
    WHEN I PATCH $resource|$url
    WHEN I request OPTIONS for $resource|$url

    WHEN I wait for $seconds seconds
        I sleep for $seconds seconds
        I wait for $seconds second
        I sleep for $seconds second
    WHEN I return $javascript as $variable

THEN
====

    THEN response code should be $code"
    THEN response code should not be $code"

    THEN elapsed time should be less than $elapsed
        THEN duration should be less than $elapsed

    THEN header $header should be $value
    THEN header $header should not be $value
    THEN header $header should exist
    THEN header $header should not exist
	    THEN response body should be valid (xml|json)

    THEN response body should not be valid (xml|json)
    THEN I store body path (.*) as access token
    THEN response body should contain $expression
    THEN response body should not contain $expression
    THEN response body path (.*) should exist
    THEN response body path (.*) should not exist
    THEN response body path (.*) should be ((?!of type).+)
        response body path (.*) should contain ((?!of type).+)$/]
    THEN response body path (.*) should not be ((?!of type).+)
        response body path (.*) should not contain ((?!of type).+)

    THEN cookie $cookie should exist

	THEN $path in $name should match $regex

	THEN (.*) in $var should match $something
    THEN I assert $javascript
	THEN variable $name should exist
	THEN variable $name should not exist
	THEN variable $name should match $regex
	THEN variable $name should contain $value
	THEN variable $name should be $value
		$name should be $value
	
