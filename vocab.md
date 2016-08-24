Web API Dialect
===============

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


WHEN
====

    WHEN I GET $resource|$url
    WHEN I POST $resource|$url
    WHEN I PUT $resource|$url
    WHEN I DELETE $resource|$url
    WHEN I PATCH $resource|$url
    WHEN I request OPTIONS for $resource|$url

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

