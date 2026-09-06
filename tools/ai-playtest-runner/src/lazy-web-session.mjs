export function createLazyWebSession(createSession) {
  let sessionPromise;

  function getSession() {
    if (!sessionPromise) {
      sessionPromise = Promise.resolve().then(createSession);
    }
    return sessionPromise;
  }

  function forward(method) {
    return (...args) => getSession().then(session => session[method](...args));
  }

  return {
    screenshot: forward('screenshot'),
    click: forward('click'),
    drag: forward('drag'),
    key: forward('key'),
    type: forward('type'),
    wait: forward('wait'),
    async close() {
      if (sessionPromise) {
        const session = await sessionPromise;
        await session.close();
      }
    },
  };
}
