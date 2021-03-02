Changelog
=========

0.1.9 (2021-03-02)
------------------

* Fix a TS error.
* Rebuild files in 'dist/'


0.1.8 (2021-03-02)
------------------

* No longer take over forms if they have a method and enctype browsers support.
* Correctly serialize `application/x-www-form-urlencoded`. `FormData` doesn't
  do it out of the box.


0.1.7 (2021-02-06)
------------------

* Automatically replace body HTML and url when getting a HTML response from a
  server.


0.1.6 (2021-02-06)
------------------

* Re-release. js files were not built.


0.1.5 (2021-02-06)
------------------

* Catch fetch errors.
* Prefix errors in console with `[html-form-enhancer]`.
* JSON encoding wasn't working yet.
* Added 'preventDefault' so normal form behavior does not kick in.


0.1.4 (2021-02-06)
------------------

* Getting the form method and enctype from an alternative DOM API. Seems that
  method will get rewritten to 'get' if it's not `GET` or `POST`.


0.1.3 (2021-02-06)
------------------

* Auto-register forms with methods that are not `POST` or `GET` or if
  `enctype` is `application/json`.


0.1.2 (2021-02-06)
------------------

* Add `.js` files to import statements so output javascript files can be used
  in browsers without modification/building.


0.1.1 (2021-02-06)
------------------

* Add `dist/` files to npm package.


0.1.0 (2020-09-09)
------------------

* First version, mostly untested.
