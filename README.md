html-form-enhancer
==================

This package contains a small javascript utility that adds a few features
to HTML forms that are often requested, but don't exists in browsers:

* `enctype="application/json"` to encode form fields to JSON.
* Support for additional methods such as `PUT`, `DELETE`, `PATCH`, `REPORT`,
 `SEARCH`.
* Support for the `201` status code. If `201` is returned with a `Location`
  header, the form will switch its method to `PUT` and `action` to the new
  location.
* Support for the `204` and `205` status codes.
* Follows: https://www.w3.org/TR/html-json-forms/

Usage instructions
------------------

Including this script with a `<script>` tag will cause it to scan for
`<form>` tags in the DOM and automatically run.

```html
<script src="html-form-enhancer.mjs" type="module"></script>

<form method="PATCH" enctype="application/json">
  <input type="text" name="foo" value="bar" />
  <button type="submit"></button>
</form>
```

If you use Javascript to dynamically render forms, you can also re-run the
script on specific form elements:

```javascript
import { enhanceForm } from 'html-form-enhancer.mjs';

const elem = document.getElementById('.some-form');
enhanceForm(elem);
```

How it works
------------

The script finds all existing `<form>` tags and binds itself to them if either
of these conditions are true:

1. `enctype="application/json"` or an `enctype` with the pattern `application/*+json`.
2. `method` is something other than `POST` or `GET`.

If you want to take advantage of the form enhancer for your other forms, you need to
manually use the `enhanceForm` function on it.

After enhanceForm takes over a `<form>`, it hooks into the `submit` event.

### Serialization

1. If the method was `GET` or `DELETE`, take all form fields and place them in
   the uri.
2. Otherwise, serialize the fields into the body. Use normal form serialization
   for `application/x-www-form-urlencoded` and use the [html-json-forms][1] spec
   for all JSON forms.

Note: `multipart/form-data` is not yet supported.

### Submission

The actual submission is done with `fetch()`. This means that if you do
cross-origin requests, `CORS` headers _must_ be set correctly.

### Handling the response

#### 201 Created

If the HTTP response is `201 Created` and contains a `Location` header, it
will _not_ redirect the browser. It will take the `Location` value and place
it in the `action` attribute, and will change the method to `PUT`.

This is especially useful if you are using `POST` for creating new resources
and want to be able to use `PUT` afterwards to update the resource.


#### 204 No Content

If the HTTP Response is `204 No Content`, it won't redirect and will allow
the user to make subsequent edits and submissions.


#### 205 Reset Content

If the server responded with `205`, it will call the forms `.reset()`
function. The effect is similar to pressing a `<input type="reset" />` button.

This is useful for submitting a bunch of forms in a row.


#### 3xx responses

If the HTTP response is in the 3xx category, it will read the `Location`
header and redirect the browser to the specified location.


#### Other HTTP responses

Other HTTP responses will result in the entire HTML body to be replaced with
the body returned from the server.

[1]: https://www.w3.org/TR/html-json-forms/
