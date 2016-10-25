'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _Object$assign = _interopDefault(require('babel-runtime/core-js/object/assign'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var _Object$create = _interopDefault(require('babel-runtime/core-js/object/create'));
var _Map = _interopDefault(require('babel-runtime/core-js/map'));
var toRegExp = _interopDefault(require('path-to-regexp'));

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

var cache = new _Map();

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
  var key = routePath + '|' + end;
  var regexp = cache.get(key);

  if (!regexp) {
    var keys = [];
    regexp = { pattern: toRegExp(routePath, keys, { end: end }), keys: keys };
    cache.set(key, regexp);
  }

  var m = regexp.pattern.exec(urlPath);

  if (!m) {
    return null;
  }

  var path = m[0];
  var params = _Object$create(null);
  if (parentParams) {
    _Object$assign(params, parentParams);
  }

  for (var i = 1; i < m.length; i += 1) {
    params[regexp.keys[i - 1].name] = decodeParam(m[i]);
  }

  return { path: path === '' ? '/' : path, keys: regexp.keys.slice(), params: params };
}

var matchPath = matchPathBase.bind(undefined, true);
var matchBasePath = matchPathBase.bind(undefined, false);

var _marked = [matchRoute].map(_regeneratorRuntime.mark);

/**
 * Universal Router (https://www.kriasoft.com/universal-router/)
 *
 * Copyright © 2015-2016 Konstantin Tarkus, Kriasoft LLC. All rights reserved.
 *
 * This source code is licensed under the Apache 2.0 license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

function matchRoute(route, baseUrl, path, parentParams) {
  var match, i, newPath;
  return _regeneratorRuntime.wrap(function matchRoute$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          match = void 0;

          if (route.children) {
            _context.next = 6;
            break;
          }

          match = matchPath(route.path, path, parentParams);

          if (!match) {
            _context.next = 6;
            break;
          }

          _context.next = 6;
          return {
            route: route,
            baseUrl: baseUrl,
            path: match.path,
            keys: match.keys,
            params: match.params
          };

        case 6:
          if (!route.children) {
            _context.next = 18;
            break;
          }

          match = matchBasePath(route.path, path, parentParams);

          if (!match) {
            _context.next = 18;
            break;
          }

          _context.next = 11;
          return {
            route: route,
            baseUrl: baseUrl,
            path: match.path,
            keys: match.keys,
            params: match.params
          };

        case 11:
          i = 0;

        case 12:
          if (!(i < route.children.length)) {
            _context.next = 18;
            break;
          }

          newPath = path.substr(match.path.length);
          return _context.delegateYield(matchRoute(route.children[i], baseUrl + (match.path === '/' ? '' : match.path), newPath.startsWith('/') ? newPath : '/' + newPath, match.params), 't0', 15);

        case 15:
          i += 1;
          _context.next = 12;
          break;

        case 18:
        case 'end':
          return _context.stop();
      }
    }
  }, _marked[0], this);
}

var resolve = function () {
  var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(routes, pathOrContext) {
    var next = function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee() {
        var _match$next, newContext;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _match$next = match.next();
                value = _match$next.value;
                done = _match$next.done;

                if (!(!value || done || result !== null && result !== undefined)) {
                  _context.next = 5;
                  break;
                }

                return _context.abrupt('return', result);

              case 5:
                if (!value.route.action) {
                  _context.next = 10;
                  break;
                }

                newContext = _Object$assign({}, context, value);
                _context.next = 9;
                return value.route.action(newContext, newContext.params);

              case 9:
                result = _context.sent;

              case 10:
                _context.next = 12;
                return next();

              case 12:
                return _context.abrupt('return', _context.sent);

              case 13:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function next() {
        return _ref2.apply(this, arguments);
      };
    }();

    var context, root, result, value, done, match, error;
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            context = typeof pathOrContext === 'string' || pathOrContext instanceof String ? { path: pathOrContext } : pathOrContext;
            root = Array.isArray(routes) ? { path: '/', children: routes } : routes;
            result = null;
            value = void 0;
            done = false;
            match = matchRoute(root, '', context.path);


            context.next = next;

            _context2.next = 9;
            return next();

          case 9:
            if (!(result === null || result === undefined)) {
              _context2.next = 13;
              break;
            }

            error = new Error('Page not found');

            error.status = error.statusCode = 404;
            throw error;

          case 13:
            return _context2.abrupt('return', result);

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function resolve(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

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

var main = { resolve: resolve };

exports.resolve = resolve;
exports['default'] = main;
//# sourceMappingURL=legacy.js.map
