import { serializeJsonForm } from './serialize-json-form';

export function enhanceForm(elem: HTMLFormElement) {

  elem.addEventListener('submit', () => {

    processSubmit(elem);

  });

}

async function processSubmit(elem: HTMLFormElement) {

  const method = elem.method;
  const encType = elem.enctype;
  let target = elem.target;
  let body;

  if (method === 'GET' || method === 'DELETE') {
    const tUrl = new URL(target);
    for(const [key, value] of new FormData(elem)) {
      if (typeof value === 'string') {
        tUrl.searchParams.append(key, value);
      } else {
        console.warn('Form field %s is ignored', key);
      }
    }
    target = tUrl.toString();
    body = undefined;
  } else {

    if (!encType || encType === 'application/x-www-form-urlencoded') {
      body = new FormData(elem);
    } else if (encType === 'application/json' || encType.match(/^application\/(.*)\+json$/)) {
      body = JSON.stringify(serializeJsonForm(elem));
    }

  }

  const response = await fetch(target, {
    method,
    headers: {
      'Content-Type': encType,
    },
    body,
    redirect: 'manual',
  });

  if (!response.ok) {
    console.error('HTTP error while submitting form: ' + response.status);
    return;
  }

  if (response.status >= 300 && response.status <= 399) {
    const location = response.headers.get('Location');
    if (location) {
      document.location.href = location;
    } else {
      console.warn('Got a 3xx response from a form submission, but no Location header');
    }
    return;
  }

  switch(response.status) {

    case 201:
      const location = response.headers.get('Location');
      if (location) {
        elem.target = location;
        elem.method = 'PUT';
      } else {
        console.warn('Got a 201 response from a form submission, but no Location header');
      }
      break;
    case 204 :
      // Do nothing
      break;
    case 205 :
      elem.reset();
      break;

  }

}
