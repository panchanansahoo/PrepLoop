export function setSpanAttribute(span, key, value) {
  if (!span || typeof span.setAttribute !== 'function') {
    return;
  }

  span.setAttribute(key, value);
}

export function setSpanAttributes(span, attributes = {}) {
  if (!span || !attributes || typeof attributes !== 'object') {
    return;
  }

  if (typeof span.setAttributes === 'function') {
    span.setAttributes(attributes);
    return;
  }

  if (typeof span.setAttribute === 'function') {
    for (const [key, value] of Object.entries(attributes)) {
      span.setAttribute(key, value);
    }
  }
}

export function addSpanEvent(span, eventName, attributes = {}) {
  if (!span || typeof span.addEvent !== 'function') {
    return;
  }

  span.addEvent(eventName, attributes);
}
