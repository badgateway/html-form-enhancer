/**
 * Note, this algorithm is taken from:
 *
 * https://github.com/defunctzombie/form-serialize/blob/master/LICENSE
 *
 * It's cleaned up, modernized and converted to Typescript, but the original
 * is Copyright (c) 2013 Roman Shtylman and licensed under the MIT license.
 */

// get successful control from form and assemble into object
// http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2


// Matches bracket notation.
const brackets = /(\[[^[\]]*\])/g;

/**
 * Serializes a form into html-json-forms format.
 *
 * https://www.w3.org/TR/html-json-forms/
 */
export function serializeJsonForm(form: HTMLFormElement) {

  let result = {};

  const elements = form?.elements ? form.elements : [];

  //Object store each radio and set if it's empty or not
  const radio_store = Object.create(null);

  for (const element of elements) {

    if (!isValidInputField(element)) {
      // ignore anyhting that is not considered a success field
      continue;
    }
    if (!element.name) {
      continue;
    }

    const key = element.name;
    let val = element.value;

    // we can't just use element.value for checkboxes cause some browsers lie to us
    // they say "on" for value when the box isn't checked
    if ((element.type === 'checkbox' || element.type === 'radio') && !element.checked) {
      val = undefined;
    }

    // for checkbox
    if (element.type === 'checkbox' && !element.checked) {
      val = '';
    }

    // for radio
    if (element.type === 'radio') {
      if (!radio_store[element.name] && !element.checked) {
        radio_store[element.name] = false;
      }
      else if (element.checked) {
        radio_store[element.name] = true;
      }
    }

    // if options empty is true, continue only if its radio
    if (val == undefined && element.type == 'radio') {
      continue;
    }

    // multi select boxes
    if (element.type === 'select-multiple') {
      val = [];

      const selectOptions = element.options;
      let isSelectedOptions = false;
      for (const option of selectOptions) {
        const hasValue = !!option.value;
        if (option.selected && hasValue) {
          isSelectedOptions = true;

          // If using a hash serializer be sure to add the
          // correct notation for an array in the multi-select
          // context. Here the name attribute on the select element
          // might be missing the trailing bracket pair. Both names
          // "foo" and "foo[]" should be arrays.
          if (key.slice(key.length - 2) !== '[]') {
            result = hash_serializer(result, key + '[]', option.value);
          }
          else {
            result = hash_serializer(result, key, option.value);
          }
        }
      }

      // Serialize if no selected options and options.empty is true
      if (!isSelectedOptions) {
        result = hash_serializer(result, key, '');
      }

      continue;
    }

    result = hash_serializer(result, key, val);
  }

  for (const key in radio_store) {
    if (!radio_store[key]) {
      result = hash_serializer(result, key, '');
    }
  }

  return result;
}

function parse_keys(str: string): string[] {
  const keys = [];
  const prefix = /^([^[\]]*)/;
  const children = new RegExp(brackets);
  let match = prefix.exec(str);

  if (match?.[1]) {
    keys.push(match[1]);
  }

  while ((match = children.exec(str)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

/**
 * Too hard to type right now
 */
type Result = any;
type Value = string;

function hash_assign(result: Result, keys: string[], value: Value): Result {
  if (keys.length === 0) {
    result = value;
    return result;
  }

  const key = keys.shift()!;
  const between = key.match(/^\[(.+?)\]$/);

  if (key === '[]') {
    result = result || [];

    if (Array.isArray(result)) {
      result.push(hash_assign(null, keys, value));
    }
    else {
      // This might be the result of bad name attributes like "[][foo]",
      // in this case the original `result` object will already be
      // assigned to an object literal. Rather than coerce the object to
      // an array, or cause an exception the attribute "_values" is
      // assigned as an array.
      result._values = result._values || [];
      result._values.push(hash_assign(null, keys, value));
    }

    return result;
  }

  // Key is an attribute name and can be assigned directly.
  if (!between) {
    result[key] = hash_assign(result[key], keys, value);
  }
  else {
    const string = between[1];
    // +var converts the variable into a number
    // better than parseInt because it doesn't truncate away trailing
    // letters and actually fails if whole thing is not a number
    const index = +string;

    // If the characters between the brackets is not a number it is an
    // attribute name and can be assigned directly.
    if (isNaN(index)) {
      result = result || {};
      result[string] = hash_assign(result[string], keys, value);
    }
    else {
      result = result || [];
      result[index] = hash_assign(result[index], keys, value);
    }
  }

  return result;
}

// Object/hash encoding serializer.
function hash_serializer(result: Result, key: string, value: Value) {
  const matches = key.match(brackets);

  // Has brackets? Use the recursive assignment function to walk the keys,
  // construct any missing objects in the result tree and make the assignment
  // at the end of the chain.
  if (matches) {
    const keys = parse_keys(key);
    hash_assign(result, keys, value);
  }
  else {
    // Non bracket notation can make assignments directly.
    const existing = result[key];

    // If the value has been assigned already (for instance when a radio and
    // a checkbox have the same name attribute) convert the previous value
    // into an array before pushing into it.
    //
    // NOTE: If this requirement were removed all hash creation and
    // assignment could go through `hash_assign`.
    if (existing) {
      if (!Array.isArray(existing)) {
        result[key] = [ existing ];
      }

      result[key].push(value);
    }
    else {
      result[key] = value;
    }
  }

  return result;
}

function isValidInputField(elem: Element): elem is HTMLFormElement {

  const supportedElements = ['input', 'select', 'textarea'];
  const unsupportedInputType = ['submit' , 'button' , 'image' , 'reset' , 'file'];

  if (!supportedElements.includes(elem.nodeName.toLowerCase())){
    return false;
  }

  if (unsupportedInputType.includes((elem as any).type)) {
    return false;
  }
  return true;
}

