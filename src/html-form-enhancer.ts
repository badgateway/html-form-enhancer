/* eslint no-console: 0 */
import { serializeJsonForm } from './serialize-json-form.js';

export function enhanceForm(elem: HTMLFormElement) {

  elem.addEventListener('submit', (ev) => {

    ev.preventDefault();
    processSubmit(elem);

  });

}

export function autoEnhanceForms(doc: Document) {
  const forms = doc.getElementsByTagName('form');
  for(const form of forms) {

    const method = form.getAttribute('method')?.toUpperCase() || 'GET';
    const encType = form.getAttribute('enctype')?.toLowerCase();

    if (
      !['POST','GET'].includes(method) ||
      encType === 'application/json'
    ) {
      enhanceForm(form);
    }
  }
}

autoEnhanceForms(document);

async function processSubmit(elem: HTMLFormElement) {

  const method = elem.getAttribute('method')?.toUpperCase() || 'GET';
  const encType = elem.getAttribute('enctype')?.toLowerCase() || 'application/x-www-form-urlencoded';
  let action = elem.action;
  let body;

  if (method === 'GET' || method === 'DELETE') {
    const tUrl = new URL(action);
    for(const [key, value] of new FormData(elem)) {
      if (typeof value === 'string') {
        tUrl.searchParams.append(key, value);
      } else {
        console.warn('Form field %s is ignored', key);
      }
    }
    action = tUrl.toString();
    body = undefined;
  } else {

    if (!encType || encType === 'application/x-www-form-urlencoded') {
      body = new URLSearchParams(Object.fromEntries(new FormData(elem).entries()) as Record<string, string>);
    } else if (encType === 'application/json' || encType.match(/^application\/(.*)\+json$/)) {
      body = JSON.stringify(serializeJsonForm(elem));
    }

  }

  let response;
  try {
    response = await fetch(action, {
      method,
      headers: {
        'Content-Type': encType!,
        'Accept': 'text/html',
      },
      body,
    });
  } catch (err) {
    console.error('[html-form-enhancer] HTTP error while submitting form: ' + err);
    return;
  }

  if (!response.ok) {
    console.error('[html-form-enhancer] HTTP error while submitting form: ' + response.status);
    await replaceBody(response);
    return;
  }

  /*
   * As far as we know there's currently no way we can receive a 3xx response
   *
   * Leaving this code snippet for future archeologists, or in case browsers have a means
   * to intercept 3xx responses in the future.

  if (response.status >= 300 && response.status <= 399) {
    const location = response.headers.get('Location');
    if (location) {
      document.location.href = location;
    } else {
      console.warn('Got a 3xx response from a form submission, but no Location header');
    }
    return;
  }
  */

  switch(response.status) {

    case 201: {
      const location = response.headers.get('Location');
      if (location) {
        document.location.href = location;
        elem.action = location;
        elem.method = 'PUT';
      } else {
        console.warn('Got a 201 response from a form submission, but no Location header');
      }
      break;
    }
    case 204 :
      // Do nothing
      break;
    case 205 :
      elem.reset();
      break;
    default:
      replaceBody(response);

  }

}

async function replaceBody(response: Response) {

  const responseBody = await response.text();
  const domParser = new DOMParser();
  const newDom = domParser.parseFromString(responseBody, 'text/html');
  autoEnhanceForms(newDom);
  document.body.innerHTML = newDom.body.innerHTML;
  history.pushState(null, newDom.title, response.url);

}
