import _Object$assign from 'babel-runtime/core-js/object/assign';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
import _Object$create from 'babel-runtime/core-js/object/create';
import _Map from 'babel-runtime/core-js/map';
import toRegExp from 'path-to-regexp';

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

const cache = new _Map();

function decodeParam(val) {
  if (val === undefined || val === '') {
    return val;
  }

  try {
    return decodeURIComponent(val);
  } catch (err) {
    return val;
  }
}

function matchPathBase(end, routePath, urlPath, parentParams) {
  const key = `${ routePath }|${ end }`;
  let regexp = cache.get(key);

  if (!regexp) {
    const keys = [];
    regexp = { pattern: toRegExp(routePath, keys, { end }), keys };
    cache.set(key, regexp);
  }

  const m = regexp.pattern.exec(urlPath);

  if (!m) {
    return null;
  }

  const path = m[0];
  const params = _Object$create(null);
  if (parentParams) {
    _Object$assign(params, parentParams);
  }

  for (let i = 1; i < m.length; i += 1) {
    params[regexp.keys[i - 1].name] = decodeParam(m[i]);
  }

  return { path: path === '' ? '/' : path, keys: regexp.keys.slice(), params };
}

const matchPath = matchPathBase.bind(undefined, true);
const matchBasePath = matchPathBase.bind(undefined, false);

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

function* matchRoute(route, baseUrl, path, parentParams) {
  let match;

  if (!route.children) {
    match = matchPath(route.path, path, parentParams);

    if (match) {
      yield {
        route,
        baseUrl,
        path: match.path,
        keys: match.keys,
        params: match.params
      };
    }
  }

  if (route.children) {
    match = matchBasePath(route.path, path, parentParams);

    if (match) {
      yield {
        route,
        baseUrl,
        path: match.path,
        keys: match.keys,
        params: match.params
      };

      for (let i = 0; i < route.children.length; i += 1) {
        const newPath = path.substr(match.path.length);
        yield* matchRoute(route.children[i], baseUrl + (match.path === '/' ? '' : match.path), newPath.startsWith('/') ? newPath : `/${ newPath }`, match.params);
      }
    }
  }
}

let resolve = (() => {
  var _ref = _asyncToGenerator(function* (routes, pathOrContext) {
    let next = (() => {
      var _ref2 = _asyncToGenerator(function* () {
        ({ value, done } = match.next());

        if (!value || done || result !== null && result !== undefined) {
          return result;
        }

        if (value.route.action) {
          const newContext = _Object$assign({}, context, value);
          result = yield value.route.action(newContext, newContext.params);
        }

        return yield next();
      });

      return function next() {
        return _ref2.apply(this, arguments);
      };
    })();

    const context = typeof pathOrContext === 'string' || pathOrContext instanceof String ? { path: pathOrContext } : pathOrContext;
    const root = Array.isArray(routes) ? { path: '/', children: routes } : routes;
    let result = null;
    let value;
    let done = false;

    const match = matchRoute(root, '', context.path);

    context.next = next;

    yield next();

    if (result === null || result === undefined) {
      const error = new Error('Page not found');
      error.status = error.statusCode = 404;
      throw error;
    }

    return result;
  });

  return function resolve(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

var main = { resolve };

export { resolve };export default main;
//# sourceMappingURL=main.mjs.map
