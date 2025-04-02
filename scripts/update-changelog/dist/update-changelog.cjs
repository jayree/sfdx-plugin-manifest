#!/usr/bin/env node
'use strict';
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) =>
  function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, 'default', { value: mod, enumerable: true }) : target,
    mod,
  )
);
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod);

// node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  'node_modules/semver/internal/constants.js'(exports2, module2) {
    var SEMVER_SPEC_VERSION = '2.0.0';
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER /* istanbul ignore next */ || 9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease'];
    module2.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2,
    };
  },
});

// node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  'node_modules/semver/internal/debug.js'(exports2, module2) {
    var debug =
      typeof process === 'object' && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG)
        ? (...args) => console.error('SEMVER', ...args)
        : () => {};
    module2.exports = debug;
  },
});

// node_modules/semver/internal/re.js
var require_re = __commonJS({
  'node_modules/semver/internal/re.js'(exports2, module2) {
    var { MAX_SAFE_COMPONENT_LENGTH, MAX_SAFE_BUILD_LENGTH, MAX_LENGTH } = require_constants();
    var debug = require_debug();
    exports2 = module2.exports = {};
    var re = (exports2.re = []);
    var safeRe = (exports2.safeRe = []);
    var src = (exports2.src = []);
    var safeSrc = (exports2.safeSrc = []);
    var t = (exports2.t = {});
    var R = 0;
    var LETTERDASHNUMBER = '[a-zA-Z0-9-]';
    var safeRegexReplacements = [
      ['\\s', 1],
      ['\\d', MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name, index, value);
      t[name] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? 'g' : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? 'g' : void 0);
    };
    createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
    createToken('NUMERICIDENTIFIERLOOSE', '\\d+');
    createToken('NONNUMERICIDENTIFIER', `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken(
      'MAINVERSION',
      `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`,
    );
    createToken(
      'MAINVERSIONLOOSE',
      `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`,
    );
    createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NUMERICIDENTIFIER]}|${src[t.NONNUMERICIDENTIFIER]})`);
    createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NUMERICIDENTIFIERLOOSE]}|${src[t.NONNUMERICIDENTIFIER]})`);
    createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken(
      'PRERELEASELOOSE',
      `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`,
    );
    createToken('BUILDIDENTIFIER', `${LETTERDASHNUMBER}+`);
    createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken('FULLPLAIN', `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken('FULL', `^${src[t.FULLPLAIN]}$`);
    createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);
    createToken('GTLT', '((?:<|>)?=?)');
    createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken(
      'XRANGEPLAIN',
      `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`,
    );
    createToken(
      'XRANGEPLAINLOOSE',
      `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`,
    );
    createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken(
      'COERCEPLAIN',
      `${'(^|[^\\d])(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`,
    );
    createToken('COERCE', `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken('COERCEFULL', src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken('COERCERTL', src[t.COERCE], true);
    createToken('COERCERTLFULL', src[t.COERCEFULL], true);
    createToken('LONETILDE', '(?:~>?)');
    createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports2.tildeTrimReplace = '$1~';
    createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken('LONECARET', '(?:\\^)');
    createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports2.caretTrimReplace = '$1^';
    createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports2.comparatorTrimReplace = '$1$2$3';
    createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken('STAR', '(<|>)?=?\\s*\\*');
    createToken('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
    createToken('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$');
  },
});

// node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  'node_modules/semver/internal/parse-options.js'(exports2, module2) {
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options2) => {
      if (!options2) {
        return emptyOpts;
      }
      if (typeof options2 !== 'object') {
        return looseOption;
      }
      return options2;
    };
    module2.exports = parseOptions;
  },
});

// node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  'node_modules/semver/internal/identifiers.js'(exports2, module2) {
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module2.exports = {
      compareIdentifiers,
      rcompareIdentifiers,
    };
  },
});

// node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  'node_modules/semver/classes/semver.js'(exports2, module2) {
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, safeSrc: src, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var SemVer = class _SemVer {
      constructor(version, options2) {
        options2 = parseOptions(options2);
        if (version instanceof _SemVer) {
          if (version.loose === !!options2.loose && version.includePrerelease === !!options2.includePrerelease) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== 'string') {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
          throw new TypeError(`version is longer than ${MAX_LENGTH} characters`);
        }
        debug('SemVer', version, options2);
        this.options = options2;
        this.loose = !!options2.loose;
        this.includePrerelease = !!options2.includePrerelease;
        const m = version.trim().match(options2.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError('Invalid major version');
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError('Invalid minor version');
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError('Invalid patch version');
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split('.').map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split('.') : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join('.')}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug('SemVer.compare', this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === 'string' && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        return (
          compareIdentifiers(this.major, other.major) ||
          compareIdentifiers(this.minor, other.minor) ||
          compareIdentifiers(this.patch, other.patch)
        );
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug('prerelease compare', i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug('build compare', i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith('pre')) {
          if (!identifier && identifierBase === false) {
            throw new Error('invalid increment argument: identifier is empty');
          }
          if (identifier) {
            const r = new RegExp(`^${this.options.loose ? src[t.PRERELEASELOOSE] : src[t.PRERELEASE]}$`);
            const match = `-${identifier}`.match(r);
            if (!match || match[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case 'premajor':
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc('pre', identifier, identifierBase);
            break;
          case 'preminor':
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc('pre', identifier, identifierBase);
            break;
          case 'prepatch':
            this.prerelease.length = 0;
            this.inc('patch', identifier, identifierBase);
            this.inc('pre', identifier, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case 'prerelease':
            if (this.prerelease.length === 0) {
              this.inc('patch', identifier, identifierBase);
            }
            this.inc('pre', identifier, identifierBase);
            break;
          case 'release':
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case 'major':
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case 'minor':
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case 'patch':
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case 'pre': {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === 'number') {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join('.') && identifierBase === false) {
                  throw new Error('invalid increment argument: identifier already exists');
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
                if (isNaN(this.prerelease[1])) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join('.')}`;
        }
        return this;
      }
    };
    module2.exports = SemVer;
  },
});

// node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  'node_modules/semver/functions/parse.js'(exports2, module2) {
    var SemVer = require_semver();
    var parse2 = (version, options2, throwErrors = false) => {
      if (version instanceof SemVer) {
        return version;
      }
      try {
        return new SemVer(version, options2);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module2.exports = parse2;
  },
});

// node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  'node_modules/semver/functions/valid.js'(exports2, module2) {
    var parse2 = require_parse();
    var valid = (version, options2) => {
      const v = parse2(version, options2);
      return v ? v.version : null;
    };
    module2.exports = valid;
  },
});

// node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  'node_modules/semver/functions/clean.js'(exports2, module2) {
    var parse2 = require_parse();
    var clean = (version, options2) => {
      const s = parse2(version.trim().replace(/^[=v]+/, ''), options2);
      return s ? s.version : null;
    };
    module2.exports = clean;
  },
});

// node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  'node_modules/semver/functions/inc.js'(exports2, module2) {
    var SemVer = require_semver();
    var inc = (version, release, options2, identifier, identifierBase) => {
      if (typeof options2 === 'string') {
        identifierBase = identifier;
        identifier = options2;
        options2 = void 0;
      }
      try {
        return new SemVer(version instanceof SemVer ? version.version : version, options2).inc(
          release,
          identifier,
          identifierBase,
        ).version;
      } catch (er) {
        return null;
      }
    };
    module2.exports = inc;
  },
});

// node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  'node_modules/semver/functions/diff.js'(exports2, module2) {
    var parse2 = require_parse();
    var diff = (version1, version2) => {
      const v1 = parse2(version1, null, true);
      const v2 = parse2(version2, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return 'major';
        }
        if (lowVersion.compareMain(highVersion) === 0) {
          if (lowVersion.minor && !lowVersion.patch) {
            return 'minor';
          }
          return 'patch';
        }
      }
      const prefix = highHasPre ? 'pre' : '';
      if (v1.major !== v2.major) {
        return prefix + 'major';
      }
      if (v1.minor !== v2.minor) {
        return prefix + 'minor';
      }
      if (v1.patch !== v2.patch) {
        return prefix + 'patch';
      }
      return 'prerelease';
    };
    module2.exports = diff;
  },
});

// node_modules/semver/functions/major.js
var require_major = __commonJS({
  'node_modules/semver/functions/major.js'(exports2, module2) {
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module2.exports = major;
  },
});

// node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  'node_modules/semver/functions/minor.js'(exports2, module2) {
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module2.exports = minor;
  },
});

// node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  'node_modules/semver/functions/patch.js'(exports2, module2) {
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module2.exports = patch;
  },
});

// node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  'node_modules/semver/functions/prerelease.js'(exports2, module2) {
    var parse2 = require_parse();
    var prerelease = (version, options2) => {
      const parsed = parse2(version, options2);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module2.exports = prerelease;
  },
});

// node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  'node_modules/semver/functions/compare.js'(exports2, module2) {
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module2.exports = compare;
  },
});

// node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  'node_modules/semver/functions/rcompare.js'(exports2, module2) {
    var compare = require_compare();
    var rcompare = (a, b, loose) => compare(b, a, loose);
    module2.exports = rcompare;
  },
});

// node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  'node_modules/semver/functions/compare-loose.js'(exports2, module2) {
    var compare = require_compare();
    var compareLoose = (a, b) => compare(a, b, true);
    module2.exports = compareLoose;
  },
});

// node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  'node_modules/semver/functions/compare-build.js'(exports2, module2) {
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module2.exports = compareBuild;
  },
});

// node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  'node_modules/semver/functions/sort.js'(exports2, module2) {
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module2.exports = sort;
  },
});

// node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  'node_modules/semver/functions/rsort.js'(exports2, module2) {
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module2.exports = rsort;
  },
});

// node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  'node_modules/semver/functions/gt.js'(exports2, module2) {
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module2.exports = gt;
  },
});

// node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  'node_modules/semver/functions/lt.js'(exports2, module2) {
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module2.exports = lt;
  },
});

// node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  'node_modules/semver/functions/eq.js'(exports2, module2) {
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module2.exports = eq;
  },
});

// node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  'node_modules/semver/functions/neq.js'(exports2, module2) {
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module2.exports = neq;
  },
});

// node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  'node_modules/semver/functions/gte.js'(exports2, module2) {
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module2.exports = gte;
  },
});

// node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  'node_modules/semver/functions/lte.js'(exports2, module2) {
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module2.exports = lte;
  },
});

// node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  'node_modules/semver/functions/cmp.js'(exports2, module2) {
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case '===':
          if (typeof a === 'object') {
            a = a.version;
          }
          if (typeof b === 'object') {
            b = b.version;
          }
          return a === b;
        case '!==':
          if (typeof a === 'object') {
            a = a.version;
          }
          if (typeof b === 'object') {
            b = b.version;
          }
          return a !== b;
        case '':
        case '=':
        case '==':
          return eq(a, b, loose);
        case '!=':
          return neq(a, b, loose);
        case '>':
          return gt(a, b, loose);
        case '>=':
          return gte(a, b, loose);
        case '<':
          return lt(a, b, loose);
        case '<=':
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module2.exports = cmp;
  },
});

// node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  'node_modules/semver/functions/coerce.js'(exports2, module2) {
    var SemVer = require_semver();
    var parse2 = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version, options2) => {
      if (version instanceof SemVer) {
        return version;
      }
      if (typeof version === 'number') {
        version = String(version);
      }
      if (typeof version !== 'string') {
        return null;
      }
      options2 = options2 || {};
      let match = null;
      if (!options2.rtl) {
        match = version.match(options2.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options2.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || '0';
      const patch = match[4] || '0';
      const prerelease = options2.includePrerelease && match[5] ? `-${match[5]}` : '';
      const build = options2.includePrerelease && match[6] ? `+${match[6]}` : '';
      return parse2(`${major}.${minor}.${patch}${prerelease}${build}`, options2);
    };
    module2.exports = coerce;
  },
});

// node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  'node_modules/semver/internal/lrucache.js'(exports2, module2) {
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module2.exports = LRUCache;
  },
});

// node_modules/semver/classes/range.js
var require_range = __commonJS({
  'node_modules/semver/classes/range.js'(exports2, module2) {
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options2) {
        options2 = parseOptions(options2);
        if (range instanceof _Range) {
          if (range.loose === !!options2.loose && range.includePrerelease === !!options2.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options2);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options2;
        this.loose = !!options2.loose;
        this.includePrerelease = !!options2.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, ' ');
        this.set = this.raw
          .split('||')
          .map((r) => this.parseRange(r.trim()))
          .filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = '';
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += '||';
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += ' ';
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        const memoOpts =
          (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ':' + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug('hyphen replace', range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug('comparator trim', range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug('tilde trim', range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug('caret trim', range);
        let rangeList = range
          .split(' ')
          .map((comp) => parseComparator(comp, this.options))
          .join(' ')
          .split(/\s+/)
          .map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug('loose invalid filter', comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug('range list', rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has('')) {
          rangeMap.delete('');
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options2) {
        if (!(range instanceof _Range)) {
          throw new TypeError('a Range is required');
        }
        return this.set.some((thisComparators) => {
          return (
            isSatisfiable(thisComparators, options2) &&
            range.set.some((rangeComparators) => {
              return (
                isSatisfiable(rangeComparators, options2) &&
                thisComparators.every((thisComparator) => {
                  return rangeComparators.every((rangeComparator) => {
                    return thisComparator.intersects(rangeComparator, options2);
                  });
                })
              );
            })
          );
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version) {
        if (!version) {
          return false;
        }
        if (typeof version === 'string') {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module2.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var { safeRe: re, t, comparatorTrimReplace, tildeTrimReplace, caretTrimReplace } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var isNullSet = (c) => c.value === '<0.0.0-0';
    var isAny = (c) => c.value === '';
    var isSatisfiable = (comparators, options2) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options2);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options2) => {
      debug('comp', comp, options2);
      comp = replaceCarets(comp, options2);
      debug('caret', comp);
      comp = replaceTildes(comp, options2);
      debug('tildes', comp);
      comp = replaceXRanges(comp, options2);
      debug('xrange', comp);
      comp = replaceStars(comp, options2);
      debug('stars', comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === 'x' || id === '*';
    var replaceTildes = (comp, options2) => {
      return comp
        .trim()
        .split(/\s+/)
        .map((c) => replaceTilde(c, options2))
        .join(' ');
    };
    var replaceTilde = (comp, options2) => {
      const r = options2.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      return comp.replace(r, (_, M, m, p, pr) => {
        debug('tilde', comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = '';
        } else if (isX(m)) {
          ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug('replaceTilde pr', pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug('tilde return', ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options2) => {
      return comp
        .trim()
        .split(/\s+/)
        .map((c) => replaceCaret(c, options2))
        .join(' ');
    };
    var replaceCaret = (comp, options2) => {
      debug('caret', comp, options2);
      const r = options2.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options2.includePrerelease ? '-0' : '';
      return comp.replace(r, (_, M, m, p, pr) => {
        debug('caret', comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = '';
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === '0') {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug('replaceCaret pr', pr);
          if (M === '0') {
            if (m === '0') {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug('no pr');
          if (M === '0') {
            if (m === '0') {
              ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug('caret return', ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options2) => {
      debug('replaceXRanges', comp, options2);
      return comp
        .split(/\s+/)
        .map((c) => replaceXRange(c, options2))
        .join(' ');
    };
    var replaceXRange = (comp, options2) => {
      comp = comp.trim();
      const r = options2.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug('xRange', comp, ret, gtlt, M, m, p, pr);
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === '=' && anyX) {
          gtlt = '';
        }
        pr = options2.includePrerelease ? '-0' : '';
        if (xM) {
          if (gtlt === '>' || gtlt === '<') {
            ret = '<0.0.0-0';
          } else {
            ret = '*';
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === '>') {
            gtlt = '>=';
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === '<=') {
            gtlt = '<';
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === '<') {
            pr = '-0';
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug('xRange return', ret);
        return ret;
      });
    };
    var replaceStars = (comp, options2) => {
      debug('replaceStars', comp, options2);
      return comp.trim().replace(re[t.STAR], '');
    };
    var replaceGTE0 = (comp, options2) => {
      debug('replaceGTE0', comp, options2);
      return comp.trim().replace(re[options2.includePrerelease ? t.GTE0PRE : t.GTE0], '');
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = '';
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? '-0' : ''}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? '-0' : ''}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? '-0' : ''}`;
      }
      if (isX(tM)) {
        to = '';
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version, options2) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
          return false;
        }
      }
      if (version.prerelease.length && !options2.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  },
});

// node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  'node_modules/semver/classes/comparator.js'(exports2, module2) {
    var ANY = Symbol('SemVer ANY');
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options2) {
        options2 = parseOptions(options2);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options2.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(' ');
        debug('comparator', comp, options2);
        this.options = options2;
        this.loose = !!options2.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = '';
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug('comp', this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : '';
        if (this.operator === '=') {
          this.operator = '';
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version) {
        debug('Comparator.test', version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
          return true;
        }
        if (typeof version === 'string') {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version, this.operator, this.semver, this.options);
      }
      intersects(comp, options2) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError('a Comparator is required');
        }
        if (this.operator === '') {
          if (this.value === '') {
            return true;
          }
          return new Range(comp.value, options2).test(this.value);
        } else if (comp.operator === '') {
          if (comp.value === '') {
            return true;
          }
          return new Range(this.value, options2).test(comp.semver);
        }
        options2 = parseOptions(options2);
        if (options2.includePrerelease && (this.value === '<0.0.0-0' || comp.value === '<0.0.0-0')) {
          return false;
        }
        if (!options2.includePrerelease && (this.value.startsWith('<0.0.0') || comp.value.startsWith('<0.0.0'))) {
          return false;
        }
        if (this.operator.startsWith('>') && comp.operator.startsWith('>')) {
          return true;
        }
        if (this.operator.startsWith('<') && comp.operator.startsWith('<')) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes('=') && comp.operator.includes('=')) {
          return true;
        }
        if (
          cmp(this.semver, '<', comp.semver, options2) &&
          this.operator.startsWith('>') &&
          comp.operator.startsWith('<')
        ) {
          return true;
        }
        if (
          cmp(this.semver, '>', comp.semver, options2) &&
          this.operator.startsWith('<') &&
          comp.operator.startsWith('>')
        ) {
          return true;
        }
        return false;
      }
    };
    module2.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  },
});

// node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  'node_modules/semver/functions/satisfies.js'(exports2, module2) {
    var Range = require_range();
    var satisfies = (version, range, options2) => {
      try {
        range = new Range(range, options2);
      } catch (er) {
        return false;
      }
      return range.test(version);
    };
    module2.exports = satisfies;
  },
});

// node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  'node_modules/semver/ranges/to-comparators.js'(exports2, module2) {
    var Range = require_range();
    var toComparators = (range, options2) =>
      new Range(range, options2).set.map((comp) =>
        comp
          .map((c) => c.value)
          .join(' ')
          .trim()
          .split(' '),
      );
    module2.exports = toComparators;
  },
});

// node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  'node_modules/semver/ranges/max-satisfying.js'(exports2, module2) {
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions, range, options2) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options2);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options2);
          }
        }
      });
      return max;
    };
    module2.exports = maxSatisfying;
  },
});

// node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  'node_modules/semver/ranges/min-satisfying.js'(exports2, module2) {
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions, range, options2) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options2);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options2);
          }
        }
      });
      return min;
    };
    module2.exports = minSatisfying;
  },
});

// node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  'node_modules/semver/ranges/min-version.js'(exports2, module2) {
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer('0.0.0');
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer('0.0.0-0');
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case '>':
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case '':
            case '>=':
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case '<':
            case '<=':
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module2.exports = minVersion;
  },
});

// node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  'node_modules/semver/ranges/valid.js'(exports2, module2) {
    var Range = require_range();
    var validRange = (range, options2) => {
      try {
        return new Range(range, options2).range || '*';
      } catch (er) {
        return null;
      }
    };
    module2.exports = validRange;
  },
});

// node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  'node_modules/semver/ranges/outside.js'(exports2, module2) {
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version, range, hilo, options2) => {
      version = new SemVer(version, options2);
      range = new Range(range, options2);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case '>':
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = '>';
          ecomp = '>=';
          break;
        case '<':
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = '<';
          ecomp = '<=';
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version, range, options2)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator('>=0.0.0');
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options2)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options2)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module2.exports = outside;
  },
});

// node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  'node_modules/semver/ranges/gtr.js'(exports2, module2) {
    var outside = require_outside();
    var gtr = (version, range, options2) => outside(version, range, '>', options2);
    module2.exports = gtr;
  },
});

// node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  'node_modules/semver/ranges/ltr.js'(exports2, module2) {
    var outside = require_outside();
    var ltr = (version, range, options2) => outside(version, range, '<', options2);
    module2.exports = ltr;
  },
});

// node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  'node_modules/semver/ranges/intersects.js'(exports2, module2) {
    var Range = require_range();
    var intersects = (r1, r2, options2) => {
      r1 = new Range(r1, options2);
      r2 = new Range(r2, options2);
      return r1.intersects(r2, options2);
    };
    module2.exports = intersects;
  },
});

// node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  'node_modules/semver/ranges/simplify.js'(exports2, module2) {
    var satisfies = require_satisfies();
    var compare = require_compare();
    module2.exports = (versions, range, options2) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions.sort((a, b) => compare(a, b, options2));
      for (const version of v) {
        const included = satisfies(version, range, options2);
        if (included) {
          prev = version;
          if (!first) {
            first = version;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push('*');
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(' || ');
      const original = typeof range.raw === 'string' ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  },
});

// node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  'node_modules/semver/ranges/subset.js'(exports2, module2) {
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare = require_compare();
    var subset = (sub, dom, options2 = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options2);
      dom = new Range(dom, options2);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options2);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator('>=0.0.0-0')];
    var minimumVersion = [new Comparator('>=0.0.0')];
    var simpleSubset = (sub, dom, options2) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options2.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options2.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === '>' || c.operator === '>=') {
          gt = higherGT(gt, c, options2);
        } else if (c.operator === '<' || c.operator === '<=') {
          lt = lowerLT(lt, c, options2);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options2);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== '>=' || lt.operator !== '<=')) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options2)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options2)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options2)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options2.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options2.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (
        needDomLTPre &&
        needDomLTPre.prerelease.length === 1 &&
        lt.operator === '<' &&
        needDomLTPre.prerelease[0] === 0
      ) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === '>' || c.operator === '>=';
        hasDomLT = hasDomLT || c.operator === '<' || c.operator === '<=';
        if (gt) {
          if (needDomGTPre) {
            if (
              c.semver.prerelease &&
              c.semver.prerelease.length &&
              c.semver.major === needDomGTPre.major &&
              c.semver.minor === needDomGTPre.minor &&
              c.semver.patch === needDomGTPre.patch
            ) {
              needDomGTPre = false;
            }
          }
          if (c.operator === '>' || c.operator === '>=') {
            higher = higherGT(gt, c, options2);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === '>=' && !satisfies(gt.semver, String(c), options2)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (
              c.semver.prerelease &&
              c.semver.prerelease.length &&
              c.semver.major === needDomLTPre.major &&
              c.semver.minor === needDomLTPre.minor &&
              c.semver.patch === needDomLTPre.patch
            ) {
              needDomLTPre = false;
            }
          }
          if (c.operator === '<' || c.operator === '<=') {
            lower = lowerLT(lt, c, options2);
            if (lower === c && lower !== lt) {
              return false;
            }
          } else if (lt.operator === '<=' && !satisfies(lt.semver, String(c), options2)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options2) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options2);
      return comp > 0 ? a : comp < 0 ? b : b.operator === '>' && a.operator === '>=' ? b : a;
    };
    var lowerLT = (a, b, options2) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options2);
      return comp < 0 ? a : comp > 0 ? b : b.operator === '<' && a.operator === '<=' ? b : a;
    };
    module2.exports = subset;
  },
});

// node_modules/semver/index.js
var require_semver2 = __commonJS({
  'node_modules/semver/index.js'(exports2, module2) {
    var internalRe = require_re();
    var constants = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse2 = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module2.exports = {
      parse: parse2,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers,
    };
  },
});

// node_modules/ini/ini.js
var require_ini = __commonJS({
  'node_modules/ini/ini.js'(exports2) {
    exports2.parse = exports2.decode = decode;
    exports2.stringify = exports2.encode = encode;
    exports2.safe = safe;
    exports2.unsafe = unsafe;
    var eol = typeof process !== 'undefined' && process.platform === 'win32' ? '\r\n' : '\n';
    function encode(obj, opt) {
      var children = [];
      var out = '';
      if (typeof opt === 'string') {
        opt = {
          section: opt,
          whitespace: false,
        };
      } else {
        opt = opt || {};
        opt.whitespace = opt.whitespace === true;
      }
      var separator = opt.whitespace ? ' = ' : '=';
      Object.keys(obj).forEach(function (k, _, __) {
        var val = obj[k];
        if (val && Array.isArray(val)) {
          val.forEach(function (item) {
            out += safe(k + '[]') + separator + safe(item) + '\n';
          });
        } else if (val && typeof val === 'object') children.push(k);
        else out += safe(k) + separator + safe(val) + eol;
      });
      if (opt.section && out.length) out = '[' + safe(opt.section) + ']' + eol + out;
      children.forEach(function (k, _, __) {
        var nk = dotSplit(k).join('\\.');
        var section = (opt.section ? opt.section + '.' : '') + nk;
        var child = encode(obj[k], {
          section,
          whitespace: opt.whitespace,
        });
        if (out.length && child.length) out += eol;
        out += child;
      });
      return out;
    }
    function dotSplit(str) {
      return str
        .replace(/\1/g, 'LITERAL\\1LITERAL')
        .replace(/\\\./g, '')
        .split(/\./)
        .map(function (part) {
          return part.replace(/\1/g, '\\.').replace(/\2LITERAL\\1LITERAL\2/g, '');
        });
    }
    function decode(str) {
      var out = {};
      var p = out;
      var section = null;
      var re = /^\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i;
      var lines = str.split(/[\r\n]+/g);
      lines.forEach(function (line, _, __) {
        if (!line || line.match(/^\s*[;#]/)) return;
        var match = line.match(re);
        if (!match) return;
        if (match[1] !== void 0) {
          section = unsafe(match[1]);
          if (section === '__proto__') {
            p = {};
            return;
          }
          p = out[section] = out[section] || {};
          return;
        }
        var key = unsafe(match[2]);
        if (key === '__proto__') return;
        var value = match[3] ? unsafe(match[4]) : true;
        switch (value) {
          case 'true':
          case 'false':
          case 'null':
            value = JSON.parse(value);
        }
        if (key.length > 2 && key.slice(-2) === '[]') {
          key = key.substring(0, key.length - 2);
          if (key === '__proto__') return;
          if (!p[key]) p[key] = [];
          else if (!Array.isArray(p[key])) p[key] = [p[key]];
        }
        if (Array.isArray(p[key])) p[key].push(value);
        else p[key] = value;
      });
      Object.keys(out)
        .filter(function (k, _, __) {
          if (!out[k] || typeof out[k] !== 'object' || Array.isArray(out[k])) return false;
          var parts = dotSplit(k);
          var p2 = out;
          var l = parts.pop();
          var nl = l.replace(/\\\./g, '.');
          parts.forEach(function (part, _2, __2) {
            if (part === '__proto__') return;
            if (!p2[part] || typeof p2[part] !== 'object') p2[part] = {};
            p2 = p2[part];
          });
          if (p2 === out && nl === l) return false;
          p2[nl] = out[k];
          return true;
        })
        .forEach(function (del, _, __) {
          delete out[del];
        });
      return out;
    }
    function isQuoted(val) {
      return (val.charAt(0) === '"' && val.slice(-1) === '"') || (val.charAt(0) === "'" && val.slice(-1) === "'");
    }
    function safe(val) {
      return typeof val !== 'string' ||
        val.match(/[=\r\n]/) ||
        val.match(/^\[/) ||
        (val.length > 1 && isQuoted(val)) ||
        val !== val.trim()
        ? JSON.stringify(val)
        : val.replace(/;/g, '\\;').replace(/#/g, '\\#');
    }
    function unsafe(val, doUnesc) {
      val = (val || '').trim();
      if (isQuoted(val)) {
        if (val.charAt(0) === "'") val = val.substr(1, val.length - 2);
        try {
          val = JSON.parse(val);
        } catch (_) {}
      } else {
        var esc = false;
        var unesc = '';
        for (var i = 0, l = val.length; i < l; i++) {
          var c = val.charAt(i);
          if (esc) {
            if ('\\;#'.indexOf(c) !== -1) unesc += c;
            else unesc += '\\' + c;
            esc = false;
          } else if (';#'.indexOf(c) !== -1) break;
          else if (c === '\\') esc = true;
          else unesc += c;
        }
        if (esc) unesc += '\\';
        return unesc.trim();
      }
      return val;
    }
  },
});

// node_modules/rc/node_modules/strip-json-comments/index.js
var require_strip_json_comments = __commonJS({
  'node_modules/rc/node_modules/strip-json-comments/index.js'(exports2, module2) {
    'use strict';
    var singleComment = 1;
    var multiComment = 2;
    function stripWithoutWhitespace() {
      return '';
    }
    function stripWithWhitespace(str, start, end) {
      return str.slice(start, end).replace(/\S/g, ' ');
    }
    module2.exports = function (str, opts) {
      opts = opts || {};
      var currentChar;
      var nextChar;
      var insideString = false;
      var insideComment = false;
      var offset = 0;
      var ret = '';
      var strip = opts.whitespace === false ? stripWithoutWhitespace : stripWithWhitespace;
      for (var i = 0; i < str.length; i++) {
        currentChar = str[i];
        nextChar = str[i + 1];
        if (!insideComment && currentChar === '"') {
          var escaped = str[i - 1] === '\\' && str[i - 2] !== '\\';
          if (!escaped) {
            insideString = !insideString;
          }
        }
        if (insideString) {
          continue;
        }
        if (!insideComment && currentChar + nextChar === '//') {
          ret += str.slice(offset, i);
          offset = i;
          insideComment = singleComment;
          i++;
        } else if (insideComment === singleComment && currentChar + nextChar === '\r\n') {
          i++;
          insideComment = false;
          ret += strip(str, offset, i);
          offset = i;
          continue;
        } else if (insideComment === singleComment && currentChar === '\n') {
          insideComment = false;
          ret += strip(str, offset, i);
          offset = i;
        } else if (!insideComment && currentChar + nextChar === '/*') {
          ret += str.slice(offset, i);
          offset = i;
          insideComment = multiComment;
          i++;
          continue;
        } else if (insideComment === multiComment && currentChar + nextChar === '*/') {
          i++;
          insideComment = false;
          ret += strip(str, offset, i + 1);
          offset = i + 1;
          continue;
        }
      }
      return ret + (insideComment ? strip(str.substr(offset)) : str.substr(offset));
    };
  },
});

// node_modules/rc/lib/utils.js
var require_utils = __commonJS({
  'node_modules/rc/lib/utils.js'(exports2) {
    'use strict';
    var fs2 = require('fs');
    var ini = require_ini();
    var path = require('path');
    var stripJsonComments = require_strip_json_comments();
    var parse2 = (exports2.parse = function (content) {
      if (/^\s*{/.test(content)) return JSON.parse(stripJsonComments(content));
      return ini.parse(content);
    });
    var file = (exports2.file = function () {
      var args = [].slice.call(arguments).filter(function (arg) {
        return arg != null;
      });
      for (var i in args) if ('string' !== typeof args[i]) return;
      var file2 = path.join.apply(null, args);
      var content;
      try {
        return fs2.readFileSync(file2, 'utf-8');
      } catch (err) {
        return;
      }
    });
    var json = (exports2.json = function () {
      var content = file.apply(null, arguments);
      return content ? parse2(content) : null;
    });
    var env2 = (exports2.env = function (prefix, env3) {
      env3 = env3 || process.env;
      var obj = {};
      var l = prefix.length;
      for (var k in env3) {
        if (k.toLowerCase().indexOf(prefix.toLowerCase()) === 0) {
          var keypath = k.substring(l).split('__');
          var _emptyStringIndex;
          while ((_emptyStringIndex = keypath.indexOf('')) > -1) {
            keypath.splice(_emptyStringIndex, 1);
          }
          var cursor = obj;
          keypath.forEach(function _buildSubObj(_subkey, i) {
            if (!_subkey || typeof cursor !== 'object') return;
            if (i === keypath.length - 1) cursor[_subkey] = env3[k];
            if (cursor[_subkey] === void 0) cursor[_subkey] = {};
            cursor = cursor[_subkey];
          });
        }
      }
      return obj;
    });
    var find = (exports2.find = function () {
      var rel = path.join.apply(null, [].slice.call(arguments));
      function find2(start, rel2) {
        var file2 = path.join(start, rel2);
        try {
          fs2.statSync(file2);
          return file2;
        } catch (err) {
          if (path.dirname(start) !== start) return find2(path.dirname(start), rel2);
        }
      }
      return find2(process.cwd(), rel);
    });
  },
});

// node_modules/deep-extend/lib/deep-extend.js
var require_deep_extend = __commonJS({
  'node_modules/deep-extend/lib/deep-extend.js'(exports2, module2) {
    'use strict';
    function isSpecificValue(val) {
      return val instanceof Buffer || val instanceof Date || val instanceof RegExp ? true : false;
    }
    function cloneSpecificValue(val) {
      if (val instanceof Buffer) {
        var x = Buffer.alloc ? Buffer.alloc(val.length) : new Buffer(val.length);
        val.copy(x);
        return x;
      } else if (val instanceof Date) {
        return new Date(val.getTime());
      } else if (val instanceof RegExp) {
        return new RegExp(val);
      } else {
        throw new Error('Unexpected situation');
      }
    }
    function deepCloneArray(arr) {
      var clone = [];
      arr.forEach(function (item, index) {
        if (typeof item === 'object' && item !== null) {
          if (Array.isArray(item)) {
            clone[index] = deepCloneArray(item);
          } else if (isSpecificValue(item)) {
            clone[index] = cloneSpecificValue(item);
          } else {
            clone[index] = deepExtend({}, item);
          }
        } else {
          clone[index] = item;
        }
      });
      return clone;
    }
    function safeGetProperty(object, property) {
      return property === '__proto__' ? void 0 : object[property];
    }
    var deepExtend = (module2.exports = function () {
      if (arguments.length < 1 || typeof arguments[0] !== 'object') {
        return false;
      }
      if (arguments.length < 2) {
        return arguments[0];
      }
      var target = arguments[0];
      var args = Array.prototype.slice.call(arguments, 1);
      var val, src, clone;
      args.forEach(function (obj) {
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
          return;
        }
        Object.keys(obj).forEach(function (key) {
          src = safeGetProperty(target, key);
          val = safeGetProperty(obj, key);
          if (val === target) {
            return;
          } else if (typeof val !== 'object' || val === null) {
            target[key] = val;
            return;
          } else if (Array.isArray(val)) {
            target[key] = deepCloneArray(val);
            return;
          } else if (isSpecificValue(val)) {
            target[key] = cloneSpecificValue(val);
            return;
          } else if (typeof src !== 'object' || src === null || Array.isArray(src)) {
            target[key] = deepExtend({}, val);
            return;
          } else {
            target[key] = deepExtend(src, val);
            return;
          }
        });
      });
      return target;
    });
  },
});

// node_modules/minimist/index.js
var require_minimist = __commonJS({
  'node_modules/minimist/index.js'(exports2, module2) {
    'use strict';
    function hasKey(obj, keys) {
      var o = obj;
      keys.slice(0, -1).forEach(function (key2) {
        o = o[key2] || {};
      });
      var key = keys[keys.length - 1];
      return key in o;
    }
    function isNumber(x) {
      if (typeof x === 'number') {
        return true;
      }
      if (/^0x[0-9a-f]+$/i.test(x)) {
        return true;
      }
      return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
    }
    function isConstructorOrProto(obj, key) {
      return (key === 'constructor' && typeof obj[key] === 'function') || key === '__proto__';
    }
    module2.exports = function (args, opts) {
      if (!opts) {
        opts = {};
      }
      var flags = {
        bools: {},
        strings: {},
        unknownFn: null,
      };
      if (typeof opts.unknown === 'function') {
        flags.unknownFn = opts.unknown;
      }
      if (typeof opts.boolean === 'boolean' && opts.boolean) {
        flags.allBools = true;
      } else {
        []
          .concat(opts.boolean)
          .filter(Boolean)
          .forEach(function (key2) {
            flags.bools[key2] = true;
          });
      }
      var aliases = {};
      function aliasIsBoolean(key2) {
        return aliases[key2].some(function (x) {
          return flags.bools[x];
        });
      }
      Object.keys(opts.alias || {}).forEach(function (key2) {
        aliases[key2] = [].concat(opts.alias[key2]);
        aliases[key2].forEach(function (x) {
          aliases[x] = [key2].concat(
            aliases[key2].filter(function (y) {
              return x !== y;
            }),
          );
        });
      });
      []
        .concat(opts.string)
        .filter(Boolean)
        .forEach(function (key2) {
          flags.strings[key2] = true;
          if (aliases[key2]) {
            [].concat(aliases[key2]).forEach(function (k) {
              flags.strings[k] = true;
            });
          }
        });
      var defaults = opts.default || {};
      var argv = { _: [] };
      function argDefined(key2, arg2) {
        return (flags.allBools && /^--[^=]+$/.test(arg2)) || flags.strings[key2] || flags.bools[key2] || aliases[key2];
      }
      function setKey(obj, keys, value2) {
        var o = obj;
        for (var i2 = 0; i2 < keys.length - 1; i2++) {
          var key2 = keys[i2];
          if (isConstructorOrProto(o, key2)) {
            return;
          }
          if (o[key2] === void 0) {
            o[key2] = {};
          }
          if (o[key2] === Object.prototype || o[key2] === Number.prototype || o[key2] === String.prototype) {
            o[key2] = {};
          }
          if (o[key2] === Array.prototype) {
            o[key2] = [];
          }
          o = o[key2];
        }
        var lastKey = keys[keys.length - 1];
        if (isConstructorOrProto(o, lastKey)) {
          return;
        }
        if (o === Object.prototype || o === Number.prototype || o === String.prototype) {
          o = {};
        }
        if (o === Array.prototype) {
          o = [];
        }
        if (o[lastKey] === void 0 || flags.bools[lastKey] || typeof o[lastKey] === 'boolean') {
          o[lastKey] = value2;
        } else if (Array.isArray(o[lastKey])) {
          o[lastKey].push(value2);
        } else {
          o[lastKey] = [o[lastKey], value2];
        }
      }
      function setArg(key2, val, arg2) {
        if (arg2 && flags.unknownFn && !argDefined(key2, arg2)) {
          if (flags.unknownFn(arg2) === false) {
            return;
          }
        }
        var value2 = !flags.strings[key2] && isNumber(val) ? Number(val) : val;
        setKey(argv, key2.split('.'), value2);
        (aliases[key2] || []).forEach(function (x) {
          setKey(argv, x.split('.'), value2);
        });
      }
      Object.keys(flags.bools).forEach(function (key2) {
        setArg(key2, defaults[key2] === void 0 ? false : defaults[key2]);
      });
      var notFlags = [];
      if (args.indexOf('--') !== -1) {
        notFlags = args.slice(args.indexOf('--') + 1);
        args = args.slice(0, args.indexOf('--'));
      }
      for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        var key;
        var next;
        if (/^--.+=/.test(arg)) {
          var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
          key = m[1];
          var value = m[2];
          if (flags.bools[key]) {
            value = value !== 'false';
          }
          setArg(key, value, arg);
        } else if (/^--no-.+/.test(arg)) {
          key = arg.match(/^--no-(.+)/)[1];
          setArg(key, false, arg);
        } else if (/^--.+/.test(arg)) {
          key = arg.match(/^--(.+)/)[1];
          next = args[i + 1];
          if (
            next !== void 0 &&
            !/^(-|--)[^-]/.test(next) &&
            !flags.bools[key] &&
            !flags.allBools &&
            (aliases[key] ? !aliasIsBoolean(key) : true)
          ) {
            setArg(key, next, arg);
            i += 1;
          } else if (/^(true|false)$/.test(next)) {
            setArg(key, next === 'true', arg);
            i += 1;
          } else {
            setArg(key, flags.strings[key] ? '' : true, arg);
          }
        } else if (/^-[^-]+/.test(arg)) {
          var letters = arg.slice(1, -1).split('');
          var broken = false;
          for (var j = 0; j < letters.length; j++) {
            next = arg.slice(j + 2);
            if (next === '-') {
              setArg(letters[j], next, arg);
              continue;
            }
            if (/[A-Za-z]/.test(letters[j]) && next[0] === '=') {
              setArg(letters[j], next.slice(1), arg);
              broken = true;
              break;
            }
            if (/[A-Za-z]/.test(letters[j]) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
              setArg(letters[j], next, arg);
              broken = true;
              break;
            }
            if (letters[j + 1] && letters[j + 1].match(/\W/)) {
              setArg(letters[j], arg.slice(j + 2), arg);
              broken = true;
              break;
            } else {
              setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
            }
          }
          key = arg.slice(-1)[0];
          if (!broken && key !== '-') {
            if (
              args[i + 1] &&
              !/^(-|--)[^-]/.test(args[i + 1]) &&
              !flags.bools[key] &&
              (aliases[key] ? !aliasIsBoolean(key) : true)
            ) {
              setArg(key, args[i + 1], arg);
              i += 1;
            } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
              setArg(key, args[i + 1] === 'true', arg);
              i += 1;
            } else {
              setArg(key, flags.strings[key] ? '' : true, arg);
            }
          }
        } else {
          if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
            argv._.push(flags.strings._ || !isNumber(arg) ? arg : Number(arg));
          }
          if (opts.stopEarly) {
            argv._.push.apply(argv._, args.slice(i + 1));
            break;
          }
        }
      }
      Object.keys(defaults).forEach(function (k) {
        if (!hasKey(argv, k.split('.'))) {
          setKey(argv, k.split('.'), defaults[k]);
          (aliases[k] || []).forEach(function (x) {
            setKey(argv, x.split('.'), defaults[k]);
          });
        }
      });
      if (opts['--']) {
        argv['--'] = notFlags.slice();
      } else {
        notFlags.forEach(function (k) {
          argv._.push(k);
        });
      }
      return argv;
    };
  },
});

// node_modules/rc/index.js
var require_rc = __commonJS({
  'node_modules/rc/index.js'(exports2, module2) {
    var cc = require_utils();
    var join = require('path').join;
    var deepExtend = require_deep_extend();
    var etc = '/etc';
    var win = process.platform === 'win32';
    var home = win ? process.env.USERPROFILE : process.env.HOME;
    module2.exports = function (name, defaults, argv, parse2) {
      if ('string' !== typeof name) throw new Error('rc(name): name *must* be string');
      if (!argv) argv = require_minimist()(process.argv.slice(2));
      defaults = ('string' === typeof defaults ? cc.json(defaults) : defaults) || {};
      parse2 = parse2 || cc.parse;
      var env2 = cc.env(name + '_');
      var configs = [defaults];
      var configFiles = [];
      function addConfigFile(file) {
        if (configFiles.indexOf(file) >= 0) return;
        var fileConfig = cc.file(file);
        if (fileConfig) {
          configs.push(parse2(fileConfig));
          configFiles.push(file);
        }
      }
      if (!win) [join(etc, name, 'config'), join(etc, name + 'rc')].forEach(addConfigFile);
      if (home)
        [
          join(home, '.config', name, 'config'),
          join(home, '.config', name),
          join(home, '.' + name, 'config'),
          join(home, '.' + name + 'rc'),
        ].forEach(addConfigFile);
      addConfigFile(cc.find('.' + name + 'rc'));
      if (env2.config) addConfigFile(env2.config);
      if (argv.config) addConfigFile(argv.config);
      return deepExtend.apply(
        null,
        configs.concat([
          env2,
          argv,
          configFiles.length ? { configs: configFiles, config: configFiles[configFiles.length - 1] } : void 0,
        ]),
      );
    };
  },
});

// node_modules/@pnpm/network.ca-file/node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS({
  'node_modules/@pnpm/network.ca-file/node_modules/graceful-fs/polyfills.js'(exports2, module2) {
    var constants = require('constants');
    var origCwd = process.cwd;
    var cwd = null;
    var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
    process.cwd = function () {
      if (!cwd) cwd = origCwd.call(process);
      return cwd;
    };
    try {
      process.cwd();
    } catch (er) {}
    if (typeof process.chdir === 'function') {
      chdir = process.chdir;
      process.chdir = function (d) {
        cwd = null;
        chdir.call(process, d);
      };
      if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
    }
    var chdir;
    module2.exports = patch;
    function patch(fs2) {
      if (constants.hasOwnProperty('O_SYMLINK') && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
        patchLchmod(fs2);
      }
      if (!fs2.lutimes) {
        patchLutimes(fs2);
      }
      fs2.chown = chownFix(fs2.chown);
      fs2.fchown = chownFix(fs2.fchown);
      fs2.lchown = chownFix(fs2.lchown);
      fs2.chmod = chmodFix(fs2.chmod);
      fs2.fchmod = chmodFix(fs2.fchmod);
      fs2.lchmod = chmodFix(fs2.lchmod);
      fs2.chownSync = chownFixSync(fs2.chownSync);
      fs2.fchownSync = chownFixSync(fs2.fchownSync);
      fs2.lchownSync = chownFixSync(fs2.lchownSync);
      fs2.chmodSync = chmodFixSync(fs2.chmodSync);
      fs2.fchmodSync = chmodFixSync(fs2.fchmodSync);
      fs2.lchmodSync = chmodFixSync(fs2.lchmodSync);
      fs2.stat = statFix(fs2.stat);
      fs2.fstat = statFix(fs2.fstat);
      fs2.lstat = statFix(fs2.lstat);
      fs2.statSync = statFixSync(fs2.statSync);
      fs2.fstatSync = statFixSync(fs2.fstatSync);
      fs2.lstatSync = statFixSync(fs2.lstatSync);
      if (fs2.chmod && !fs2.lchmod) {
        fs2.lchmod = function (path, mode, cb) {
          if (cb) process.nextTick(cb);
        };
        fs2.lchmodSync = function () {};
      }
      if (fs2.chown && !fs2.lchown) {
        fs2.lchown = function (path, uid, gid, cb) {
          if (cb) process.nextTick(cb);
        };
        fs2.lchownSync = function () {};
      }
      if (platform === 'win32') {
        fs2.rename =
          typeof fs2.rename !== 'function'
            ? fs2.rename
            : (function (fs$rename) {
                function rename(from, to, cb) {
                  var start = Date.now();
                  var backoff = 0;
                  fs$rename(from, to, function CB(er) {
                    if (er && (er.code === 'EACCES' || er.code === 'EPERM') && Date.now() - start < 6e4) {
                      setTimeout(function () {
                        fs2.stat(to, function (stater, st) {
                          if (stater && stater.code === 'ENOENT') fs$rename(from, to, CB);
                          else cb(er);
                        });
                      }, backoff);
                      if (backoff < 100) backoff += 10;
                      return;
                    }
                    if (cb) cb(er);
                  });
                }
                if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
                return rename;
              })(fs2.rename);
      }
      fs2.read =
        typeof fs2.read !== 'function'
          ? fs2.read
          : (function (fs$read) {
              function read(fd, buffer, offset, length, position, callback_) {
                var callback;
                if (callback_ && typeof callback_ === 'function') {
                  var eagCounter = 0;
                  callback = function (er, _, __) {
                    if (er && er.code === 'EAGAIN' && eagCounter < 10) {
                      eagCounter++;
                      return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
                    }
                    callback_.apply(this, arguments);
                  };
                }
                return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
              }
              if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
              return read;
            })(fs2.read);
      fs2.readSync =
        typeof fs2.readSync !== 'function'
          ? fs2.readSync
          : /* @__PURE__ */ (function (fs$readSync) {
              return function (fd, buffer, offset, length, position) {
                var eagCounter = 0;
                while (true) {
                  try {
                    return fs$readSync.call(fs2, fd, buffer, offset, length, position);
                  } catch (er) {
                    if (er.code === 'EAGAIN' && eagCounter < 10) {
                      eagCounter++;
                      continue;
                    }
                    throw er;
                  }
                }
              };
            })(fs2.readSync);
      function patchLchmod(fs3) {
        fs3.lchmod = function (path, mode, callback) {
          fs3.open(path, constants.O_WRONLY | constants.O_SYMLINK, mode, function (err, fd) {
            if (err) {
              if (callback) callback(err);
              return;
            }
            fs3.fchmod(fd, mode, function (err2) {
              fs3.close(fd, function (err22) {
                if (callback) callback(err2 || err22);
              });
            });
          });
        };
        fs3.lchmodSync = function (path, mode) {
          var fd = fs3.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);
          var threw = true;
          var ret;
          try {
            ret = fs3.fchmodSync(fd, mode);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs3.closeSync(fd);
              } catch (er) {}
            } else {
              fs3.closeSync(fd);
            }
          }
          return ret;
        };
      }
      function patchLutimes(fs3) {
        if (constants.hasOwnProperty('O_SYMLINK') && fs3.futimes) {
          fs3.lutimes = function (path, at, mt, cb) {
            fs3.open(path, constants.O_SYMLINK, function (er, fd) {
              if (er) {
                if (cb) cb(er);
                return;
              }
              fs3.futimes(fd, at, mt, function (er2) {
                fs3.close(fd, function (er22) {
                  if (cb) cb(er2 || er22);
                });
              });
            });
          };
          fs3.lutimesSync = function (path, at, mt) {
            var fd = fs3.openSync(path, constants.O_SYMLINK);
            var ret;
            var threw = true;
            try {
              ret = fs3.futimesSync(fd, at, mt);
              threw = false;
            } finally {
              if (threw) {
                try {
                  fs3.closeSync(fd);
                } catch (er) {}
              } else {
                fs3.closeSync(fd);
              }
            }
            return ret;
          };
        } else if (fs3.futimes) {
          fs3.lutimes = function (_a, _b, _c, cb) {
            if (cb) process.nextTick(cb);
          };
          fs3.lutimesSync = function () {};
        }
      }
      function chmodFix(orig) {
        if (!orig) return orig;
        return function (target, mode, cb) {
          return orig.call(fs2, target, mode, function (er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chmodFixSync(orig) {
        if (!orig) return orig;
        return function (target, mode) {
          try {
            return orig.call(fs2, target, mode);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function chownFix(orig) {
        if (!orig) return orig;
        return function (target, uid, gid, cb) {
          return orig.call(fs2, target, uid, gid, function (er) {
            if (chownErOk(er)) er = null;
            if (cb) cb.apply(this, arguments);
          });
        };
      }
      function chownFixSync(orig) {
        if (!orig) return orig;
        return function (target, uid, gid) {
          try {
            return orig.call(fs2, target, uid, gid);
          } catch (er) {
            if (!chownErOk(er)) throw er;
          }
        };
      }
      function statFix(orig) {
        if (!orig) return orig;
        return function (target, options2, cb) {
          if (typeof options2 === 'function') {
            cb = options2;
            options2 = null;
          }
          function callback(er, stats) {
            if (stats) {
              if (stats.uid < 0) stats.uid += 4294967296;
              if (stats.gid < 0) stats.gid += 4294967296;
            }
            if (cb) cb.apply(this, arguments);
          }
          return options2 ? orig.call(fs2, target, options2, callback) : orig.call(fs2, target, callback);
        };
      }
      function statFixSync(orig) {
        if (!orig) return orig;
        return function (target, options2) {
          var stats = options2 ? orig.call(fs2, target, options2) : orig.call(fs2, target);
          if (stats) {
            if (stats.uid < 0) stats.uid += 4294967296;
            if (stats.gid < 0) stats.gid += 4294967296;
          }
          return stats;
        };
      }
      function chownErOk(er) {
        if (!er) return true;
        if (er.code === 'ENOSYS') return true;
        var nonroot = !process.getuid || process.getuid() !== 0;
        if (nonroot) {
          if (er.code === 'EINVAL' || er.code === 'EPERM') return true;
        }
        return false;
      }
    }
  },
});

// node_modules/@pnpm/network.ca-file/node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS({
  'node_modules/@pnpm/network.ca-file/node_modules/graceful-fs/legacy-streams.js'(exports2, module2) {
    var Stream = require('stream').Stream;
    module2.exports = legacy;
    function legacy(fs2) {
      return {
        ReadStream,
        WriteStream,
      };
      function ReadStream(path, options2) {
        if (!(this instanceof ReadStream)) return new ReadStream(path, options2);
        Stream.call(this);
        var self = this;
        this.path = path;
        this.fd = null;
        this.readable = true;
        this.paused = false;
        this.flags = 'r';
        this.mode = 438;
        this.bufferSize = 64 * 1024;
        options2 = options2 || {};
        var keys = Object.keys(options2);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options2[key];
        }
        if (this.encoding) this.setEncoding(this.encoding);
        if (this.start !== void 0) {
          if ('number' !== typeof this.start) {
            throw TypeError('start must be a Number');
          }
          if (this.end === void 0) {
            this.end = Infinity;
          } else if ('number' !== typeof this.end) {
            throw TypeError('end must be a Number');
          }
          if (this.start > this.end) {
            throw new Error('start must be <= end');
          }
          this.pos = this.start;
        }
        if (this.fd !== null) {
          process.nextTick(function () {
            self._read();
          });
          return;
        }
        fs2.open(this.path, this.flags, this.mode, function (err, fd) {
          if (err) {
            self.emit('error', err);
            self.readable = false;
            return;
          }
          self.fd = fd;
          self.emit('open', fd);
          self._read();
        });
      }
      function WriteStream(path, options2) {
        if (!(this instanceof WriteStream)) return new WriteStream(path, options2);
        Stream.call(this);
        this.path = path;
        this.fd = null;
        this.writable = true;
        this.flags = 'w';
        this.encoding = 'binary';
        this.mode = 438;
        this.bytesWritten = 0;
        options2 = options2 || {};
        var keys = Object.keys(options2);
        for (var index = 0, length = keys.length; index < length; index++) {
          var key = keys[index];
          this[key] = options2[key];
        }
        if (this.start !== void 0) {
          if ('number' !== typeof this.start) {
            throw TypeError('start must be a Number');
          }
          if (this.start < 0) {
            throw new Error('start must be >= zero');
          }
          this.pos = this.start;
        }
        this.busy = false;
        this._queue = [];
        if (this.fd === null) {
          this._open = fs2.open;
          this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
          this.flush();
        }
      }
    }
  },
});

// node_modules/@pnpm/network.ca-file/node_modules/graceful-fs/clone.js
var require_clone = __commonJS({
  'node_modules/@pnpm/network.ca-file/node_modules/graceful-fs/clone.js'(exports2, module2) {
    'use strict';
    module2.exports = clone;
    var getPrototypeOf =
      Object.getPrototypeOf ||
      function (obj) {
        return obj.__proto__;
      };
    function clone(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Object) var copy = { __proto__: getPrototypeOf(obj) };
      else var copy = /* @__PURE__ */ Object.create(null);
      Object.getOwnPropertyNames(obj).forEach(function (key) {
        Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
      });
      return copy;
    }
  },
});

// node_modules/@pnpm/network.ca-file/node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS({
  'node_modules/@pnpm/network.ca-file/node_modules/graceful-fs/graceful-fs.js'(exports2, module2) {
    var fs2 = require('fs');
    var polyfills = require_polyfills();
    var legacy = require_legacy_streams();
    var clone = require_clone();
    var util = require('util');
    var gracefulQueue;
    var previousSymbol;
    if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
      gracefulQueue = Symbol.for('graceful-fs.queue');
      previousSymbol = Symbol.for('graceful-fs.previous');
    } else {
      gracefulQueue = '___graceful-fs.queue';
      previousSymbol = '___graceful-fs.previous';
    }
    function noop2() {}
    function publishQueue(context, queue2) {
      Object.defineProperty(context, gracefulQueue, {
        get: function () {
          return queue2;
        },
      });
    }
    var debug = noop2;
    if (util.debuglog) debug = util.debuglog('gfs4');
    else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
      debug = function () {
        var m = util.format.apply(util, arguments);
        m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
        console.error(m);
      };
    if (!fs2[gracefulQueue]) {
      queue = global[gracefulQueue] || [];
      publishQueue(fs2, queue);
      fs2.close = (function (fs$close) {
        function close(fd, cb) {
          return fs$close.call(fs2, fd, function (err) {
            if (!err) {
              resetQueue();
            }
            if (typeof cb === 'function') cb.apply(this, arguments);
          });
        }
        Object.defineProperty(close, previousSymbol, {
          value: fs$close,
        });
        return close;
      })(fs2.close);
      fs2.closeSync = (function (fs$closeSync) {
        function closeSync(fd) {
          fs$closeSync.apply(fs2, arguments);
          resetQueue();
        }
        Object.defineProperty(closeSync, previousSymbol, {
          value: fs$closeSync,
        });
        return closeSync;
      })(fs2.closeSync);
      if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
        process.on('exit', function () {
          debug(fs2[gracefulQueue]);
          require('assert').equal(fs2[gracefulQueue].length, 0);
        });
      }
    }
    var queue;
    if (!global[gracefulQueue]) {
      publishQueue(global, fs2[gracefulQueue]);
    }
    module2.exports = patch(clone(fs2));
    if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs2.__patched) {
      module2.exports = patch(fs2);
      fs2.__patched = true;
    }
    function patch(fs3) {
      polyfills(fs3);
      fs3.gracefulify = patch;
      fs3.createReadStream = createReadStream;
      fs3.createWriteStream = createWriteStream;
      var fs$readFile = fs3.readFile;
      fs3.readFile = readFile;
      function readFile(path, options2, cb) {
        if (typeof options2 === 'function') (cb = options2), (options2 = null);
        return go$readFile(path, options2, cb);
        function go$readFile(path2, options3, cb2, startTime) {
          return fs$readFile(path2, options3, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$readFile, [path2, options3, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$writeFile = fs3.writeFile;
      fs3.writeFile = writeFile;
      function writeFile(path, data, options2, cb) {
        if (typeof options2 === 'function') (cb = options2), (options2 = null);
        return go$writeFile(path, data, options2, cb);
        function go$writeFile(path2, data2, options3, cb2, startTime) {
          return fs$writeFile(path2, data2, options3, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$writeFile, [path2, data2, options3, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$appendFile = fs3.appendFile;
      if (fs$appendFile) fs3.appendFile = appendFile;
      function appendFile(path, data, options2, cb) {
        if (typeof options2 === 'function') (cb = options2), (options2 = null);
        return go$appendFile(path, data, options2, cb);
        function go$appendFile(path2, data2, options3, cb2, startTime) {
          return fs$appendFile(path2, data2, options3, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$appendFile, [path2, data2, options3, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$copyFile = fs3.copyFile;
      if (fs$copyFile) fs3.copyFile = copyFile;
      function copyFile(src, dest, flags, cb) {
        if (typeof flags === 'function') {
          cb = flags;
          flags = 0;
        }
        return go$copyFile(src, dest, flags, cb);
        function go$copyFile(src2, dest2, flags2, cb2, startTime) {
          return fs$copyFile(src2, dest2, flags2, function (err) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments);
            }
          });
        }
      }
      var fs$readdir = fs3.readdir;
      fs3.readdir = readdir;
      var noReaddirOptionVersions = /^v[0-5]\./;
      function readdir(path, options2, cb) {
        if (typeof options2 === 'function') (cb = options2), (options2 = null);
        var go$readdir = noReaddirOptionVersions.test(process.version)
          ? function go$readdir2(path2, options3, cb2, startTime) {
              return fs$readdir(path2, fs$readdirCallback(path2, options3, cb2, startTime));
            }
          : function go$readdir2(path2, options3, cb2, startTime) {
              return fs$readdir(path2, options3, fs$readdirCallback(path2, options3, cb2, startTime));
            };
        return go$readdir(path, options2, cb);
        function fs$readdirCallback(path2, options3, cb2, startTime) {
          return function (err, files) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$readdir, [path2, options3, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (files && files.sort) files.sort();
              if (typeof cb2 === 'function') cb2.call(this, err, files);
            }
          };
        }
      }
      if (process.version.substr(0, 4) === 'v0.8') {
        var legStreams = legacy(fs3);
        ReadStream = legStreams.ReadStream;
        WriteStream = legStreams.WriteStream;
      }
      var fs$ReadStream = fs3.ReadStream;
      if (fs$ReadStream) {
        ReadStream.prototype = Object.create(fs$ReadStream.prototype);
        ReadStream.prototype.open = ReadStream$open;
      }
      var fs$WriteStream = fs3.WriteStream;
      if (fs$WriteStream) {
        WriteStream.prototype = Object.create(fs$WriteStream.prototype);
        WriteStream.prototype.open = WriteStream$open;
      }
      Object.defineProperty(fs3, 'ReadStream', {
        get: function () {
          return ReadStream;
        },
        set: function (val) {
          ReadStream = val;
        },
        enumerable: true,
        configurable: true,
      });
      Object.defineProperty(fs3, 'WriteStream', {
        get: function () {
          return WriteStream;
        },
        set: function (val) {
          WriteStream = val;
        },
        enumerable: true,
        configurable: true,
      });
      var FileReadStream = ReadStream;
      Object.defineProperty(fs3, 'FileReadStream', {
        get: function () {
          return FileReadStream;
        },
        set: function (val) {
          FileReadStream = val;
        },
        enumerable: true,
        configurable: true,
      });
      var FileWriteStream = WriteStream;
      Object.defineProperty(fs3, 'FileWriteStream', {
        get: function () {
          return FileWriteStream;
        },
        set: function (val) {
          FileWriteStream = val;
        },
        enumerable: true,
        configurable: true,
      });
      function ReadStream(path, options2) {
        if (this instanceof ReadStream) return fs$ReadStream.apply(this, arguments), this;
        else return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
      }
      function ReadStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function (err, fd) {
          if (err) {
            if (that.autoClose) that.destroy();
            that.emit('error', err);
          } else {
            that.fd = fd;
            that.emit('open', fd);
            that.read();
          }
        });
      }
      function WriteStream(path, options2) {
        if (this instanceof WriteStream) return fs$WriteStream.apply(this, arguments), this;
        else return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
      }
      function WriteStream$open() {
        var that = this;
        open(that.path, that.flags, that.mode, function (err, fd) {
          if (err) {
            that.destroy();
            that.emit('error', err);
          } else {
            that.fd = fd;
            that.emit('open', fd);
          }
        });
      }
      function createReadStream(path, options2) {
        return new fs3.ReadStream(path, options2);
      }
      function createWriteStream(path, options2) {
        return new fs3.WriteStream(path, options2);
      }
      var fs$open = fs3.open;
      fs3.open = open;
      function open(path, flags, mode, cb) {
        if (typeof mode === 'function') (cb = mode), (mode = null);
        return go$open(path, flags, mode, cb);
        function go$open(path2, flags2, mode2, cb2, startTime) {
          return fs$open(path2, flags2, mode2, function (err, fd) {
            if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
              enqueue([go$open, [path2, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
            else {
              if (typeof cb2 === 'function') cb2.apply(this, arguments);
            }
          });
        }
      }
      return fs3;
    }
    function enqueue(elem) {
      debug('ENQUEUE', elem[0].name, elem[1]);
      fs2[gracefulQueue].push(elem);
      retry();
    }
    var retryTimer;
    function resetQueue() {
      var now = Date.now();
      for (var i = 0; i < fs2[gracefulQueue].length; ++i) {
        if (fs2[gracefulQueue][i].length > 2) {
          fs2[gracefulQueue][i][3] = now;
          fs2[gracefulQueue][i][4] = now;
        }
      }
      retry();
    }
    function retry() {
      clearTimeout(retryTimer);
      retryTimer = void 0;
      if (fs2[gracefulQueue].length === 0) return;
      var elem = fs2[gracefulQueue].shift();
      var fn = elem[0];
      var args = elem[1];
      var err = elem[2];
      var startTime = elem[3];
      var lastTime = elem[4];
      if (startTime === void 0) {
        debug('RETRY', fn.name, args);
        fn.apply(null, args);
      } else if (Date.now() - startTime >= 6e4) {
        debug('TIMEOUT', fn.name, args);
        var cb = args.pop();
        if (typeof cb === 'function') cb.call(null, err);
      } else {
        var sinceAttempt = Date.now() - lastTime;
        var sinceStart = Math.max(lastTime - startTime, 1);
        var desiredDelay = Math.min(sinceStart * 1.2, 100);
        if (sinceAttempt >= desiredDelay) {
          debug('RETRY', fn.name, args);
          fn.apply(null, args.concat([startTime]));
        } else {
          fs2[gracefulQueue].push(elem);
        }
      }
      if (retryTimer === void 0) {
        retryTimer = setTimeout(retry, 0);
      }
    }
  },
});

// node_modules/@pnpm/network.ca-file/dist/ca-file.js
var require_ca_file = __commonJS({
  'node_modules/@pnpm/network.ca-file/dist/ca-file.js'(exports2) {
    'use strict';
    var __importDefault =
      (exports2 && exports2.__importDefault) ||
      function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
      };
    Object.defineProperty(exports2, '__esModule', { value: true });
    exports2.readCAFileSync = void 0;
    var graceful_fs_1 = __importDefault(require_graceful_fs());
    function readCAFileSync(filePath) {
      try {
        const contents = graceful_fs_1.default.readFileSync(filePath, 'utf8');
        const delim = '-----END CERTIFICATE-----';
        const output = contents
          .split(delim)
          .filter((ca) => Boolean(ca.trim()))
          .map((ca) => `${ca.trimLeft()}${delim}`);
        return output;
      } catch (err) {
        if (err.code === 'ENOENT') return void 0;
        throw err;
      }
    }
    exports2.readCAFileSync = readCAFileSync;
  },
});

// node_modules/@pnpm/network.ca-file/dist/index.js
var require_dist = __commonJS({
  'node_modules/@pnpm/network.ca-file/dist/index.js'(exports2) {
    'use strict';
    var __createBinding =
      (exports2 && exports2.__createBinding) ||
      (Object.create
        ? function (o, m, k, k2) {
            if (k2 === void 0) k2 = k;
            var desc = Object.getOwnPropertyDescriptor(m, k);
            if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
              desc = {
                enumerable: true,
                get: function () {
                  return m[k];
                },
              };
            }
            Object.defineProperty(o, k2, desc);
          }
        : function (o, m, k, k2) {
            if (k2 === void 0) k2 = k;
            o[k2] = m[k];
          });
    var __exportStar =
      (exports2 && exports2.__exportStar) ||
      function (m, exports3) {
        for (var p in m)
          if (p !== 'default' && !Object.prototype.hasOwnProperty.call(exports3, p)) __createBinding(exports3, m, p);
      };
    Object.defineProperty(exports2, '__esModule', { value: true });
    __exportStar(require_ca_file(), exports2);
  },
});

// node_modules/proto-list/proto-list.js
var require_proto_list = __commonJS({
  'node_modules/proto-list/proto-list.js'(exports2, module2) {
    module2.exports = ProtoList;
    function setProto(obj, proto2) {
      if (typeof Object.setPrototypeOf === 'function') return Object.setPrototypeOf(obj, proto2);
      else obj.__proto__ = proto2;
    }
    function ProtoList() {
      this.list = [];
      var root = null;
      Object.defineProperty(this, 'root', {
        get: function () {
          return root;
        },
        set: function (r) {
          root = r;
          if (this.list.length) {
            setProto(this.list[this.list.length - 1], r);
          }
        },
        enumerable: true,
        configurable: true,
      });
    }
    ProtoList.prototype = {
      get length() {
        return this.list.length;
      },
      get keys() {
        var k = [];
        for (var i in this.list[0]) k.push(i);
        return k;
      },
      get snapshot() {
        var o = {};
        this.keys.forEach(function (k) {
          o[k] = this.get(k);
        }, this);
        return o;
      },
      get store() {
        return this.list[0];
      },
      push: function (obj) {
        if (typeof obj !== 'object') obj = { valueOf: obj };
        if (this.list.length >= 1) {
          setProto(this.list[this.list.length - 1], obj);
        }
        setProto(obj, this.root);
        return this.list.push(obj);
      },
      pop: function () {
        if (this.list.length >= 2) {
          setProto(this.list[this.list.length - 2], this.root);
        }
        return this.list.pop();
      },
      unshift: function (obj) {
        setProto(obj, this.list[0] || this.root);
        return this.list.unshift(obj);
      },
      shift: function () {
        if (this.list.length === 1) {
          setProto(this.list[0], this.root);
        }
        return this.list.shift();
      },
      get: function (key) {
        return this.list[0][key];
      },
      set: function (key, val, save) {
        if (!this.length) this.push({});
        if (save && this.list[0].hasOwnProperty(key)) this.push({});
        return (this.list[0][key] = val);
      },
      forEach: function (fn, thisp) {
        for (var key in this.list[0]) fn.call(thisp, key, this.list[0][key]);
      },
      slice: function () {
        return this.list.slice.apply(this.list, arguments);
      },
      splice: function () {
        var ret = this.list.splice.apply(this.list, arguments);
        for (var i = 0, l = this.list.length; i < l; i++) {
          setProto(this.list[i], this.list[i + 1] || this.root);
        }
        return ret;
      },
    };
  },
});

// node_modules/config-chain/index.js
var require_config_chain = __commonJS({
  'node_modules/config-chain/index.js'(exports2, module2) {
    var ProtoList = require_proto_list();
    var path = require('path');
    var fs2 = require('fs');
    var ini = require_ini();
    var EE = require('events').EventEmitter;
    var url = require('url');
    var http = require('http');
    var exports2 = (module2.exports = function () {
      var args = [].slice.call(arguments),
        conf = new ConfigChain();
      while (args.length) {
        var a = args.shift();
        if (a) conf.push('string' === typeof a ? json(a) : a);
      }
      return conf;
    });
    var find = (exports2.find = function () {
      var rel = path.join.apply(null, [].slice.call(arguments));
      function find2(start, rel2) {
        var file = path.join(start, rel2);
        try {
          fs2.statSync(file);
          return file;
        } catch (err) {
          if (path.dirname(start) !== start) return find2(path.dirname(start), rel2);
        }
      }
      return find2(__dirname, rel);
    });
    var parse2 = (exports2.parse = function (content, file, type) {
      content = '' + content;
      if (!type) {
        try {
          return JSON.parse(content);
        } catch (er) {
          return ini.parse(content);
        }
      } else if (type === 'json') {
        if (this.emit) {
          try {
            return JSON.parse(content);
          } catch (er) {
            this.emit('error', er);
          }
        } else {
          return JSON.parse(content);
        }
      } else {
        return ini.parse(content);
      }
    });
    var json = (exports2.json = function () {
      var args = [].slice.call(arguments).filter(function (arg) {
        return arg != null;
      });
      var file = path.join.apply(null, args);
      var content;
      try {
        content = fs2.readFileSync(file, 'utf-8');
      } catch (err) {
        return;
      }
      return parse2(content, file, 'json');
    });
    var env2 = (exports2.env = function (prefix, env3) {
      env3 = env3 || process.env;
      var obj = {};
      var l = prefix.length;
      for (var k in env3) {
        if (k.indexOf(prefix) === 0) obj[k.substring(l)] = env3[k];
      }
      return obj;
    });
    exports2.ConfigChain = ConfigChain;
    function ConfigChain() {
      EE.apply(this);
      ProtoList.apply(this, arguments);
      this._awaiting = 0;
      this._saving = 0;
      this.sources = {};
    }
    var extras = {
      constructor: { value: ConfigChain },
    };
    Object.keys(EE.prototype).forEach(function (k) {
      extras[k] = Object.getOwnPropertyDescriptor(EE.prototype, k);
    });
    ConfigChain.prototype = Object.create(ProtoList.prototype, extras);
    ConfigChain.prototype.del = function (key, where) {
      if (where) {
        var target = this.sources[where];
        target = target && target.data;
        if (!target) {
          return this.emit('error', new Error('not found ' + where));
        }
        delete target[key];
      } else {
        for (var i = 0, l = this.list.length; i < l; i++) {
          delete this.list[i][key];
        }
      }
      return this;
    };
    ConfigChain.prototype.set = function (key, value, where) {
      var target;
      if (where) {
        target = this.sources[where];
        target = target && target.data;
        if (!target) {
          return this.emit('error', new Error('not found ' + where));
        }
      } else {
        target = this.list[0];
        if (!target) {
          return this.emit('error', new Error('cannot set, no confs!'));
        }
      }
      target[key] = value;
      return this;
    };
    ConfigChain.prototype.get = function (key, where) {
      if (where) {
        where = this.sources[where];
        if (where) where = where.data;
        if (where && Object.hasOwnProperty.call(where, key)) return where[key];
        return void 0;
      }
      return this.list[0][key];
    };
    ConfigChain.prototype.save = function (where, type, cb) {
      if (typeof type === 'function') (cb = type), (type = null);
      var target = this.sources[where];
      if (!target || !(target.path || target.source) || !target.data) {
        return this.emit('error', new Error('bad save target: ' + where));
      }
      if (target.source) {
        var pref = target.prefix || '';
        Object.keys(target.data).forEach(function (k) {
          target.source[pref + k] = target.data[k];
        });
        return this;
      }
      var type = type || target.type;
      var data = target.data;
      if (target.type === 'json') {
        data = JSON.stringify(data);
      } else {
        data = ini.stringify(data);
      }
      this._saving++;
      fs2.writeFile(
        target.path,
        data,
        'utf8',
        function (er) {
          this._saving--;
          if (er) {
            if (cb) return cb(er);
            else return this.emit('error', er);
          }
          if (this._saving === 0) {
            if (cb) cb();
            this.emit('save');
          }
        }.bind(this),
      );
      return this;
    };
    ConfigChain.prototype.addFile = function (file, type, name) {
      name = name || file;
      var marker = { __source__: name };
      this.sources[name] = { path: file, type };
      this.push(marker);
      this._await();
      fs2.readFile(
        file,
        'utf8',
        function (er, data) {
          if (er) this.emit('error', er);
          this.addString(data, file, type, marker);
        }.bind(this),
      );
      return this;
    };
    ConfigChain.prototype.addEnv = function (prefix, env3, name) {
      name = name || 'env';
      var data = exports2.env(prefix, env3);
      this.sources[name] = { data, source: env3, prefix };
      return this.add(data, name);
    };
    ConfigChain.prototype.addUrl = function (req, type, name) {
      this._await();
      var href = url.format(req);
      name = name || href;
      var marker = { __source__: name };
      this.sources[name] = { href, type };
      this.push(marker);
      http
        .request(
          req,
          function (res) {
            var c = [];
            var ct = res.headers['content-type'];
            if (!type) {
              type =
                ct.indexOf('json') !== -1
                  ? 'json'
                  : ct.indexOf('ini') !== -1
                    ? 'ini'
                    : href.match(/\.json$/)
                      ? 'json'
                      : href.match(/\.ini$/)
                        ? 'ini'
                        : null;
              marker.type = type;
            }
            res
              .on('data', c.push.bind(c))
              .on(
                'end',
                function () {
                  this.addString(Buffer.concat(c), href, type, marker);
                }.bind(this),
              )
              .on('error', this.emit.bind(this, 'error'));
          }.bind(this),
        )
        .on('error', this.emit.bind(this, 'error'))
        .end();
      return this;
    };
    ConfigChain.prototype.addString = function (data, file, type, marker) {
      data = this.parse(data, file, type);
      this.add(data, marker);
      return this;
    };
    ConfigChain.prototype.add = function (data, marker) {
      if (marker && typeof marker === 'object') {
        var i = this.list.indexOf(marker);
        if (i === -1) {
          return this.emit('error', new Error('bad marker'));
        }
        this.splice(i, 1, data);
        marker = marker.__source__;
        this.sources[marker] = this.sources[marker] || {};
        this.sources[marker].data = data;
        this._resolve();
      } else {
        if (typeof marker === 'string') {
          this.sources[marker] = this.sources[marker] || {};
          this.sources[marker].data = data;
        }
        this._await();
        this.push(data);
        process.nextTick(this._resolve.bind(this));
      }
      return this;
    };
    ConfigChain.prototype.parse = exports2.parse;
    ConfigChain.prototype._await = function () {
      this._awaiting++;
    };
    ConfigChain.prototype._resolve = function () {
      this._awaiting--;
      if (this._awaiting === 0) this.emit('load', this);
    };
  },
});

// node_modules/@pnpm/npm-conf/lib/envKeyToSetting.js
var require_envKeyToSetting = __commonJS({
  'node_modules/@pnpm/npm-conf/lib/envKeyToSetting.js'(exports2, module2) {
    module2.exports = function (x) {
      const colonIndex = x.indexOf(':');
      if (colonIndex === -1) {
        return normalize(x);
      }
      const firstPart = x.substr(0, colonIndex);
      const secondPart = x.substr(colonIndex + 1);
      return `${normalize(firstPart)}:${normalize(secondPart)}`;
    };
    function normalize(s) {
      s = s.toLowerCase();
      if (s === '_authtoken') return '_authToken';
      let r = s[0];
      for (let i = 1; i < s.length; i++) {
        r += s[i] === '_' ? '-' : s[i];
      }
      return r;
    }
  },
});

// node_modules/@pnpm/config.env-replace/dist/env-replace.js
var require_env_replace = __commonJS({
  'node_modules/@pnpm/config.env-replace/dist/env-replace.js'(exports2) {
    'use strict';
    Object.defineProperty(exports2, '__esModule', { value: true });
    exports2.envReplace = void 0;
    var ENV_EXPR = /(?<!\\)(\\*)\$\{([^${}]+)\}/g;
    function envReplace(settingValue, env2) {
      return settingValue.replace(ENV_EXPR, replaceEnvMatch.bind(null, env2));
    }
    exports2.envReplace = envReplace;
    function replaceEnvMatch(env2, orig, escape, name) {
      if (escape.length % 2) {
        return orig.slice((escape.length + 1) / 2);
      }
      const envValue = getEnvValue(env2, name);
      if (envValue === void 0) {
        throw new Error(`Failed to replace env in config: ${orig}`);
      }
      return `${escape.slice(escape.length / 2)}${envValue}`;
    }
    var ENV_VALUE = /([^:-]+)(:?)-(.+)/;
    function getEnvValue(env2, name) {
      const matched = name.match(ENV_VALUE);
      if (!matched) return env2[name];
      const [, variableName, colon, fallback2] = matched;
      if (Object.prototype.hasOwnProperty.call(env2, variableName)) {
        return !env2[variableName] && colon ? fallback2 : env2[variableName];
      }
      return fallback2;
    }
  },
});

// node_modules/@pnpm/config.env-replace/dist/index.js
var require_dist2 = __commonJS({
  'node_modules/@pnpm/config.env-replace/dist/index.js'(exports2) {
    'use strict';
    Object.defineProperty(exports2, '__esModule', { value: true });
    exports2.envReplace = void 0;
    var env_replace_1 = require_env_replace();
    Object.defineProperty(exports2, 'envReplace', {
      enumerable: true,
      get: function () {
        return env_replace_1.envReplace;
      },
    });
  },
});

// node_modules/@pnpm/npm-conf/lib/util.js
var require_util = __commonJS({
  'node_modules/@pnpm/npm-conf/lib/util.js'(exports2) {
    'use strict';
    var fs2 = require('fs');
    var path = require('path');
    var { envReplace } = require_dist2();
    var parseKey = (key) => {
      if (typeof key !== 'string') {
        return key;
      }
      return envReplace(key, process.env);
    };
    var parseField = (types, field, key) => {
      if (typeof field !== 'string') {
        return field;
      }
      const typeList = [].concat(types[key]);
      const isPath = typeList.indexOf(path) !== -1;
      const isBool = typeList.indexOf(Boolean) !== -1;
      const isString = typeList.indexOf(String) !== -1;
      const isNumber = typeList.indexOf(Number) !== -1;
      field = `${field}`.trim();
      if (/^".*"$/.test(field)) {
        try {
          field = JSON.parse(field);
        } catch (error) {
          throw new Error(`Failed parsing JSON config key ${key}: ${field}`);
        }
      }
      if (isBool && !isString && field === '') {
        return true;
      }
      switch (field) {
        // eslint-disable-line default-case
        case 'true': {
          return true;
        }
        case 'false': {
          return false;
        }
        case 'null': {
          return null;
        }
        case 'undefined': {
          return void 0;
        }
      }
      field = envReplace(field, process.env);
      if (isPath) {
        const regex2 = process.platform === 'win32' ? /^~(\/|\\)/ : /^~\//;
        if (regex2.test(field) && process.env.HOME) {
          field = path.resolve(process.env.HOME, field.substr(2));
        }
        field = path.resolve(field);
      }
      if (isNumber && !isNaN(field)) {
        field = Number(field);
      }
      return field;
    };
    var findPrefix = (name) => {
      name = path.resolve(name);
      let walkedUp = false;
      while (path.basename(name) === 'node_modules') {
        name = path.dirname(name);
        walkedUp = true;
      }
      if (walkedUp) {
        return name;
      }
      const find = (name2, original) => {
        const regex2 = /^[a-zA-Z]:(\\|\/)?$/;
        if (name2 === '/' || (process.platform === 'win32' && regex2.test(name2))) {
          return original;
        }
        try {
          const files = fs2.readdirSync(name2);
          if (
            files.includes('node_modules') ||
            files.includes('package.json') ||
            files.includes('package.json5') ||
            files.includes('package.yaml') ||
            files.includes('pnpm-workspace.yaml')
          ) {
            return name2;
          }
          const dirname = path.dirname(name2);
          if (dirname === name2) {
            return original;
          }
          return find(dirname, original);
        } catch (error) {
          if (name2 === original) {
            if (error.code === 'ENOENT') {
              return original;
            }
            throw error;
          }
          return original;
        }
      };
      return find(name, name);
    };
    exports2.envReplace = envReplace;
    exports2.findPrefix = findPrefix;
    exports2.parseField = parseField;
    exports2.parseKey = parseKey;
  },
});

// node_modules/@pnpm/npm-conf/lib/types.js
var require_types = __commonJS({
  'node_modules/@pnpm/npm-conf/lib/types.js'(exports2) {
    'use strict';
    var path = require('path');
    var Stream = require('stream').Stream;
    var url = require('url');
    var Umask = () => {};
    var getLocalAddresses = () => [];
    var semver3 = () => {};
    exports2.types = {
      access: [null, 'restricted', 'public'],
      'allow-same-version': Boolean,
      'always-auth': Boolean,
      also: [null, 'dev', 'development'],
      audit: Boolean,
      'auth-type': ['legacy', 'sso', 'saml', 'oauth'],
      'bin-links': Boolean,
      browser: [null, String],
      ca: [null, String, Array],
      cafile: path,
      cache: path,
      'cache-lock-stale': Number,
      'cache-lock-retries': Number,
      'cache-lock-wait': Number,
      'cache-max': Number,
      'cache-min': Number,
      cert: [null, String],
      cidr: [null, String, Array],
      color: ['always', Boolean],
      depth: Number,
      description: Boolean,
      dev: Boolean,
      'dry-run': Boolean,
      editor: String,
      'engine-strict': Boolean,
      force: Boolean,
      'fetch-retries': Number,
      'fetch-retry-factor': Number,
      'fetch-retry-mintimeout': Number,
      'fetch-retry-maxtimeout': Number,
      git: String,
      'git-tag-version': Boolean,
      'commit-hooks': Boolean,
      global: Boolean,
      globalconfig: path,
      'global-style': Boolean,
      group: [Number, String],
      'https-proxy': [null, url],
      'user-agent': String,
      'ham-it-up': Boolean,
      heading: String,
      'if-present': Boolean,
      'ignore-prepublish': Boolean,
      'ignore-scripts': Boolean,
      'init-module': path,
      'init-author-name': String,
      'init-author-email': String,
      'init-author-url': ['', url],
      'init-license': String,
      'init-version': semver3,
      json: Boolean,
      key: [null, String],
      'legacy-bundling': Boolean,
      link: Boolean,
      // local-address must be listed as an IP for a local network interface
      // must be IPv4 due to node bug
      'local-address': getLocalAddresses(),
      loglevel: ['silent', 'error', 'warn', 'notice', 'http', 'timing', 'info', 'verbose', 'silly'],
      logstream: Stream,
      'logs-max': Number,
      long: Boolean,
      maxsockets: Number,
      message: String,
      'metrics-registry': [null, String],
      'node-options': [null, String],
      'node-version': [null, semver3],
      'no-proxy': [null, String, Array],
      offline: Boolean,
      'onload-script': [null, String],
      only: [null, 'dev', 'development', 'prod', 'production'],
      optional: Boolean,
      'package-lock': Boolean,
      otp: [null, String],
      'package-lock-only': Boolean,
      parseable: Boolean,
      'prefer-offline': Boolean,
      'prefer-online': Boolean,
      prefix: path,
      production: Boolean,
      progress: Boolean,
      proxy: [null, false, url],
      provenance: Boolean,
      // allow proxy to be disabled explicitly
      'read-only': Boolean,
      'rebuild-bundle': Boolean,
      registry: [null, url],
      rollback: Boolean,
      save: Boolean,
      'save-bundle': Boolean,
      'save-dev': Boolean,
      'save-exact': Boolean,
      'save-optional': Boolean,
      'save-prefix': String,
      'save-prod': Boolean,
      scope: String,
      'script-shell': [null, String],
      'scripts-prepend-node-path': [false, true, 'auto', 'warn-only'],
      searchopts: String,
      searchexclude: [null, String],
      searchlimit: Number,
      searchstaleness: Number,
      'send-metrics': Boolean,
      shell: String,
      shrinkwrap: Boolean,
      'sign-git-tag': Boolean,
      'sso-poll-frequency': Number,
      'sso-type': [null, 'oauth', 'saml'],
      'strict-ssl': Boolean,
      tag: String,
      timing: Boolean,
      tmp: path,
      unicode: Boolean,
      'unsafe-perm': Boolean,
      usage: Boolean,
      user: [Number, String],
      userconfig: path,
      umask: Umask,
      version: Boolean,
      'tag-version-prefix': String,
      versions: Boolean,
      viewer: String,
      _exit: Boolean,
    };
  },
});

// node_modules/@pnpm/npm-conf/lib/conf.js
var require_conf = __commonJS({
  'node_modules/@pnpm/npm-conf/lib/conf.js'(exports2, module2) {
    'use strict';
    var { readCAFileSync } = require_dist();
    var fs2 = require('fs');
    var path = require('path');
    var { ConfigChain } = require_config_chain();
    var envKeyToSetting = require_envKeyToSetting();
    var util = require_util();
    var Conf = class extends ConfigChain {
      // https://github.com/npm/cli/blob/latest/lib/config/core.js#L203-L217
      constructor(base, types) {
        super(base);
        this.root = base;
        this._parseField = util.parseField.bind(null, types || require_types());
      }
      // https://github.com/npm/cli/blob/latest/lib/config/core.js#L326-L338
      add(data, marker) {
        try {
          for (const [key, value] of Object.entries(data)) {
            const substKey = util.parseKey(key);
            if (substKey !== key) {
              delete data[key];
            }
            data[substKey] = this._parseField(value, substKey);
          }
        } catch (error) {
          throw error;
        }
        return super.add(data, marker);
      }
      // https://github.com/npm/cli/blob/latest/lib/config/core.js#L306-L319
      addFile(file, name) {
        name = name || file;
        const marker = { __source__: name };
        this.sources[name] = { path: file, type: 'ini' };
        this.push(marker);
        this._await();
        try {
          const contents = fs2.readFileSync(file, 'utf8');
          this.addString(contents, file, 'ini', marker);
        } catch (error) {
          if (error.code === 'ENOENT') {
            this.add({}, marker);
          } else if (error.code !== 'EISDIR') {
            return `Issue while reading "${file}". ${error.message}`;
          }
        }
      }
      // https://github.com/npm/cli/blob/latest/lib/config/core.js#L341-L357
      addEnv(env2) {
        env2 = env2 || process.env;
        const conf = {};
        Object.keys(env2)
          .filter((x) => /^npm_config_/i.test(x))
          .forEach((x) => {
            if (!env2[x]) {
              return;
            }
            const key = envKeyToSetting(x.substr(11));
            const rawVal = env2[x];
            conf[key] = deserializeEnvVal(key, rawVal);
          });
        return super.addEnv('', conf, 'env');
      }
      // https://github.com/npm/cli/blob/latest/lib/config/load-prefix.js
      loadPrefix() {
        const cli = this.list[0];
        Object.defineProperty(this, 'prefix', {
          enumerable: true,
          set: (prefix) => {
            const g = this.get('global');
            this[g ? 'globalPrefix' : 'localPrefix'] = prefix;
          },
          get: () => {
            const g = this.get('global');
            return g ? this.globalPrefix : this.localPrefix;
          },
        });
        Object.defineProperty(this, 'globalPrefix', {
          enumerable: true,
          set: (prefix) => {
            this.set('prefix', prefix);
          },
          get: () => {
            return path.resolve(this.get('prefix'));
          },
        });
        let p;
        Object.defineProperty(this, 'localPrefix', {
          enumerable: true,
          set: (prefix) => {
            p = prefix;
          },
          get: () => {
            return p;
          },
        });
        if (Object.prototype.hasOwnProperty.call(cli, 'prefix')) {
          p = path.resolve(cli.prefix);
        } else {
          try {
            const prefix = util.findPrefix(process.cwd());
            p = prefix;
          } catch (error) {
            throw error;
          }
        }
        return p;
      }
      // https://github.com/npm/cli/blob/latest/lib/config/load-cafile.js
      loadCAFile(file) {
        if (!file) {
          return;
        }
        const ca = readCAFileSync(file);
        if (ca) {
          this.set('ca', ca);
        }
      }
      // https://github.com/npm/cli/blob/latest/lib/config/set-user.js
      loadUser() {
        const defConf = this.root;
        if (this.get('global')) {
          return;
        }
        if (process.env.SUDO_UID) {
          defConf.user = Number(process.env.SUDO_UID);
          return;
        }
        const prefix = path.resolve(this.get('prefix'));
        try {
          const stats = fs2.statSync(prefix);
          defConf.user = stats.uid;
        } catch (error) {
          if (error.code === 'ENOENT') {
            return;
          }
          throw error;
        }
      }
    };
    function deserializeEnvVal(envKey, envValue) {
      function deserializeList(envValue2) {
        const npmConfigSep = '\n\n';
        if (envValue2.indexOf(npmConfigSep)) {
          return envValue2.split(npmConfigSep);
        }
        return envValue2.split(',');
      }
      switch (envKey) {
        case 'hoist-pattern':
        case 'public-hoist-pattern':
          return deserializeList(envValue);
      }
      return envValue;
    }
    module2.exports = Conf;
  },
});

// node_modules/@pnpm/npm-conf/lib/defaults.js
var require_defaults = __commonJS({
  'node_modules/@pnpm/npm-conf/lib/defaults.js'(exports2) {
    'use strict';
    var os2 = require('os');
    var path = require('path');
    var temp = os2.tmpdir();
    var uidOrPid = process.getuid ? process.getuid() : process.pid;
    var hasUnicode = () => true;
    var isWindows = process.platform === 'win32';
    var osenv = {
      editor: () => process.env.EDITOR || process.env.VISUAL || (isWindows ? 'notepad.exe' : 'vi'),
      shell: () => (isWindows ? process.env.COMSPEC || 'cmd.exe' : process.env.SHELL || '/bin/bash'),
    };
    var umask = {
      fromString: () => process.umask(),
    };
    var home = os2.homedir();
    if (home) {
      process.env.HOME = home;
    } else {
      home = path.resolve(temp, 'npm-' + uidOrPid);
    }
    var cacheExtra = process.platform === 'win32' ? 'npm-cache' : '.npm';
    var cacheRoot = (process.platform === 'win32' && process.env.APPDATA) || home;
    var cache = path.resolve(cacheRoot, cacheExtra);
    var defaults;
    var globalPrefix;
    Object.defineProperty(exports2, 'defaults', {
      get: function () {
        if (defaults) return defaults;
        if (process.env.PREFIX) {
          globalPrefix = process.env.PREFIX;
        } else if (process.platform === 'win32') {
          globalPrefix = path.dirname(process.execPath);
        } else {
          globalPrefix = path.dirname(path.dirname(process.execPath));
          if (process.env.DESTDIR) {
            globalPrefix = path.join(process.env.DESTDIR, globalPrefix);
          }
        }
        defaults = {
          access: null,
          'allow-same-version': false,
          'always-auth': false,
          also: null,
          audit: true,
          'auth-type': 'legacy',
          'bin-links': true,
          browser: null,
          ca: null,
          cafile: null,
          cache,
          'cache-lock-stale': 6e4,
          'cache-lock-retries': 10,
          'cache-lock-wait': 1e4,
          'cache-max': Infinity,
          'cache-min': 10,
          cert: null,
          cidr: null,
          color: process.env.NO_COLOR == null,
          depth: Infinity,
          description: true,
          dev: false,
          'dry-run': false,
          editor: osenv.editor(),
          'engine-strict': false,
          force: false,
          'fetch-retries': 2,
          'fetch-retry-factor': 10,
          'fetch-retry-mintimeout': 1e4,
          'fetch-retry-maxtimeout': 6e4,
          git: 'git',
          'git-tag-version': true,
          'commit-hooks': true,
          global: false,
          globalconfig: path.resolve(globalPrefix, 'etc', 'npmrc'),
          'global-style': false,
          group: process.platform === 'win32' ? 0 : process.env.SUDO_GID || (process.getgid && process.getgid()),
          'ham-it-up': false,
          heading: 'npm',
          'if-present': false,
          'ignore-prepublish': false,
          'ignore-scripts': false,
          'init-module': path.resolve(home, '.npm-init.js'),
          'init-author-name': '',
          'init-author-email': '',
          'init-author-url': '',
          'init-version': '1.0.0',
          'init-license': 'ISC',
          json: false,
          key: null,
          'legacy-bundling': false,
          link: false,
          'local-address': void 0,
          loglevel: 'notice',
          logstream: process.stderr,
          'logs-max': 10,
          long: false,
          maxsockets: 50,
          message: '%s',
          'metrics-registry': null,
          'node-options': null,
          // We remove node-version to fix the issue described here: https://github.com/pnpm/pnpm/issues/4203#issuecomment-1133872769
          offline: false,
          'onload-script': false,
          only: null,
          optional: true,
          otp: null,
          'package-lock': true,
          'package-lock-only': false,
          parseable: false,
          'prefer-offline': false,
          'prefer-online': false,
          prefix: globalPrefix,
          production: process.env.NODE_ENV === 'production',
          progress: !process.env.TRAVIS && !process.env.CI,
          provenance: false,
          proxy: null,
          'https-proxy': null,
          'no-proxy': null,
          'user-agent': 'npm/{npm-version} node/{node-version} {platform} {arch}',
          'read-only': false,
          'rebuild-bundle': true,
          registry: 'https://registry.npmjs.org/',
          rollback: true,
          save: true,
          'save-bundle': false,
          'save-dev': false,
          'save-exact': false,
          'save-optional': false,
          'save-prefix': '^',
          'save-prod': false,
          scope: '',
          'script-shell': null,
          'scripts-prepend-node-path': 'warn-only',
          searchopts: '',
          searchexclude: null,
          searchlimit: 20,
          searchstaleness: 15 * 60,
          'send-metrics': false,
          shell: osenv.shell(),
          shrinkwrap: true,
          'sign-git-tag': false,
          'sso-poll-frequency': 500,
          'sso-type': 'oauth',
          'strict-ssl': true,
          tag: 'latest',
          'tag-version-prefix': 'v',
          timing: false,
          tmp: temp,
          unicode: hasUnicode(),
          'unsafe-perm':
            process.platform === 'win32' ||
            process.platform === 'cygwin' ||
            !(process.getuid && process.setuid && process.getgid && process.setgid) ||
            process.getuid() !== 0,
          usage: false,
          user: process.platform === 'win32' ? 0 : 'nobody',
          userconfig: path.resolve(home, '.npmrc'),
          umask: process.umask ? process.umask() : umask.fromString('022'),
          version: false,
          versions: false,
          viewer: process.platform === 'win32' ? 'browser' : 'man',
          _exit: true,
        };
        return defaults;
      },
    });
  },
});

// node_modules/@pnpm/npm-conf/index.js
var require_npm_conf = __commonJS({
  'node_modules/@pnpm/npm-conf/index.js'(exports2, module2) {
    'use strict';
    var path = require('path');
    var Conf = require_conf();
    var _defaults = require_defaults();
    module2.exports = (opts, types, defaults) => {
      const conf = new Conf(Object.assign({}, _defaults.defaults, defaults), types);
      conf.add(Object.assign({}, opts), 'cli');
      const warnings = [];
      let failedToLoadBuiltInConfig = false;
      if (require.resolve.paths) {
        const paths = require.resolve.paths('npm');
        let npmPath;
        try {
          npmPath = require.resolve('npm', { paths: paths.slice(-1) });
        } catch (error) {
          failedToLoadBuiltInConfig = true;
        }
        if (npmPath) {
          warnings.push(conf.addFile(path.resolve(path.dirname(npmPath), '..', 'npmrc'), 'builtin'));
        }
      }
      conf.addEnv();
      conf.loadPrefix();
      const projectConf = path.resolve(conf.localPrefix, '.npmrc');
      const userConf = conf.get('userconfig');
      if (!conf.get('global') && projectConf !== userConf) {
        warnings.push(conf.addFile(projectConf, 'project'));
      } else {
        conf.add({}, 'project');
      }
      if (conf.get('workspace-prefix') && conf.get('workspace-prefix') !== projectConf) {
        const workspaceConf = path.resolve(conf.get('workspace-prefix'), '.npmrc');
        warnings.push(conf.addFile(workspaceConf, 'workspace'));
      }
      warnings.push(conf.addFile(conf.get('userconfig'), 'user'));
      if (conf.get('prefix')) {
        const etc = path.resolve(conf.get('prefix'), 'etc');
        conf.root.globalconfig = path.resolve(etc, 'npmrc');
        conf.root.globalignorefile = path.resolve(etc, 'npmignore');
      }
      warnings.push(conf.addFile(conf.get('globalconfig'), 'global'));
      conf.loadUser();
      const caFile = conf.get('cafile');
      if (caFile) {
        conf.loadCAFile(caFile);
      }
      return {
        config: conf,
        warnings: warnings.filter(Boolean),
        failedToLoadBuiltInConfig,
      };
    };
    Object.defineProperty(module2.exports, 'defaults', {
      get() {
        return _defaults.defaults;
      },
      enumerable: true,
    });
  },
});

// node_modules/registry-auth-token/index.js
var require_registry_auth_token = __commonJS({
  'node_modules/registry-auth-token/index.js'(exports2, module2) {
    var npmConf = require_npm_conf();
    var tokenKey = ':_authToken';
    var legacyTokenKey = ':_auth';
    var userKey = ':username';
    var passwordKey = ':_password';
    module2.exports = function getRegistryAuthToken() {
      let checkUrl;
      let options2;
      if (arguments.length >= 2) {
        checkUrl = arguments[0];
        options2 = Object.assign({}, arguments[1]);
      } else if (typeof arguments[0] === 'string') {
        checkUrl = arguments[0];
      } else {
        options2 = Object.assign({}, arguments[0]);
      }
      options2 = options2 || {};
      const providedNpmrc = options2.npmrc;
      options2.npmrc = (
        options2.npmrc
          ? {
              config: {
                get: (key) => providedNpmrc[key],
              },
            }
          : npmConf()
      ).config;
      checkUrl = checkUrl || options2.npmrc.get('registry') || npmConf.defaults.registry;
      return getRegistryAuthInfo(checkUrl, options2) || getLegacyAuthInfo(options2.npmrc);
    };
    function urlResolve(from, to) {
      const resolvedUrl = new URL(to, new URL(from.startsWith('//') ? `./${from}` : from, 'resolve://'));
      if (resolvedUrl.protocol === 'resolve:') {
        const { pathname, search, hash } = resolvedUrl;
        return pathname + search + hash;
      }
      return resolvedUrl.toString();
    }
    function getRegistryAuthInfo(checkUrl, options2) {
      let parsed =
        checkUrl instanceof URL ? checkUrl : new URL(checkUrl.startsWith('//') ? `http:${checkUrl}` : checkUrl);
      let pathname;
      while (pathname !== '/' && parsed.pathname !== pathname) {
        pathname = parsed.pathname || '/';
        const regUrl = '//' + parsed.host + pathname.replace(/\/$/, '');
        const authInfo = getAuthInfoForUrl(regUrl, options2.npmrc);
        if (authInfo) {
          return authInfo;
        }
        if (!options2.recursive) {
          return /\/$/.test(checkUrl) ? void 0 : getRegistryAuthInfo(new URL('./', parsed), options2);
        }
        parsed.pathname = urlResolve(normalizePath(pathname), '..') || '/';
      }
      return void 0;
    }
    function getLegacyAuthInfo(npmrc) {
      if (!npmrc.get('_auth')) {
        return void 0;
      }
      const token = replaceEnvironmentVariable(npmrc.get('_auth'));
      return { token, type: 'Basic' };
    }
    function normalizePath(path) {
      return path[path.length - 1] === '/' ? path : path + '/';
    }
    function getAuthInfoForUrl(regUrl, npmrc) {
      const bearerAuth = getBearerToken(npmrc.get(regUrl + tokenKey) || npmrc.get(regUrl + '/' + tokenKey));
      if (bearerAuth) {
        return bearerAuth;
      }
      const username = npmrc.get(regUrl + userKey) || npmrc.get(regUrl + '/' + userKey);
      const password = npmrc.get(regUrl + passwordKey) || npmrc.get(regUrl + '/' + passwordKey);
      const basicAuth = getTokenForUsernameAndPassword(username, password);
      if (basicAuth) {
        return basicAuth;
      }
      const basicAuthWithToken = getLegacyAuthToken(
        npmrc.get(regUrl + legacyTokenKey) || npmrc.get(regUrl + '/' + legacyTokenKey),
      );
      if (basicAuthWithToken) {
        return basicAuthWithToken;
      }
      return void 0;
    }
    function replaceEnvironmentVariable(token) {
      return token.replace(/^\$\{?([^}]*)\}?$/, function (fullMatch, envVar) {
        return process.env[envVar];
      });
    }
    function getBearerToken(tok) {
      if (!tok) {
        return void 0;
      }
      const token = replaceEnvironmentVariable(tok);
      return { token, type: 'Bearer' };
    }
    function getTokenForUsernameAndPassword(username, password) {
      if (!username || !password) {
        return void 0;
      }
      const pass = Buffer.from(replaceEnvironmentVariable(password), 'base64').toString('utf8');
      const token = Buffer.from(username + ':' + pass, 'utf8').toString('base64');
      return {
        token,
        type: 'Basic',
        password: pass,
        username,
      };
    }
    function getLegacyAuthToken(tok) {
      if (!tok) {
        return void 0;
      }
      const token = replaceEnvironmentVariable(tok);
      return { token, type: 'Basic' };
    }
  },
});

// node_modules/fast-content-type-parse/index.js
var require_fast_content_type_parse = __commonJS({
  'node_modules/fast-content-type-parse/index.js'(exports2, module2) {
    'use strict';
    var NullObject = function NullObject2() {};
    NullObject.prototype = /* @__PURE__ */ Object.create(null);
    var paramRE =
      /; *([!#$%&'*+.^\w`|~-]+)=("(?:[\v\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\v\u0020-\u00ff])*"|[!#$%&'*+.^\w`|~-]+) */gu;
    var quotedPairRE = /\\([\v\u0020-\u00ff])/gu;
    var mediaTypeRE = /^[!#$%&'*+.^\w|~-]+\/[!#$%&'*+.^\w|~-]+$/u;
    var defaultContentType = { type: '', parameters: new NullObject() };
    Object.freeze(defaultContentType.parameters);
    Object.freeze(defaultContentType);
    function parse2(header) {
      if (typeof header !== 'string') {
        throw new TypeError('argument header is required and must be a string');
      }
      let index = header.indexOf(';');
      const type = index !== -1 ? header.slice(0, index).trim() : header.trim();
      if (mediaTypeRE.test(type) === false) {
        throw new TypeError('invalid media type');
      }
      const result = {
        type: type.toLowerCase(),
        parameters: new NullObject(),
      };
      if (index === -1) {
        return result;
      }
      let key;
      let match;
      let value;
      paramRE.lastIndex = index;
      while ((match = paramRE.exec(header))) {
        if (match.index !== index) {
          throw new TypeError('invalid parameter format');
        }
        index += match[0].length;
        key = match[1].toLowerCase();
        value = match[2];
        if (value[0] === '"') {
          value = value.slice(1, value.length - 1);
          quotedPairRE.test(value) && (value = value.replace(quotedPairRE, '$1'));
        }
        result.parameters[key] = value;
      }
      if (index !== header.length) {
        throw new TypeError('invalid parameter format');
      }
      return result;
    }
    function safeParse2(header) {
      if (typeof header !== 'string') {
        return defaultContentType;
      }
      let index = header.indexOf(';');
      const type = index !== -1 ? header.slice(0, index).trim() : header.trim();
      if (mediaTypeRE.test(type) === false) {
        return defaultContentType;
      }
      const result = {
        type: type.toLowerCase(),
        parameters: new NullObject(),
      };
      if (index === -1) {
        return result;
      }
      let key;
      let match;
      let value;
      paramRE.lastIndex = index;
      while ((match = paramRE.exec(header))) {
        if (match.index !== index) {
          return defaultContentType;
        }
        index += match[0].length;
        key = match[1].toLowerCase();
        value = match[2];
        if (value[0] === '"') {
          value = value.slice(1, value.length - 1);
          quotedPairRE.test(value) && (value = value.replace(quotedPairRE, '$1'));
        }
        result.parameters[key] = value;
      }
      if (index !== header.length) {
        return defaultContentType;
      }
      return result;
    }
    module2.exports.default = { parse: parse2, safeParse: safeParse2 };
    module2.exports.parse = parse2;
    module2.exports.safeParse = safeParse2;
    module2.exports.defaultContentType = defaultContentType;
  },
});

// node_modules/commander/lib/error.js
var require_error = __commonJS({
  'node_modules/commander/lib/error.js'(exports2) {
    var CommanderError2 = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {number} exitCode suggested exit code which could be used with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
        this.nestedError = void 0;
      }
    };
    var InvalidArgumentError2 = class extends CommanderError2 {
      /**
       * Constructs the InvalidArgumentError class
       * @param {string} [message] explanation of why argument is invalid
       */
      constructor(message) {
        super(1, 'commander.invalidArgument', message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
      }
    };
    exports2.CommanderError = CommanderError2;
    exports2.InvalidArgumentError = InvalidArgumentError2;
  },
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS({
  'node_modules/commander/lib/argument.js'(exports2) {
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Argument2 = class {
      /**
       * Initialize a new command argument with the given name and description.
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @param {string} name
       * @param {string} [description]
       */
      constructor(name, description) {
        this.description = description || '';
        this.variadic = false;
        this.parseArg = void 0;
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.argChoices = void 0;
        switch (name[0]) {
          case '<':
            this.required = true;
            this._name = name.slice(1, -1);
            break;
          case '[':
            this.required = false;
            this._name = name.slice(1, -1);
            break;
          default:
            this.required = true;
            this._name = name;
            break;
        }
        if (this._name.length > 3 && this._name.slice(-3) === '...') {
          this.variadic = true;
          this._name = this._name.slice(0, -3);
        }
      }
      /**
       * Return argument name.
       *
       * @return {string}
       */
      name() {
        return this._name;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Argument}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Set the custom handler for processing CLI command arguments into argument values.
       *
       * @param {Function} [fn]
       * @return {Argument}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Only allow argument value to be one of choices.
       *
       * @param {string[]} values
       * @return {Argument}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(`Allowed choices are ${this.argChoices.join(', ')}.`);
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Make argument required.
       *
       * @returns {Argument}
       */
      argRequired() {
        this.required = true;
        return this;
      }
      /**
       * Make argument optional.
       *
       * @returns {Argument}
       */
      argOptional() {
        this.required = false;
        return this;
      }
    };
    function humanReadableArgName(arg) {
      const nameOutput = arg.name() + (arg.variadic === true ? '...' : '');
      return arg.required ? '<' + nameOutput + '>' : '[' + nameOutput + ']';
    }
    exports2.Argument = Argument2;
    exports2.humanReadableArgName = humanReadableArgName;
  },
});

// node_modules/commander/lib/help.js
var require_help = __commonJS({
  'node_modules/commander/lib/help.js'(exports2) {
    var { humanReadableArgName } = require_argument();
    var Help2 = class {
      constructor() {
        this.helpWidth = void 0;
        this.minWidthToWrap = 40;
        this.sortSubcommands = false;
        this.sortOptions = false;
        this.showGlobalOptions = false;
      }
      /**
       * prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
       * and just before calling `formatHelp()`.
       *
       * Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
       *
       * @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
       */
      prepareContext(contextOptions) {
        this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
      }
      /**
       * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
       *
       * @param {Command} cmd
       * @returns {Command[]}
       */
      visibleCommands(cmd) {
        const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
        const helpCommand = cmd._getHelpCommand();
        if (helpCommand && !helpCommand._hidden) {
          visibleCommands.push(helpCommand);
        }
        if (this.sortSubcommands) {
          visibleCommands.sort((a, b) => {
            return a.name().localeCompare(b.name());
          });
        }
        return visibleCommands;
      }
      /**
       * Compare options for sort.
       *
       * @param {Option} a
       * @param {Option} b
       * @returns {number}
       */
      compareOptions(a, b) {
        const getSortKey = (option) => {
          return option.short ? option.short.replace(/^-/, '') : option.long.replace(/^--/, '');
        };
        return getSortKey(a).localeCompare(getSortKey(b));
      }
      /**
       * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleOptions(cmd) {
        const visibleOptions = cmd.options.filter((option) => !option.hidden);
        const helpOption = cmd._getHelpOption();
        if (helpOption && !helpOption.hidden) {
          const removeShort = helpOption.short && cmd._findOption(helpOption.short);
          const removeLong = helpOption.long && cmd._findOption(helpOption.long);
          if (!removeShort && !removeLong) {
            visibleOptions.push(helpOption);
          } else if (helpOption.long && !removeLong) {
            visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
          } else if (helpOption.short && !removeShort) {
            visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
          }
        }
        if (this.sortOptions) {
          visibleOptions.sort(this.compareOptions);
        }
        return visibleOptions;
      }
      /**
       * Get an array of the visible global options. (Not including help.)
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleGlobalOptions(cmd) {
        if (!this.showGlobalOptions) return [];
        const globalOptions = [];
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
          globalOptions.push(...visibleOptions);
        }
        if (this.sortOptions) {
          globalOptions.sort(this.compareOptions);
        }
        return globalOptions;
      }
      /**
       * Get an array of the arguments if any have a description.
       *
       * @param {Command} cmd
       * @returns {Argument[]}
       */
      visibleArguments(cmd) {
        if (cmd._argsDescription) {
          cmd.registeredArguments.forEach((argument) => {
            argument.description = argument.description || cmd._argsDescription[argument.name()] || '';
          });
        }
        if (cmd.registeredArguments.find((argument) => argument.description)) {
          return cmd.registeredArguments;
        }
        return [];
      }
      /**
       * Get the command term to show in the list of subcommands.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandTerm(cmd) {
        const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(' ');
        return (
          cmd._name +
          (cmd._aliases[0] ? '|' + cmd._aliases[0] : '') +
          (cmd.options.length ? ' [options]' : '') + // simplistic check for non-help option
          (args ? ' ' + args : '')
        );
      }
      /**
       * Get the option term to show in the list of options.
       *
       * @param {Option} option
       * @returns {string}
       */
      optionTerm(option) {
        return option.flags;
      }
      /**
       * Get the argument term to show in the list of arguments.
       *
       * @param {Argument} argument
       * @returns {string}
       */
      argumentTerm(argument) {
        return argument.name();
      }
      /**
       * Get the longest command term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestSubcommandTermLength(cmd, helper) {
        return helper.visibleCommands(cmd).reduce((max, command) => {
          return Math.max(max, this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command))));
        }, 0);
      }
      /**
       * Get the longest option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestOptionTermLength(cmd, helper) {
        return helper.visibleOptions(cmd).reduce((max, option) => {
          return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
        }, 0);
      }
      /**
       * Get the longest global option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestGlobalOptionTermLength(cmd, helper) {
        return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
          return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
        }, 0);
      }
      /**
       * Get the longest argument term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestArgumentTermLength(cmd, helper) {
        return helper.visibleArguments(cmd).reduce((max, argument) => {
          return Math.max(max, this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument))));
        }, 0);
      }
      /**
       * Get the command usage to be displayed at the top of the built-in help.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandUsage(cmd) {
        let cmdName = cmd._name;
        if (cmd._aliases[0]) {
          cmdName = cmdName + '|' + cmd._aliases[0];
        }
        let ancestorCmdNames = '';
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          ancestorCmdNames = ancestorCmd.name() + ' ' + ancestorCmdNames;
        }
        return ancestorCmdNames + cmdName + ' ' + cmd.usage();
      }
      /**
       * Get the description for the command.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandDescription(cmd) {
        return cmd.description();
      }
      /**
       * Get the subcommand summary to show in the list of subcommands.
       * (Fallback to description for backwards compatibility.)
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandDescription(cmd) {
        return cmd.summary() || cmd.description();
      }
      /**
       * Get the option description to show in the list of options.
       *
       * @param {Option} option
       * @return {string}
       */
      optionDescription(option) {
        const extraInfo = [];
        if (option.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`,
          );
        }
        if (option.defaultValue !== void 0) {
          const showDefault =
            option.required || option.optional || (option.isBoolean() && typeof option.defaultValue === 'boolean');
          if (showDefault) {
            extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
          }
        }
        if (option.presetArg !== void 0 && option.optional) {
          extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
        }
        if (option.envVar !== void 0) {
          extraInfo.push(`env: ${option.envVar}`);
        }
        if (extraInfo.length > 0) {
          return `${option.description} (${extraInfo.join(', ')})`;
        }
        return option.description;
      }
      /**
       * Get the argument description to show in the list of arguments.
       *
       * @param {Argument} argument
       * @return {string}
       */
      argumentDescription(argument) {
        const extraInfo = [];
        if (argument.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(', ')}`,
          );
        }
        if (argument.defaultValue !== void 0) {
          extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
        }
        if (extraInfo.length > 0) {
          const extraDescription = `(${extraInfo.join(', ')})`;
          if (argument.description) {
            return `${argument.description} ${extraDescription}`;
          }
          return extraDescription;
        }
        return argument.description;
      }
      /**
       * Generate the built-in help text.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {string}
       */
      formatHelp(cmd, helper) {
        const termWidth = helper.padWidth(cmd, helper);
        const helpWidth = helper.helpWidth ?? 80;
        function callFormatItem(term, description) {
          return helper.formatItem(term, termWidth, description, helper);
        }
        let output = [`${helper.styleTitle('Usage:')} ${helper.styleUsage(helper.commandUsage(cmd))}`, ''];
        const commandDescription = helper.commandDescription(cmd);
        if (commandDescription.length > 0) {
          output = output.concat([helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth), '']);
        }
        const argumentList = helper.visibleArguments(cmd).map((argument) => {
          return callFormatItem(
            helper.styleArgumentTerm(helper.argumentTerm(argument)),
            helper.styleArgumentDescription(helper.argumentDescription(argument)),
          );
        });
        if (argumentList.length > 0) {
          output = output.concat([helper.styleTitle('Arguments:'), ...argumentList, '']);
        }
        const optionList = helper.visibleOptions(cmd).map((option) => {
          return callFormatItem(
            helper.styleOptionTerm(helper.optionTerm(option)),
            helper.styleOptionDescription(helper.optionDescription(option)),
          );
        });
        if (optionList.length > 0) {
          output = output.concat([helper.styleTitle('Options:'), ...optionList, '']);
        }
        if (helper.showGlobalOptions) {
          const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
            return callFormatItem(
              helper.styleOptionTerm(helper.optionTerm(option)),
              helper.styleOptionDescription(helper.optionDescription(option)),
            );
          });
          if (globalOptionList.length > 0) {
            output = output.concat([helper.styleTitle('Global Options:'), ...globalOptionList, '']);
          }
        }
        const commandList = helper.visibleCommands(cmd).map((cmd2) => {
          return callFormatItem(
            helper.styleSubcommandTerm(helper.subcommandTerm(cmd2)),
            helper.styleSubcommandDescription(helper.subcommandDescription(cmd2)),
          );
        });
        if (commandList.length > 0) {
          output = output.concat([helper.styleTitle('Commands:'), ...commandList, '']);
        }
        return output.join('\n');
      }
      /**
       * Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
       *
       * @param {string} str
       * @returns {number}
       */
      displayWidth(str) {
        return stripColor(str).length;
      }
      /**
       * Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
       *
       * @param {string} str
       * @returns {string}
       */
      styleTitle(str) {
        return str;
      }
      styleUsage(str) {
        return str
          .split(' ')
          .map((word) => {
            if (word === '[options]') return this.styleOptionText(word);
            if (word === '[command]') return this.styleSubcommandText(word);
            if (word[0] === '[' || word[0] === '<') return this.styleArgumentText(word);
            return this.styleCommandText(word);
          })
          .join(' ');
      }
      styleCommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleOptionDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleSubcommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleArgumentDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleDescriptionText(str) {
        return str;
      }
      styleOptionTerm(str) {
        return this.styleOptionText(str);
      }
      styleSubcommandTerm(str) {
        return str
          .split(' ')
          .map((word) => {
            if (word === '[options]') return this.styleOptionText(word);
            if (word[0] === '[' || word[0] === '<') return this.styleArgumentText(word);
            return this.styleSubcommandText(word);
          })
          .join(' ');
      }
      styleArgumentTerm(str) {
        return this.styleArgumentText(str);
      }
      styleOptionText(str) {
        return str;
      }
      styleArgumentText(str) {
        return str;
      }
      styleSubcommandText(str) {
        return str;
      }
      styleCommandText(str) {
        return str;
      }
      /**
       * Calculate the pad width from the maximum term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      padWidth(cmd, helper) {
        return Math.max(
          helper.longestOptionTermLength(cmd, helper),
          helper.longestGlobalOptionTermLength(cmd, helper),
          helper.longestSubcommandTermLength(cmd, helper),
          helper.longestArgumentTermLength(cmd, helper),
        );
      }
      /**
       * Detect manually wrapped and indented strings by checking for line break followed by whitespace.
       *
       * @param {string} str
       * @returns {boolean}
       */
      preformatted(str) {
        return /\n[^\S\r\n]/.test(str);
      }
      /**
       * Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
       *
       * So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
       *   TTT  DDD DDDD
       *        DD DDD
       *
       * @param {string} term
       * @param {number} termWidth
       * @param {string} description
       * @param {Help} helper
       * @returns {string}
       */
      formatItem(term, termWidth, description, helper) {
        const itemIndent = 2;
        const itemIndentStr = ' '.repeat(itemIndent);
        if (!description) return itemIndentStr + term;
        const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
        const spacerWidth = 2;
        const helpWidth = this.helpWidth ?? 80;
        const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
        let formattedDescription;
        if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
          formattedDescription = description;
        } else {
          const wrappedDescription = helper.boxWrap(description, remainingWidth);
          formattedDescription = wrappedDescription.replace(/\n/g, '\n' + ' '.repeat(termWidth + spacerWidth));
        }
        return (
          itemIndentStr +
          paddedTerm +
          ' '.repeat(spacerWidth) +
          formattedDescription.replace(
            /\n/g,
            `
${itemIndentStr}`,
          )
        );
      }
      /**
       * Wrap a string at whitespace, preserving existing line breaks.
       * Wrapping is skipped if the width is less than `minWidthToWrap`.
       *
       * @param {string} str
       * @param {number} width
       * @returns {string}
       */
      boxWrap(str, width) {
        if (width < this.minWidthToWrap) return str;
        const rawLines = str.split(/\r\n|\n/);
        const chunkPattern = /[\s]*[^\s]+/g;
        const wrappedLines = [];
        rawLines.forEach((line) => {
          const chunks = line.match(chunkPattern);
          if (chunks === null) {
            wrappedLines.push('');
            return;
          }
          let sumChunks = [chunks.shift()];
          let sumWidth = this.displayWidth(sumChunks[0]);
          chunks.forEach((chunk) => {
            const visibleWidth = this.displayWidth(chunk);
            if (sumWidth + visibleWidth <= width) {
              sumChunks.push(chunk);
              sumWidth += visibleWidth;
              return;
            }
            wrappedLines.push(sumChunks.join(''));
            const nextChunk = chunk.trimStart();
            sumChunks = [nextChunk];
            sumWidth = this.displayWidth(nextChunk);
          });
          wrappedLines.push(sumChunks.join(''));
        });
        return wrappedLines.join('\n');
      }
    };
    function stripColor(str) {
      const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
      return str.replace(sgrPattern, '');
    }
    exports2.Help = Help2;
    exports2.stripColor = stripColor;
  },
});

// node_modules/commander/lib/option.js
var require_option = __commonJS({
  'node_modules/commander/lib/option.js'(exports2) {
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Option2 = class {
      /**
       * Initialize a new `Option` with the given `flags` and `description`.
       *
       * @param {string} flags
       * @param {string} [description]
       */
      constructor(flags, description) {
        this.flags = flags;
        this.description = description || '';
        this.required = flags.includes('<');
        this.optional = flags.includes('[');
        this.variadic = /\w\.\.\.[>\]]$/.test(flags);
        this.mandatory = false;
        const optionFlags = splitOptionFlags(flags);
        this.short = optionFlags.shortFlag;
        this.long = optionFlags.longFlag;
        this.negate = false;
        if (this.long) {
          this.negate = this.long.startsWith('--no-');
        }
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.presetArg = void 0;
        this.envVar = void 0;
        this.parseArg = void 0;
        this.hidden = false;
        this.argChoices = void 0;
        this.conflictsWith = [];
        this.implied = void 0;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Option}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Preset to use when option used without option-argument, especially optional but also boolean and negated.
       * The custom processing (parseArg) is called.
       *
       * @example
       * new Option('--color').default('GREYSCALE').preset('RGB');
       * new Option('--donate [amount]').preset('20').argParser(parseFloat);
       *
       * @param {*} arg
       * @return {Option}
       */
      preset(arg) {
        this.presetArg = arg;
        return this;
      }
      /**
       * Add option name(s) that conflict with this option.
       * An error will be displayed if conflicting options are found during parsing.
       *
       * @example
       * new Option('--rgb').conflicts('cmyk');
       * new Option('--js').conflicts(['ts', 'jsx']);
       *
       * @param {(string | string[])} names
       * @return {Option}
       */
      conflicts(names) {
        this.conflictsWith = this.conflictsWith.concat(names);
        return this;
      }
      /**
       * Specify implied option values for when this option is set and the implied options are not.
       *
       * The custom processing (parseArg) is not called on the implied values.
       *
       * @example
       * program
       *   .addOption(new Option('--log', 'write logging information to file'))
       *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
       *
       * @param {object} impliedOptionValues
       * @return {Option}
       */
      implies(impliedOptionValues) {
        let newImplied = impliedOptionValues;
        if (typeof impliedOptionValues === 'string') {
          newImplied = { [impliedOptionValues]: true };
        }
        this.implied = Object.assign(this.implied || {}, newImplied);
        return this;
      }
      /**
       * Set environment variable to check for option value.
       *
       * An environment variable is only used if when processed the current option value is
       * undefined, or the source of the current value is 'default' or 'config' or 'env'.
       *
       * @param {string} name
       * @return {Option}
       */
      env(name) {
        this.envVar = name;
        return this;
      }
      /**
       * Set the custom handler for processing CLI option arguments into option values.
       *
       * @param {Function} [fn]
       * @return {Option}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Whether the option is mandatory and must have a value after parsing.
       *
       * @param {boolean} [mandatory=true]
       * @return {Option}
       */
      makeOptionMandatory(mandatory = true) {
        this.mandatory = !!mandatory;
        return this;
      }
      /**
       * Hide option in help.
       *
       * @param {boolean} [hide=true]
       * @return {Option}
       */
      hideHelp(hide = true) {
        this.hidden = !!hide;
        return this;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Only allow option value to be one of choices.
       *
       * @param {string[]} values
       * @return {Option}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(`Allowed choices are ${this.argChoices.join(', ')}.`);
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Return option name.
       *
       * @return {string}
       */
      name() {
        if (this.long) {
          return this.long.replace(/^--/, '');
        }
        return this.short.replace(/^-/, '');
      }
      /**
       * Return option name, in a camelcase format that can be used
       * as an object attribute key.
       *
       * @return {string}
       */
      attributeName() {
        if (this.negate) {
          return camelcase(this.name().replace(/^no-/, ''));
        }
        return camelcase(this.name());
      }
      /**
       * Check if `arg` matches the short or long flag.
       *
       * @param {string} arg
       * @return {boolean}
       * @package
       */
      is(arg) {
        return this.short === arg || this.long === arg;
      }
      /**
       * Return whether a boolean option.
       *
       * Options are one of boolean, negated, required argument, or optional argument.
       *
       * @return {boolean}
       * @package
       */
      isBoolean() {
        return !this.required && !this.optional && !this.negate;
      }
    };
    var DualOptions = class {
      /**
       * @param {Option[]} options
       */
      constructor(options2) {
        this.positiveOptions = /* @__PURE__ */ new Map();
        this.negativeOptions = /* @__PURE__ */ new Map();
        this.dualOptions = /* @__PURE__ */ new Set();
        options2.forEach((option) => {
          if (option.negate) {
            this.negativeOptions.set(option.attributeName(), option);
          } else {
            this.positiveOptions.set(option.attributeName(), option);
          }
        });
        this.negativeOptions.forEach((value, key) => {
          if (this.positiveOptions.has(key)) {
            this.dualOptions.add(key);
          }
        });
      }
      /**
       * Did the value come from the option, and not from possible matching dual option?
       *
       * @param {*} value
       * @param {Option} option
       * @returns {boolean}
       */
      valueFromOption(value, option) {
        const optionKey = option.attributeName();
        if (!this.dualOptions.has(optionKey)) return true;
        const preset = this.negativeOptions.get(optionKey).presetArg;
        const negativeValue = preset !== void 0 ? preset : false;
        return option.negate === (negativeValue === value);
      }
    };
    function camelcase(str) {
      return str.split('-').reduce((str2, word) => {
        return str2 + word[0].toUpperCase() + word.slice(1);
      });
    }
    function splitOptionFlags(flags) {
      let shortFlag;
      let longFlag;
      const shortFlagExp = /^-[^-]$/;
      const longFlagExp = /^--[^-]/;
      const flagParts = flags.split(/[ |,]+/).concat('guard');
      if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
      if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
      if (!shortFlag && shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
      if (!shortFlag && longFlagExp.test(flagParts[0])) {
        shortFlag = longFlag;
        longFlag = flagParts.shift();
      }
      if (flagParts[0].startsWith('-')) {
        const unsupportedFlag = flagParts[0];
        const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
        if (/^-[^-][^-]/.test(unsupportedFlag))
          throw new Error(
            `${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`,
          );
        if (shortFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many short flags`);
        if (longFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many long flags`);
        throw new Error(`${baseError}
- unrecognised flag format`);
      }
      if (shortFlag === void 0 && longFlag === void 0)
        throw new Error(`option creation failed due to no flags found in '${flags}'.`);
      return { shortFlag, longFlag };
    }
    exports2.Option = Option2;
    exports2.DualOptions = DualOptions;
  },
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS({
  'node_modules/commander/lib/suggestSimilar.js'(exports2) {
    var maxDistance = 3;
    function editDistance(a, b) {
      if (Math.abs(a.length - b.length) > maxDistance) return Math.max(a.length, b.length);
      const d = [];
      for (let i = 0; i <= a.length; i++) {
        d[i] = [i];
      }
      for (let j = 0; j <= b.length; j++) {
        d[0][j] = j;
      }
      for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
          let cost = 1;
          if (a[i - 1] === b[j - 1]) {
            cost = 0;
          } else {
            cost = 1;
          }
          d[i][j] = Math.min(
            d[i - 1][j] + 1,
            // deletion
            d[i][j - 1] + 1,
            // insertion
            d[i - 1][j - 1] + cost,
            // substitution
          );
          if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
            d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
          }
        }
      }
      return d[a.length][b.length];
    }
    function suggestSimilar(word, candidates) {
      if (!candidates || candidates.length === 0) return '';
      candidates = Array.from(new Set(candidates));
      const searchingOptions = word.startsWith('--');
      if (searchingOptions) {
        word = word.slice(2);
        candidates = candidates.map((candidate) => candidate.slice(2));
      }
      let similar = [];
      let bestDistance = maxDistance;
      const minSimilarity = 0.4;
      candidates.forEach((candidate) => {
        if (candidate.length <= 1) return;
        const distance = editDistance(word, candidate);
        const length = Math.max(word.length, candidate.length);
        const similarity = (length - distance) / length;
        if (similarity > minSimilarity) {
          if (distance < bestDistance) {
            bestDistance = distance;
            similar = [candidate];
          } else if (distance === bestDistance) {
            similar.push(candidate);
          }
        }
      });
      similar.sort((a, b) => a.localeCompare(b));
      if (searchingOptions) {
        similar = similar.map((candidate) => `--${candidate}`);
      }
      if (similar.length > 1) {
        return `
(Did you mean one of ${similar.join(', ')}?)`;
      }
      if (similar.length === 1) {
        return `
(Did you mean ${similar[0]}?)`;
      }
      return '';
    }
    exports2.suggestSimilar = suggestSimilar;
  },
});

// node_modules/commander/lib/command.js
var require_command = __commonJS({
  'node_modules/commander/lib/command.js'(exports2) {
    var EventEmitter = require('node:events').EventEmitter;
    var childProcess = require('node:child_process');
    var path = require('node:path');
    var fs2 = require('node:fs');
    var process10 = require('node:process');
    var { Argument: Argument2, humanReadableArgName } = require_argument();
    var { CommanderError: CommanderError2 } = require_error();
    var { Help: Help2, stripColor } = require_help();
    var { Option: Option2, DualOptions } = require_option();
    var { suggestSimilar } = require_suggestSimilar();
    var Command2 = class _Command extends EventEmitter {
      /**
       * Initialize a new `Command`.
       *
       * @param {string} [name]
       */
      constructor(name) {
        super();
        this.commands = [];
        this.options = [];
        this.parent = null;
        this._allowUnknownOption = false;
        this._allowExcessArguments = false;
        this.registeredArguments = [];
        this._args = this.registeredArguments;
        this.args = [];
        this.rawArgs = [];
        this.processedArgs = [];
        this._scriptPath = null;
        this._name = name || '';
        this._optionValues = {};
        this._optionValueSources = {};
        this._storeOptionsAsProperties = false;
        this._actionHandler = null;
        this._executableHandler = false;
        this._executableFile = null;
        this._executableDir = null;
        this._defaultCommandName = null;
        this._exitCallback = null;
        this._aliases = [];
        this._combineFlagAndOptionalValue = true;
        this._description = '';
        this._summary = '';
        this._argsDescription = void 0;
        this._enablePositionalOptions = false;
        this._passThroughOptions = false;
        this._lifeCycleHooks = {};
        this._showHelpAfterError = false;
        this._showSuggestionAfterError = true;
        this._savedState = null;
        this._outputConfiguration = {
          writeOut: (str) => process10.stdout.write(str),
          writeErr: (str) => process10.stderr.write(str),
          outputError: (str, write) => write(str),
          getOutHelpWidth: () => (process10.stdout.isTTY ? process10.stdout.columns : void 0),
          getErrHelpWidth: () => (process10.stderr.isTTY ? process10.stderr.columns : void 0),
          getOutHasColors: () => useColor() ?? (process10.stdout.isTTY && process10.stdout.hasColors?.()),
          getErrHasColors: () => useColor() ?? (process10.stderr.isTTY && process10.stderr.hasColors?.()),
          stripColor: (str) => stripColor(str),
        };
        this._hidden = false;
        this._helpOption = void 0;
        this._addImplicitHelpCommand = void 0;
        this._helpCommand = void 0;
        this._helpConfiguration = {};
      }
      /**
       * Copy settings that are useful to have in common across root command and subcommands.
       *
       * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
       *
       * @param {Command} sourceCommand
       * @return {Command} `this` command for chaining
       */
      copyInheritedSettings(sourceCommand) {
        this._outputConfiguration = sourceCommand._outputConfiguration;
        this._helpOption = sourceCommand._helpOption;
        this._helpCommand = sourceCommand._helpCommand;
        this._helpConfiguration = sourceCommand._helpConfiguration;
        this._exitCallback = sourceCommand._exitCallback;
        this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
        this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
        this._allowExcessArguments = sourceCommand._allowExcessArguments;
        this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
        this._showHelpAfterError = sourceCommand._showHelpAfterError;
        this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
        return this;
      }
      /**
       * @returns {Command[]}
       * @private
       */
      _getCommandAndAncestors() {
        const result = [];
        for (let command = this; command; command = command.parent) {
          result.push(command);
        }
        return result;
      }
      /**
       * Define a command.
       *
       * There are two styles of command: pay attention to where to put the description.
       *
       * @example
       * // Command implemented using action handler (description is supplied separately to `.command`)
       * program
       *   .command('clone <source> [destination]')
       *   .description('clone a repository into a newly created directory')
       *   .action((source, destination) => {
       *     console.log('clone command called');
       *   });
       *
       * // Command implemented using separate executable file (description is second parameter to `.command`)
       * program
       *   .command('start <service>', 'start named service')
       *   .command('stop [service]', 'stop named service, or all if no name supplied');
       *
       * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
       * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
       * @param {object} [execOpts] - configuration options (for executable)
       * @return {Command} returns new command for action handler, or `this` for executable command
       */
      command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
        let desc = actionOptsOrExecDesc;
        let opts = execOpts;
        if (typeof desc === 'object' && desc !== null) {
          opts = desc;
          desc = null;
        }
        opts = opts || {};
        const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
        const cmd = this.createCommand(name);
        if (desc) {
          cmd.description(desc);
          cmd._executableHandler = true;
        }
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        cmd._hidden = !!(opts.noHelp || opts.hidden);
        cmd._executableFile = opts.executableFile || null;
        if (args) cmd.arguments(args);
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd.copyInheritedSettings(this);
        if (desc) return this;
        return cmd;
      }
      /**
       * Factory routine to create a new unattached command.
       *
       * See .command() for creating an attached subcommand, which uses this routine to
       * create the command. You can override createCommand to customise subcommands.
       *
       * @param {string} [name]
       * @return {Command} new command
       */
      createCommand(name) {
        return new _Command(name);
      }
      /**
       * You can customise the help with a subclass of Help by overriding createHelp,
       * or by overriding Help properties using configureHelp().
       *
       * @return {Help}
       */
      createHelp() {
        return Object.assign(new Help2(), this.configureHelp());
      }
      /**
       * You can customise the help by overriding Help properties using configureHelp(),
       * or with a subclass of Help by overriding createHelp().
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureHelp(configuration) {
        if (configuration === void 0) return this._helpConfiguration;
        this._helpConfiguration = configuration;
        return this;
      }
      /**
       * The default output goes to stdout and stderr. You can customise this for special
       * applications. You can also customise the display of errors by overriding outputError.
       *
       * The configuration properties are all functions:
       *
       *     // change how output being written, defaults to stdout and stderr
       *     writeOut(str)
       *     writeErr(str)
       *     // change how output being written for errors, defaults to writeErr
       *     outputError(str, write) // used for displaying errors and not used for displaying help
       *     // specify width for wrapping help
       *     getOutHelpWidth()
       *     getErrHelpWidth()
       *     // color support, currently only used with Help
       *     getOutHasColors()
       *     getErrHasColors()
       *     stripColor() // used to remove ANSI escape codes if output does not have colors
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureOutput(configuration) {
        if (configuration === void 0) return this._outputConfiguration;
        Object.assign(this._outputConfiguration, configuration);
        return this;
      }
      /**
       * Display the help or a custom message after an error occurs.
       *
       * @param {(boolean|string)} [displayHelp]
       * @return {Command} `this` command for chaining
       */
      showHelpAfterError(displayHelp = true) {
        if (typeof displayHelp !== 'string') displayHelp = !!displayHelp;
        this._showHelpAfterError = displayHelp;
        return this;
      }
      /**
       * Display suggestion of similar commands for unknown commands, or options for unknown options.
       *
       * @param {boolean} [displaySuggestion]
       * @return {Command} `this` command for chaining
       */
      showSuggestionAfterError(displaySuggestion = true) {
        this._showSuggestionAfterError = !!displaySuggestion;
        return this;
      }
      /**
       * Add a prepared subcommand.
       *
       * See .command() for creating an attached subcommand which inherits settings from its parent.
       *
       * @param {Command} cmd - new subcommand
       * @param {object} [opts] - configuration options
       * @return {Command} `this` command for chaining
       */
      addCommand(cmd, opts) {
        if (!cmd._name) {
          throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
        }
        opts = opts || {};
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        if (opts.noHelp || opts.hidden) cmd._hidden = true;
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd._checkForBrokenPassThrough();
        return this;
      }
      /**
       * Factory routine to create a new unattached argument.
       *
       * See .argument() for creating an attached argument, which uses this routine to
       * create the argument. You can override createArgument to return a custom argument.
       *
       * @param {string} name
       * @param {string} [description]
       * @return {Argument} new argument
       */
      createArgument(name, description) {
        return new Argument2(name, description);
      }
      /**
       * Define argument syntax for command.
       *
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @example
       * program.argument('<input-file>');
       * program.argument('[output-file]');
       *
       * @param {string} name
       * @param {string} [description]
       * @param {(Function|*)} [fn] - custom argument processing function
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      argument(name, description, fn, defaultValue) {
        const argument = this.createArgument(name, description);
        if (typeof fn === 'function') {
          argument.default(defaultValue).argParser(fn);
        } else {
          argument.default(fn);
        }
        this.addArgument(argument);
        return this;
      }
      /**
       * Define argument syntax for command, adding multiple at once (without descriptions).
       *
       * See also .argument().
       *
       * @example
       * program.arguments('<cmd> [env]');
       *
       * @param {string} names
       * @return {Command} `this` command for chaining
       */
      arguments(names) {
        names
          .trim()
          .split(/ +/)
          .forEach((detail) => {
            this.argument(detail);
          });
        return this;
      }
      /**
       * Define argument syntax for command, adding a prepared argument.
       *
       * @param {Argument} argument
       * @return {Command} `this` command for chaining
       */
      addArgument(argument) {
        const previousArgument = this.registeredArguments.slice(-1)[0];
        if (previousArgument && previousArgument.variadic) {
          throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
        }
        if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) {
          throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
        }
        this.registeredArguments.push(argument);
        return this;
      }
      /**
       * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
       *
       * @example
       *    program.helpCommand('help [cmd]');
       *    program.helpCommand('help [cmd]', 'show help');
       *    program.helpCommand(false); // suppress default help command
       *    program.helpCommand(true); // add help command even if no subcommands
       *
       * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
       * @param {string} [description] - custom description
       * @return {Command} `this` command for chaining
       */
      helpCommand(enableOrNameAndArgs, description) {
        if (typeof enableOrNameAndArgs === 'boolean') {
          this._addImplicitHelpCommand = enableOrNameAndArgs;
          return this;
        }
        enableOrNameAndArgs = enableOrNameAndArgs ?? 'help [command]';
        const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
        const helpDescription = description ?? 'display help for command';
        const helpCommand = this.createCommand(helpName);
        helpCommand.helpOption(false);
        if (helpArgs) helpCommand.arguments(helpArgs);
        if (helpDescription) helpCommand.description(helpDescription);
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Add prepared custom help command.
       *
       * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
       * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
       * @return {Command} `this` command for chaining
       */
      addHelpCommand(helpCommand, deprecatedDescription) {
        if (typeof helpCommand !== 'object') {
          this.helpCommand(helpCommand, deprecatedDescription);
          return this;
        }
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Lazy create help command.
       *
       * @return {(Command|null)}
       * @package
       */
      _getHelpCommand() {
        const hasImplicitHelpCommand =
          this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand('help'));
        if (hasImplicitHelpCommand) {
          if (this._helpCommand === void 0) {
            this.helpCommand(void 0, void 0);
          }
          return this._helpCommand;
        }
        return null;
      }
      /**
       * Add hook for life cycle event.
       *
       * @param {string} event
       * @param {Function} listener
       * @return {Command} `this` command for chaining
       */
      hook(event, listener) {
        const allowedValues = ['preSubcommand', 'preAction', 'postAction'];
        if (!allowedValues.includes(event)) {
          throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        if (this._lifeCycleHooks[event]) {
          this._lifeCycleHooks[event].push(listener);
        } else {
          this._lifeCycleHooks[event] = [listener];
        }
        return this;
      }
      /**
       * Register callback to use as replacement for calling process.exit.
       *
       * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
       * @return {Command} `this` command for chaining
       */
      exitOverride(fn) {
        if (fn) {
          this._exitCallback = fn;
        } else {
          this._exitCallback = (err) => {
            if (err.code !== 'commander.executeSubCommandAsync') {
              throw err;
            } else {
            }
          };
        }
        return this;
      }
      /**
       * Call process.exit, and _exitCallback if defined.
       *
       * @param {number} exitCode exit code for using with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       * @return never
       * @private
       */
      _exit(exitCode, code, message) {
        if (this._exitCallback) {
          this._exitCallback(new CommanderError2(exitCode, code, message));
        }
        process10.exit(exitCode);
      }
      /**
       * Register callback `fn` for the command.
       *
       * @example
       * program
       *   .command('serve')
       *   .description('start service')
       *   .action(function() {
       *      // do work here
       *   });
       *
       * @param {Function} fn
       * @return {Command} `this` command for chaining
       */
      action(fn) {
        const listener = (args) => {
          const expectedArgsCount = this.registeredArguments.length;
          const actionArgs = args.slice(0, expectedArgsCount);
          if (this._storeOptionsAsProperties) {
            actionArgs[expectedArgsCount] = this;
          } else {
            actionArgs[expectedArgsCount] = this.opts();
          }
          actionArgs.push(this);
          return fn.apply(this, actionArgs);
        };
        this._actionHandler = listener;
        return this;
      }
      /**
       * Factory routine to create a new unattached option.
       *
       * See .option() for creating an attached option, which uses this routine to
       * create the option. You can override createOption to return a custom option.
       *
       * @param {string} flags
       * @param {string} [description]
       * @return {Option} new option
       */
      createOption(flags, description) {
        return new Option2(flags, description);
      }
      /**
       * Wrap parseArgs to catch 'commander.invalidArgument'.
       *
       * @param {(Option | Argument)} target
       * @param {string} value
       * @param {*} previous
       * @param {string} invalidArgumentMessage
       * @private
       */
      _callParseArg(target, value, previous, invalidArgumentMessage) {
        try {
          return target.parseArg(value, previous);
        } catch (err) {
          if (err.code === 'commander.invalidArgument') {
            const message = `${invalidArgumentMessage} ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      }
      /**
       * Check for option flag conflicts.
       * Register option if no conflicts found, or throw on conflict.
       *
       * @param {Option} option
       * @private
       */
      _registerOption(option) {
        const matchingOption =
          (option.short && this._findOption(option.short)) || (option.long && this._findOption(option.long));
        if (matchingOption) {
          const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
          throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
        }
        this.options.push(option);
      }
      /**
       * Check for command name and alias conflicts with existing commands.
       * Register command if no conflicts found, or throw on conflict.
       *
       * @param {Command} command
       * @private
       */
      _registerCommand(command) {
        const knownBy = (cmd) => {
          return [cmd.name()].concat(cmd.aliases());
        };
        const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
        if (alreadyUsed) {
          const existingCmd = knownBy(this._findCommand(alreadyUsed)).join('|');
          const newCmd = knownBy(command).join('|');
          throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
        }
        this.commands.push(command);
      }
      /**
       * Add an option.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addOption(option) {
        this._registerOption(option);
        const oname = option.name();
        const name = option.attributeName();
        if (option.negate) {
          const positiveLongFlag = option.long.replace(/^--no-/, '--');
          if (!this._findOption(positiveLongFlag)) {
            this.setOptionValueWithSource(name, option.defaultValue === void 0 ? true : option.defaultValue, 'default');
          }
        } else if (option.defaultValue !== void 0) {
          this.setOptionValueWithSource(name, option.defaultValue, 'default');
        }
        const handleOptionValue = (val, invalidValueMessage, valueSource) => {
          if (val == null && option.presetArg !== void 0) {
            val = option.presetArg;
          }
          const oldValue = this.getOptionValue(name);
          if (val !== null && option.parseArg) {
            val = this._callParseArg(option, val, oldValue, invalidValueMessage);
          } else if (val !== null && option.variadic) {
            val = option._concatValue(val, oldValue);
          }
          if (val == null) {
            if (option.negate) {
              val = false;
            } else if (option.isBoolean() || option.optional) {
              val = true;
            } else {
              val = '';
            }
          }
          this.setOptionValueWithSource(name, val, valueSource);
        };
        this.on('option:' + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, 'cli');
        });
        if (option.envVar) {
          this.on('optionEnv:' + oname, (val) => {
            const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
            handleOptionValue(val, invalidValueMessage, 'env');
          });
        }
        return this;
      }
      /**
       * Internal implementation shared by .option() and .requiredOption()
       *
       * @return {Command} `this` command for chaining
       * @private
       */
      _optionEx(config, flags, description, fn, defaultValue) {
        if (typeof flags === 'object' && flags instanceof Option2) {
          throw new Error('To add an Option object use addOption() instead of option() or requiredOption()');
        }
        const option = this.createOption(flags, description);
        option.makeOptionMandatory(!!config.mandatory);
        if (typeof fn === 'function') {
          option.default(defaultValue).argParser(fn);
        } else if (fn instanceof RegExp) {
          const regex2 = fn;
          fn = (val, def) => {
            const m = regex2.exec(val);
            return m ? m[0] : def;
          };
          option.default(defaultValue).argParser(fn);
        } else {
          option.default(fn);
        }
        return this.addOption(option);
      }
      /**
       * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
       * option-argument is indicated by `<>` and an optional option-argument by `[]`.
       *
       * See the README for more details, and see also addOption() and requiredOption().
       *
       * @example
       * program
       *     .option('-p, --pepper', 'add pepper')
       *     .option('--pt, --pizza-type <TYPE>', 'type of pizza') // required option-argument
       *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
       *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      option(flags, description, parseArg, defaultValue) {
        return this._optionEx({}, flags, description, parseArg, defaultValue);
      }
      /**
       * Add a required option which must have a value after parsing. This usually means
       * the option must be specified on the command line. (Otherwise the same as .option().)
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      requiredOption(flags, description, parseArg, defaultValue) {
        return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
      }
      /**
       * Alter parsing of short flags with optional values.
       *
       * @example
       * // for `.option('-f,--flag [value]'):
       * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
       * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
       *
       * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
       * @return {Command} `this` command for chaining
       */
      combineFlagAndOptionalValue(combine = true) {
        this._combineFlagAndOptionalValue = !!combine;
        return this;
      }
      /**
       * Allow unknown options on the command line.
       *
       * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
       * @return {Command} `this` command for chaining
       */
      allowUnknownOption(allowUnknown = true) {
        this._allowUnknownOption = !!allowUnknown;
        return this;
      }
      /**
       * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
       *
       * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
       * @return {Command} `this` command for chaining
       */
      allowExcessArguments(allowExcess = true) {
        this._allowExcessArguments = !!allowExcess;
        return this;
      }
      /**
       * Enable positional options. Positional means global options are specified before subcommands which lets
       * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
       * The default behaviour is non-positional and global options may appear anywhere on the command line.
       *
       * @param {boolean} [positional]
       * @return {Command} `this` command for chaining
       */
      enablePositionalOptions(positional = true) {
        this._enablePositionalOptions = !!positional;
        return this;
      }
      /**
       * Pass through options that come after command-arguments rather than treat them as command-options,
       * so actual command-options come before command-arguments. Turning this on for a subcommand requires
       * positional options to have been enabled on the program (parent commands).
       * The default behaviour is non-positional and options may appear before or after command-arguments.
       *
       * @param {boolean} [passThrough] for unknown options.
       * @return {Command} `this` command for chaining
       */
      passThroughOptions(passThrough = true) {
        this._passThroughOptions = !!passThrough;
        this._checkForBrokenPassThrough();
        return this;
      }
      /**
       * @private
       */
      _checkForBrokenPassThrough() {
        if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
          throw new Error(
            `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`,
          );
        }
      }
      /**
       * Whether to store option values as properties on command object,
       * or store separately (specify false). In both cases the option values can be accessed using .opts().
       *
       * @param {boolean} [storeAsProperties=true]
       * @return {Command} `this` command for chaining
       */
      storeOptionsAsProperties(storeAsProperties = true) {
        if (this.options.length) {
          throw new Error('call .storeOptionsAsProperties() before adding options');
        }
        if (Object.keys(this._optionValues).length) {
          throw new Error('call .storeOptionsAsProperties() before setting option values');
        }
        this._storeOptionsAsProperties = !!storeAsProperties;
        return this;
      }
      /**
       * Retrieve option value.
       *
       * @param {string} key
       * @return {object} value
       */
      getOptionValue(key) {
        if (this._storeOptionsAsProperties) {
          return this[key];
        }
        return this._optionValues[key];
      }
      /**
       * Store option value.
       *
       * @param {string} key
       * @param {object} value
       * @return {Command} `this` command for chaining
       */
      setOptionValue(key, value) {
        return this.setOptionValueWithSource(key, value, void 0);
      }
      /**
       * Store option value and where the value came from.
       *
       * @param {string} key
       * @param {object} value
       * @param {string} source - expected values are default/config/env/cli/implied
       * @return {Command} `this` command for chaining
       */
      setOptionValueWithSource(key, value, source) {
        if (this._storeOptionsAsProperties) {
          this[key] = value;
        } else {
          this._optionValues[key] = value;
        }
        this._optionValueSources[key] = source;
        return this;
      }
      /**
       * Get source of option value.
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSource(key) {
        return this._optionValueSources[key];
      }
      /**
       * Get source of option value. See also .optsWithGlobals().
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSourceWithGlobals(key) {
        let source;
        this._getCommandAndAncestors().forEach((cmd) => {
          if (cmd.getOptionValueSource(key) !== void 0) {
            source = cmd.getOptionValueSource(key);
          }
        });
        return source;
      }
      /**
       * Get user arguments from implied or explicit arguments.
       * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
       *
       * @private
       */
      _prepareUserArgs(argv, parseOptions) {
        if (argv !== void 0 && !Array.isArray(argv)) {
          throw new Error('first parameter to parse must be array or undefined');
        }
        parseOptions = parseOptions || {};
        if (argv === void 0 && parseOptions.from === void 0) {
          if (process10.versions?.electron) {
            parseOptions.from = 'electron';
          }
          const execArgv = process10.execArgv ?? [];
          if (
            execArgv.includes('-e') ||
            execArgv.includes('--eval') ||
            execArgv.includes('-p') ||
            execArgv.includes('--print')
          ) {
            parseOptions.from = 'eval';
          }
        }
        if (argv === void 0) {
          argv = process10.argv;
        }
        this.rawArgs = argv.slice();
        let userArgs;
        switch (parseOptions.from) {
          case void 0:
          case 'node':
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
            break;
          case 'electron':
            if (process10.defaultApp) {
              this._scriptPath = argv[1];
              userArgs = argv.slice(2);
            } else {
              userArgs = argv.slice(1);
            }
            break;
          case 'user':
            userArgs = argv.slice(0);
            break;
          case 'eval':
            userArgs = argv.slice(1);
            break;
          default:
            throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
        }
        if (!this._name && this._scriptPath) this.nameFromFilename(this._scriptPath);
        this._name = this._name || 'program';
        return userArgs;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Use parseAsync instead of parse if any of your action handlers are async.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * program.parse(); // parse process.argv and auto-detect electron and special node flags
       * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
       * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv] - optional, defaults to process.argv
       * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
       * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
       * @return {Command} `this` command for chaining
       */
      parse(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
       * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
       * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv]
       * @param {object} [parseOptions]
       * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
       * @return {Promise}
       */
      async parseAsync(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        await this._parseCommand([], userArgs);
        return this;
      }
      _prepareForParse() {
        if (this._savedState === null) {
          this.saveStateBeforeParse();
        } else {
          this.restoreStateBeforeParse();
        }
      }
      /**
       * Called the first time parse is called to save state and allow a restore before subsequent calls to parse.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state saved.
       */
      saveStateBeforeParse() {
        this._savedState = {
          // name is stable if supplied by author, but may be unspecified for root command and deduced during parsing
          _name: this._name,
          // option values before parse have default values (including false for negated options)
          // shallow clones
          _optionValues: { ...this._optionValues },
          _optionValueSources: { ...this._optionValueSources },
        };
      }
      /**
       * Restore state before parse for calls after the first.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state restored.
       */
      restoreStateBeforeParse() {
        if (this._storeOptionsAsProperties)
          throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
        this._name = this._savedState._name;
        this._scriptPath = null;
        this.rawArgs = [];
        this._optionValues = { ...this._savedState._optionValues };
        this._optionValueSources = { ...this._savedState._optionValueSources };
        this.args = [];
        this.processedArgs = [];
      }
      /**
       * Throw if expected executable is missing. Add lots of help for author.
       *
       * @param {string} executableFile
       * @param {string} executableDir
       * @param {string} subcommandName
       */
      _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
        if (fs2.existsSync(executableFile)) return;
        const executableDirMessage = executableDir
          ? `searched for local subcommand relative to directory '${executableDir}'`
          : 'no directory for search for local subcommand, use .executableDir() to supply a custom directory';
        const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
        throw new Error(executableMissing);
      }
      /**
       * Execute a sub-command executable.
       *
       * @private
       */
      _executeSubCommand(subcommand, args) {
        args = args.slice();
        let launchWithNode = false;
        const sourceExt = ['.js', '.ts', '.tsx', '.mjs', '.cjs'];
        function findFile(baseDir, baseName) {
          const localBin = path.resolve(baseDir, baseName);
          if (fs2.existsSync(localBin)) return localBin;
          if (sourceExt.includes(path.extname(baseName))) return void 0;
          const foundExt = sourceExt.find((ext) => fs2.existsSync(`${localBin}${ext}`));
          if (foundExt) return `${localBin}${foundExt}`;
          return void 0;
        }
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
        let executableDir = this._executableDir || '';
        if (this._scriptPath) {
          let resolvedScriptPath;
          try {
            resolvedScriptPath = fs2.realpathSync(this._scriptPath);
          } catch {
            resolvedScriptPath = this._scriptPath;
          }
          executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
        }
        if (executableDir) {
          let localFile = findFile(executableDir, executableFile);
          if (!localFile && !subcommand._executableFile && this._scriptPath) {
            const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
            if (legacyName !== this._name) {
              localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
            }
          }
          executableFile = localFile || executableFile;
        }
        launchWithNode = sourceExt.includes(path.extname(executableFile));
        let proc;
        if (process10.platform !== 'win32') {
          if (launchWithNode) {
            args.unshift(executableFile);
            args = incrementNodeInspectorPort(process10.execArgv).concat(args);
            proc = childProcess.spawn(process10.argv[0], args, { stdio: 'inherit' });
          } else {
            proc = childProcess.spawn(executableFile, args, { stdio: 'inherit' });
          }
        } else {
          this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process10.execArgv).concat(args);
          proc = childProcess.spawn(process10.execPath, args, { stdio: 'inherit' });
        }
        if (!proc.killed) {
          const signals2 = ['SIGUSR1', 'SIGUSR2', 'SIGTERM', 'SIGINT', 'SIGHUP'];
          signals2.forEach((signal) => {
            process10.on(signal, () => {
              if (proc.killed === false && proc.exitCode === null) {
                proc.kill(signal);
              }
            });
          });
        }
        const exitCallback = this._exitCallback;
        proc.on('close', (code) => {
          code = code ?? 1;
          if (!exitCallback) {
            process10.exit(code);
          } else {
            exitCallback(new CommanderError2(code, 'commander.executeSubCommandAsync', '(close)'));
          }
        });
        proc.on('error', (err) => {
          if (err.code === 'ENOENT') {
            this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
          } else if (err.code === 'EACCES') {
            throw new Error(`'${executableFile}' not executable`);
          }
          if (!exitCallback) {
            process10.exit(1);
          } else {
            const wrappedError = new CommanderError2(1, 'commander.executeSubCommandAsync', '(error)');
            wrappedError.nestedError = err;
            exitCallback(wrappedError);
          }
        });
        this.runningCommand = proc;
      }
      /**
       * @private
       */
      _dispatchSubcommand(commandName, operands, unknown) {
        const subCommand = this._findCommand(commandName);
        if (!subCommand) this.help({ error: true });
        subCommand._prepareForParse();
        let promiseChain;
        promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, 'preSubcommand');
        promiseChain = this._chainOrCall(promiseChain, () => {
          if (subCommand._executableHandler) {
            this._executeSubCommand(subCommand, operands.concat(unknown));
          } else {
            return subCommand._parseCommand(operands, unknown);
          }
        });
        return promiseChain;
      }
      /**
       * Invoke help directly if possible, or dispatch if necessary.
       * e.g. help foo
       *
       * @private
       */
      _dispatchHelpCommand(subcommandName) {
        if (!subcommandName) {
          this.help();
        }
        const subCommand = this._findCommand(subcommandName);
        if (subCommand && !subCommand._executableHandler) {
          subCommand.help();
        }
        return this._dispatchSubcommand(
          subcommandName,
          [],
          [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? '--help'],
        );
      }
      /**
       * Check this.args against expected this.registeredArguments.
       *
       * @private
       */
      _checkNumberOfArguments() {
        this.registeredArguments.forEach((arg, i) => {
          if (arg.required && this.args[i] == null) {
            this.missingArgument(arg.name());
          }
        });
        if (
          this.registeredArguments.length > 0 &&
          this.registeredArguments[this.registeredArguments.length - 1].variadic
        ) {
          return;
        }
        if (this.args.length > this.registeredArguments.length) {
          this._excessArguments(this.args);
        }
      }
      /**
       * Process this.args using this.registeredArguments and save as this.processedArgs!
       *
       * @private
       */
      _processArguments() {
        const myParseArg = (argument, value, previous) => {
          let parsedValue = value;
          if (value !== null && argument.parseArg) {
            const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
            parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
          }
          return parsedValue;
        };
        this._checkNumberOfArguments();
        const processedArgs = [];
        this.registeredArguments.forEach((declaredArg, index) => {
          let value = declaredArg.defaultValue;
          if (declaredArg.variadic) {
            if (index < this.args.length) {
              value = this.args.slice(index);
              if (declaredArg.parseArg) {
                value = value.reduce((processed, v) => {
                  return myParseArg(declaredArg, v, processed);
                }, declaredArg.defaultValue);
              }
            } else if (value === void 0) {
              value = [];
            }
          } else if (index < this.args.length) {
            value = this.args[index];
            if (declaredArg.parseArg) {
              value = myParseArg(declaredArg, value, declaredArg.defaultValue);
            }
          }
          processedArgs[index] = value;
        });
        this.processedArgs = processedArgs;
      }
      /**
       * Once we have a promise we chain, but call synchronously until then.
       *
       * @param {(Promise|undefined)} promise
       * @param {Function} fn
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCall(promise, fn) {
        if (promise && promise.then && typeof promise.then === 'function') {
          return promise.then(() => fn());
        }
        return fn();
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallHooks(promise, event) {
        let result = promise;
        const hooks = [];
        this._getCommandAndAncestors()
          .reverse()
          .filter((cmd) => cmd._lifeCycleHooks[event] !== void 0)
          .forEach((hookedCommand) => {
            hookedCommand._lifeCycleHooks[event].forEach((callback) => {
              hooks.push({ hookedCommand, callback });
            });
          });
        if (event === 'postAction') {
          hooks.reverse();
        }
        hooks.forEach((hookDetail) => {
          result = this._chainOrCall(result, () => {
            return hookDetail.callback(hookDetail.hookedCommand, this);
          });
        });
        return result;
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {Command} subCommand
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallSubCommandHook(promise, subCommand, event) {
        let result = promise;
        if (this._lifeCycleHooks[event] !== void 0) {
          this._lifeCycleHooks[event].forEach((hook2) => {
            result = this._chainOrCall(result, () => {
              return hook2(this, subCommand);
            });
          });
        }
        return result;
      }
      /**
       * Process arguments in context of this command.
       * Returns action result, in case it is a promise.
       *
       * @private
       */
      _parseCommand(operands, unknown) {
        const parsed = this.parseOptions(unknown);
        this._parseOptionsEnv();
        this._parseOptionsImplied();
        operands = operands.concat(parsed.operands);
        unknown = parsed.unknown;
        this.args = operands.concat(unknown);
        if (operands && this._findCommand(operands[0])) {
          return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
        }
        if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
          return this._dispatchHelpCommand(operands[1]);
        }
        if (this._defaultCommandName) {
          this._outputHelpIfRequested(unknown);
          return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
        }
        if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
          this.help({ error: true });
        }
        this._outputHelpIfRequested(parsed.unknown);
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        const checkForUnknownOptions = () => {
          if (parsed.unknown.length > 0) {
            this.unknownOption(parsed.unknown[0]);
          }
        };
        const commandEvent = `command:${this.name()}`;
        if (this._actionHandler) {
          checkForUnknownOptions();
          this._processArguments();
          let promiseChain;
          promiseChain = this._chainOrCallHooks(promiseChain, 'preAction');
          promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
          if (this.parent) {
            promiseChain = this._chainOrCall(promiseChain, () => {
              this.parent.emit(commandEvent, operands, unknown);
            });
          }
          promiseChain = this._chainOrCallHooks(promiseChain, 'postAction');
          return promiseChain;
        }
        if (this.parent && this.parent.listenerCount(commandEvent)) {
          checkForUnknownOptions();
          this._processArguments();
          this.parent.emit(commandEvent, operands, unknown);
        } else if (operands.length) {
          if (this._findCommand('*')) {
            return this._dispatchSubcommand('*', operands, unknown);
          }
          if (this.listenerCount('command:*')) {
            this.emit('command:*', operands, unknown);
          } else if (this.commands.length) {
            this.unknownCommand();
          } else {
            checkForUnknownOptions();
            this._processArguments();
          }
        } else if (this.commands.length) {
          checkForUnknownOptions();
          this.help({ error: true });
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      }
      /**
       * Find matching command.
       *
       * @private
       * @return {Command | undefined}
       */
      _findCommand(name) {
        if (!name) return void 0;
        return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
      }
      /**
       * Return an option matching `arg` if any.
       *
       * @param {string} arg
       * @return {Option}
       * @package
       */
      _findOption(arg) {
        return this.options.find((option) => option.is(arg));
      }
      /**
       * Display an error message if a mandatory option does not have a value.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForMissingMandatoryOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd.options.forEach((anOption) => {
            if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) {
              cmd.missingMandatoryOptionValue(anOption);
            }
          });
        });
      }
      /**
       * Display an error message if conflicting options are used together in this.
       *
       * @private
       */
      _checkForConflictingLocalOptions() {
        const definedNonDefaultOptions = this.options.filter((option) => {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === void 0) {
            return false;
          }
          return this.getOptionValueSource(optionKey) !== 'default';
        });
        const optionsWithConflicting = definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0);
        optionsWithConflicting.forEach((option) => {
          const conflictingAndDefined = definedNonDefaultOptions.find((defined) =>
            option.conflictsWith.includes(defined.attributeName()),
          );
          if (conflictingAndDefined) {
            this._conflictingOption(option, conflictingAndDefined);
          }
        });
      }
      /**
       * Display an error message if conflicting options are used together.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForConflictingOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd._checkForConflictingLocalOptions();
        });
      }
      /**
       * Parse options from `argv` removing known options,
       * and return argv split into operands and unknown arguments.
       *
       * Side effects: modifies command by storing options. Does not reset state if called again.
       *
       * Examples:
       *
       *     argv => operands, unknown
       *     --known kkk op => [op], []
       *     op --known kkk => [op], []
       *     sub --unknown uuu op => [sub], [--unknown uuu op]
       *     sub -- --unknown uuu op => [sub --unknown uuu op], []
       *
       * @param {string[]} argv
       * @return {{operands: string[], unknown: string[]}}
       */
      parseOptions(argv) {
        const operands = [];
        const unknown = [];
        let dest = operands;
        const args = argv.slice();
        function maybeOption(arg) {
          return arg.length > 1 && arg[0] === '-';
        }
        let activeVariadicOption = null;
        while (args.length) {
          const arg = args.shift();
          if (arg === '--') {
            if (dest === unknown) dest.push(arg);
            dest.push(...args);
            break;
          }
          if (activeVariadicOption && !maybeOption(arg)) {
            this.emit(`option:${activeVariadicOption.name()}`, arg);
            continue;
          }
          activeVariadicOption = null;
          if (maybeOption(arg)) {
            const option = this._findOption(arg);
            if (option) {
              if (option.required) {
                const value = args.shift();
                if (value === void 0) this.optionMissingArgument(option);
                this.emit(`option:${option.name()}`, value);
              } else if (option.optional) {
                let value = null;
                if (args.length > 0 && !maybeOption(args[0])) {
                  value = args.shift();
                }
                this.emit(`option:${option.name()}`, value);
              } else {
                this.emit(`option:${option.name()}`);
              }
              activeVariadicOption = option.variadic ? option : null;
              continue;
            }
          }
          if (arg.length > 2 && arg[0] === '-' && arg[1] !== '-') {
            const option = this._findOption(`-${arg[1]}`);
            if (option) {
              if (option.required || (option.optional && this._combineFlagAndOptionalValue)) {
                this.emit(`option:${option.name()}`, arg.slice(2));
              } else {
                this.emit(`option:${option.name()}`);
                args.unshift(`-${arg.slice(2)}`);
              }
              continue;
            }
          }
          if (/^--[^=]+=/.test(arg)) {
            const index = arg.indexOf('=');
            const option = this._findOption(arg.slice(0, index));
            if (option && (option.required || option.optional)) {
              this.emit(`option:${option.name()}`, arg.slice(index + 1));
              continue;
            }
          }
          if (maybeOption(arg)) {
            dest = unknown;
          }
          if (
            (this._enablePositionalOptions || this._passThroughOptions) &&
            operands.length === 0 &&
            unknown.length === 0
          ) {
            if (this._findCommand(arg)) {
              operands.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
              operands.push(arg);
              if (args.length > 0) operands.push(...args);
              break;
            } else if (this._defaultCommandName) {
              unknown.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            }
          }
          if (this._passThroughOptions) {
            dest.push(arg);
            if (args.length > 0) dest.push(...args);
            break;
          }
          dest.push(arg);
        }
        return { operands, unknown };
      }
      /**
       * Return an object containing local option values as key-value pairs.
       *
       * @return {object}
       */
      opts() {
        if (this._storeOptionsAsProperties) {
          const result = {};
          const len = this.options.length;
          for (let i = 0; i < len; i++) {
            const key = this.options[i].attributeName();
            result[key] = key === this._versionOptionName ? this._version : this[key];
          }
          return result;
        }
        return this._optionValues;
      }
      /**
       * Return an object containing merged local and global option values as key-value pairs.
       *
       * @return {object}
       */
      optsWithGlobals() {
        return this._getCommandAndAncestors().reduce(
          (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
          {},
        );
      }
      /**
       * Display error message and exit (or call exitOverride).
       *
       * @param {string} message
       * @param {object} [errorOptions]
       * @param {string} [errorOptions.code] - an id string representing the error
       * @param {number} [errorOptions.exitCode] - used with process.exit
       */
      error(message, errorOptions) {
        this._outputConfiguration.outputError(
          `${message}
`,
          this._outputConfiguration.writeErr,
        );
        if (typeof this._showHelpAfterError === 'string') {
          this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
        } else if (this._showHelpAfterError) {
          this._outputConfiguration.writeErr('\n');
          this.outputHelp({ error: true });
        }
        const config = errorOptions || {};
        const exitCode = config.exitCode || 1;
        const code = config.code || 'commander.error';
        this._exit(exitCode, code, message);
      }
      /**
       * Apply any option related environment variables, if option does
       * not have a value from cli or client code.
       *
       * @private
       */
      _parseOptionsEnv() {
        this.options.forEach((option) => {
          if (option.envVar && option.envVar in process10.env) {
            const optionKey = option.attributeName();
            if (
              this.getOptionValue(optionKey) === void 0 ||
              ['default', 'config', 'env'].includes(this.getOptionValueSource(optionKey))
            ) {
              if (option.required || option.optional) {
                this.emit(`optionEnv:${option.name()}`, process10.env[option.envVar]);
              } else {
                this.emit(`optionEnv:${option.name()}`);
              }
            }
          }
        });
      }
      /**
       * Apply any implied option values, if option is undefined or default value.
       *
       * @private
       */
      _parseOptionsImplied() {
        const dualHelper = new DualOptions(this.options);
        const hasCustomOptionValue = (optionKey) => {
          return (
            this.getOptionValue(optionKey) !== void 0 &&
            !['default', 'implied'].includes(this.getOptionValueSource(optionKey))
          );
        };
        this.options
          .filter(
            (option) =>
              option.implied !== void 0 &&
              hasCustomOptionValue(option.attributeName()) &&
              dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option),
          )
          .forEach((option) => {
            Object.keys(option.implied)
              .filter((impliedKey) => !hasCustomOptionValue(impliedKey))
              .forEach((impliedKey) => {
                this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], 'implied');
              });
          });
      }
      /**
       * Argument `name` is missing.
       *
       * @param {string} name
       * @private
       */
      missingArgument(name) {
        const message = `error: missing required argument '${name}'`;
        this.error(message, { code: 'commander.missingArgument' });
      }
      /**
       * `Option` is missing an argument.
       *
       * @param {Option} option
       * @private
       */
      optionMissingArgument(option) {
        const message = `error: option '${option.flags}' argument missing`;
        this.error(message, { code: 'commander.optionMissingArgument' });
      }
      /**
       * `Option` does not have a value, and is a mandatory option.
       *
       * @param {Option} option
       * @private
       */
      missingMandatoryOptionValue(option) {
        const message = `error: required option '${option.flags}' not specified`;
        this.error(message, { code: 'commander.missingMandatoryOptionValue' });
      }
      /**
       * `Option` conflicts with another option.
       *
       * @param {Option} option
       * @param {Option} conflictingOption
       * @private
       */
      _conflictingOption(option, conflictingOption) {
        const findBestOptionFromValue = (option2) => {
          const optionKey = option2.attributeName();
          const optionValue = this.getOptionValue(optionKey);
          const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
          const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
          if (
            negativeOption &&
            ((negativeOption.presetArg === void 0 && optionValue === false) ||
              (negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg))
          ) {
            return negativeOption;
          }
          return positiveOption || option2;
        };
        const getErrorMessage = (option2) => {
          const bestOption = findBestOptionFromValue(option2);
          const optionKey = bestOption.attributeName();
          const source = this.getOptionValueSource(optionKey);
          if (source === 'env') {
            return `environment variable '${bestOption.envVar}'`;
          }
          return `option '${bestOption.flags}'`;
        };
        const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
        this.error(message, { code: 'commander.conflictingOption' });
      }
      /**
       * Unknown option `flag`.
       *
       * @param {string} flag
       * @private
       */
      unknownOption(flag) {
        if (this._allowUnknownOption) return;
        let suggestion = '';
        if (flag.startsWith('--') && this._showSuggestionAfterError) {
          let candidateFlags = [];
          let command = this;
          do {
            const moreFlags = command
              .createHelp()
              .visibleOptions(command)
              .filter((option) => option.long)
              .map((option) => option.long);
            candidateFlags = candidateFlags.concat(moreFlags);
            command = command.parent;
          } while (command && !command._enablePositionalOptions);
          suggestion = suggestSimilar(flag, candidateFlags);
        }
        const message = `error: unknown option '${flag}'${suggestion}`;
        this.error(message, { code: 'commander.unknownOption' });
      }
      /**
       * Excess arguments, more than expected.
       *
       * @param {string[]} receivedArgs
       * @private
       */
      _excessArguments(receivedArgs) {
        if (this._allowExcessArguments) return;
        const expected = this.registeredArguments.length;
        const s = expected === 1 ? '' : 's';
        const forSubcommand = this.parent ? ` for '${this.name()}'` : '';
        const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
        this.error(message, { code: 'commander.excessArguments' });
      }
      /**
       * Unknown command.
       *
       * @private
       */
      unknownCommand() {
        const unknownName = this.args[0];
        let suggestion = '';
        if (this._showSuggestionAfterError) {
          const candidateNames = [];
          this.createHelp()
            .visibleCommands(this)
            .forEach((command) => {
              candidateNames.push(command.name());
              if (command.alias()) candidateNames.push(command.alias());
            });
          suggestion = suggestSimilar(unknownName, candidateNames);
        }
        const message = `error: unknown command '${unknownName}'${suggestion}`;
        this.error(message, { code: 'commander.unknownCommand' });
      }
      /**
       * Get or set the program version.
       *
       * This method auto-registers the "-V, --version" option which will print the version number.
       *
       * You can optionally supply the flags and description to override the defaults.
       *
       * @param {string} [str]
       * @param {string} [flags]
       * @param {string} [description]
       * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
       */
      version(str, flags, description) {
        if (str === void 0) return this._version;
        this._version = str;
        flags = flags || '-V, --version';
        description = description || 'output the version number';
        const versionOption = this.createOption(flags, description);
        this._versionOptionName = versionOption.attributeName();
        this._registerOption(versionOption);
        this.on('option:' + versionOption.name(), () => {
          this._outputConfiguration.writeOut(`${str}
`);
          this._exit(0, 'commander.version', str);
        });
        return this;
      }
      /**
       * Set the description.
       *
       * @param {string} [str]
       * @param {object} [argsDescription]
       * @return {(string|Command)}
       */
      description(str, argsDescription) {
        if (str === void 0 && argsDescription === void 0) return this._description;
        this._description = str;
        if (argsDescription) {
          this._argsDescription = argsDescription;
        }
        return this;
      }
      /**
       * Set the summary. Used when listed as subcommand of parent.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      summary(str) {
        if (str === void 0) return this._summary;
        this._summary = str;
        return this;
      }
      /**
       * Set an alias for the command.
       *
       * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
       *
       * @param {string} [alias]
       * @return {(string|Command)}
       */
      alias(alias) {
        if (alias === void 0) return this._aliases[0];
        let command = this;
        if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
          command = this.commands[this.commands.length - 1];
        }
        if (alias === command._name) throw new Error("Command alias can't be the same as its name");
        const matchingCommand = this.parent?._findCommand(alias);
        if (matchingCommand) {
          const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join('|');
          throw new Error(
            `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`,
          );
        }
        command._aliases.push(alias);
        return this;
      }
      /**
       * Set aliases for the command.
       *
       * Only the first alias is shown in the auto-generated help.
       *
       * @param {string[]} [aliases]
       * @return {(string[]|Command)}
       */
      aliases(aliases) {
        if (aliases === void 0) return this._aliases;
        aliases.forEach((alias) => this.alias(alias));
        return this;
      }
      /**
       * Set / get the command usage `str`.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      usage(str) {
        if (str === void 0) {
          if (this._usage) return this._usage;
          const args = this.registeredArguments.map((arg) => {
            return humanReadableArgName(arg);
          });
          return []
            .concat(
              this.options.length || this._helpOption !== null ? '[options]' : [],
              this.commands.length ? '[command]' : [],
              this.registeredArguments.length ? args : [],
            )
            .join(' ');
        }
        this._usage = str;
        return this;
      }
      /**
       * Get or set the name of the command.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      name(str) {
        if (str === void 0) return this._name;
        this._name = str;
        return this;
      }
      /**
       * Set the name of the command from script filename, such as process.argv[1],
       * or require.main.filename, or __filename.
       *
       * (Used internally and public although not documented in README.)
       *
       * @example
       * program.nameFromFilename(require.main.filename);
       *
       * @param {string} filename
       * @return {Command}
       */
      nameFromFilename(filename) {
        this._name = path.basename(filename, path.extname(filename));
        return this;
      }
      /**
       * Get or set the directory for searching for executable subcommands of this command.
       *
       * @example
       * program.executableDir(__dirname);
       * // or
       * program.executableDir('subcommands');
       *
       * @param {string} [path]
       * @return {(string|null|Command)}
       */
      executableDir(path2) {
        if (path2 === void 0) return this._executableDir;
        this._executableDir = path2;
        return this;
      }
      /**
       * Return program help documentation.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
       * @return {string}
       */
      helpInformation(contextOptions) {
        const helper = this.createHelp();
        const context = this._getOutputContext(contextOptions);
        helper.prepareContext({
          error: context.error,
          helpWidth: context.helpWidth,
          outputHasColors: context.hasColors,
        });
        const text = helper.formatHelp(this, helper);
        if (context.hasColors) return text;
        return this._outputConfiguration.stripColor(text);
      }
      /**
       * @typedef HelpContext
       * @type {object}
       * @property {boolean} error
       * @property {number} helpWidth
       * @property {boolean} hasColors
       * @property {function} write - includes stripColor if needed
       *
       * @returns {HelpContext}
       * @private
       */
      _getOutputContext(contextOptions) {
        contextOptions = contextOptions || {};
        const error = !!contextOptions.error;
        let baseWrite;
        let hasColors;
        let helpWidth;
        if (error) {
          baseWrite = (str) => this._outputConfiguration.writeErr(str);
          hasColors = this._outputConfiguration.getErrHasColors();
          helpWidth = this._outputConfiguration.getErrHelpWidth();
        } else {
          baseWrite = (str) => this._outputConfiguration.writeOut(str);
          hasColors = this._outputConfiguration.getOutHasColors();
          helpWidth = this._outputConfiguration.getOutHelpWidth();
        }
        const write = (str) => {
          if (!hasColors) str = this._outputConfiguration.stripColor(str);
          return baseWrite(str);
        };
        return { error, write, hasColors, helpWidth };
      }
      /**
       * Output help information for this command.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      outputHelp(contextOptions) {
        let deprecatedCallback;
        if (typeof contextOptions === 'function') {
          deprecatedCallback = contextOptions;
          contextOptions = void 0;
        }
        const outputContext = this._getOutputContext(contextOptions);
        const eventContext = {
          error: outputContext.error,
          write: outputContext.write,
          command: this,
        };
        this._getCommandAndAncestors()
          .reverse()
          .forEach((command) => command.emit('beforeAllHelp', eventContext));
        this.emit('beforeHelp', eventContext);
        let helpInformation = this.helpInformation({ error: outputContext.error });
        if (deprecatedCallback) {
          helpInformation = deprecatedCallback(helpInformation);
          if (typeof helpInformation !== 'string' && !Buffer.isBuffer(helpInformation)) {
            throw new Error('outputHelp callback must return a string or a Buffer');
          }
        }
        outputContext.write(helpInformation);
        if (this._getHelpOption()?.long) {
          this.emit(this._getHelpOption().long);
        }
        this.emit('afterHelp', eventContext);
        this._getCommandAndAncestors().forEach((command) => command.emit('afterAllHelp', eventContext));
      }
      /**
       * You can pass in flags and a description to customise the built-in help option.
       * Pass in false to disable the built-in help option.
       *
       * @example
       * program.helpOption('-?, --help' 'show help'); // customise
       * program.helpOption(false); // disable
       *
       * @param {(string | boolean)} flags
       * @param {string} [description]
       * @return {Command} `this` command for chaining
       */
      helpOption(flags, description) {
        if (typeof flags === 'boolean') {
          if (flags) {
            this._helpOption = this._helpOption ?? void 0;
          } else {
            this._helpOption = null;
          }
          return this;
        }
        flags = flags ?? '-h, --help';
        description = description ?? 'display help for command';
        this._helpOption = this.createOption(flags, description);
        return this;
      }
      /**
       * Lazy create help option.
       * Returns null if has been disabled with .helpOption(false).
       *
       * @returns {(Option | null)} the help option
       * @package
       */
      _getHelpOption() {
        if (this._helpOption === void 0) {
          this.helpOption(void 0, void 0);
        }
        return this._helpOption;
      }
      /**
       * Supply your own option to use for the built-in help option.
       * This is an alternative to using helpOption() to customise the flags and description etc.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addHelpOption(option) {
        this._helpOption = option;
        return this;
      }
      /**
       * Output help information and exit.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      help(contextOptions) {
        this.outputHelp(contextOptions);
        let exitCode = Number(process10.exitCode ?? 0);
        if (exitCode === 0 && contextOptions && typeof contextOptions !== 'function' && contextOptions.error) {
          exitCode = 1;
        }
        this._exit(exitCode, 'commander.help', '(outputHelp)');
      }
      /**
       * // Do a little typing to coordinate emit and listener for the help text events.
       * @typedef HelpTextEventContext
       * @type {object}
       * @property {boolean} error
       * @property {Command} command
       * @property {function} write
       */
      /**
       * Add additional text to be displayed with the built-in help.
       *
       * Position is 'before' or 'after' to affect just this command,
       * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
       *
       * @param {string} position - before or after built-in help
       * @param {(string | Function)} text - string to add, or a function returning a string
       * @return {Command} `this` command for chaining
       */
      addHelpText(position, text) {
        const allowedValues = ['beforeAll', 'before', 'after', 'afterAll'];
        if (!allowedValues.includes(position)) {
          throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        const helpEvent = `${position}Help`;
        this.on(helpEvent, (context) => {
          let helpStr;
          if (typeof text === 'function') {
            helpStr = text({ error: context.error, command: context.command });
          } else {
            helpStr = text;
          }
          if (helpStr) {
            context.write(`${helpStr}
`);
          }
        });
        return this;
      }
      /**
       * Output help information if help flags specified
       *
       * @param {Array} args - array of options to search for help flags
       * @private
       */
      _outputHelpIfRequested(args) {
        const helpOption = this._getHelpOption();
        const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
        if (helpRequested) {
          this.outputHelp();
          this._exit(0, 'commander.helpDisplayed', '(outputHelp)');
        }
      }
    };
    function incrementNodeInspectorPort(args) {
      return args.map((arg) => {
        if (!arg.startsWith('--inspect')) {
          return arg;
        }
        let debugOption;
        let debugHost = '127.0.0.1';
        let debugPort = '9229';
        let match;
        if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
          debugOption = match[1];
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
          debugOption = match[1];
          if (/^\d+$/.test(match[3])) {
            debugPort = match[3];
          } else {
            debugHost = match[3];
          }
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
          debugOption = match[1];
          debugHost = match[3];
          debugPort = match[4];
        }
        if (debugOption && debugPort !== '0') {
          return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
        }
        return arg;
      });
    }
    function useColor() {
      if (process10.env.NO_COLOR || process10.env.FORCE_COLOR === '0' || process10.env.FORCE_COLOR === 'false')
        return false;
      if (process10.env.FORCE_COLOR || process10.env.CLICOLOR_FORCE !== void 0) return true;
      return void 0;
    }
    exports2.Command = Command2;
    exports2.useColor = useColor;
  },
});

// node_modules/commander/index.js
var require_commander = __commonJS({
  'node_modules/commander/index.js'(exports2) {
    var { Argument: Argument2 } = require_argument();
    var { Command: Command2 } = require_command();
    var { CommanderError: CommanderError2, InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var { Help: Help2 } = require_help();
    var { Option: Option2 } = require_option();
    exports2.program = new Command2();
    exports2.createCommand = (name) => new Command2(name);
    exports2.createOption = (flags, description) => new Option2(flags, description);
    exports2.createArgument = (name, description) => new Argument2(name, description);
    exports2.Command = Command2;
    exports2.Option = Option2;
    exports2.Argument = Argument2;
    exports2.Help = Help2;
    exports2.CommanderError = CommanderError2;
    exports2.InvalidArgumentError = InvalidArgumentError2;
    exports2.InvalidOptionArgumentError = InvalidArgumentError2;
  },
});

// node_modules/cli-spinners/spinners.json
var require_spinners = __commonJS({
  'node_modules/cli-spinners/spinners.json'(exports2, module2) {
    module2.exports = {
      dots: {
        interval: 80,
        frames: ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F'],
      },
      dots2: {
        interval: 80,
        frames: ['\u28FE', '\u28FD', '\u28FB', '\u28BF', '\u287F', '\u28DF', '\u28EF', '\u28F7'],
      },
      dots3: {
        interval: 80,
        frames: ['\u280B', '\u2819', '\u281A', '\u281E', '\u2816', '\u2826', '\u2834', '\u2832', '\u2833', '\u2813'],
      },
      dots4: {
        interval: 80,
        frames: [
          '\u2804',
          '\u2806',
          '\u2807',
          '\u280B',
          '\u2819',
          '\u2838',
          '\u2830',
          '\u2820',
          '\u2830',
          '\u2838',
          '\u2819',
          '\u280B',
          '\u2807',
          '\u2806',
        ],
      },
      dots5: {
        interval: 80,
        frames: [
          '\u280B',
          '\u2819',
          '\u281A',
          '\u2812',
          '\u2802',
          '\u2802',
          '\u2812',
          '\u2832',
          '\u2834',
          '\u2826',
          '\u2816',
          '\u2812',
          '\u2810',
          '\u2810',
          '\u2812',
          '\u2813',
          '\u280B',
        ],
      },
      dots6: {
        interval: 80,
        frames: [
          '\u2801',
          '\u2809',
          '\u2819',
          '\u281A',
          '\u2812',
          '\u2802',
          '\u2802',
          '\u2812',
          '\u2832',
          '\u2834',
          '\u2824',
          '\u2804',
          '\u2804',
          '\u2824',
          '\u2834',
          '\u2832',
          '\u2812',
          '\u2802',
          '\u2802',
          '\u2812',
          '\u281A',
          '\u2819',
          '\u2809',
          '\u2801',
        ],
      },
      dots7: {
        interval: 80,
        frames: [
          '\u2808',
          '\u2809',
          '\u280B',
          '\u2813',
          '\u2812',
          '\u2810',
          '\u2810',
          '\u2812',
          '\u2816',
          '\u2826',
          '\u2824',
          '\u2820',
          '\u2820',
          '\u2824',
          '\u2826',
          '\u2816',
          '\u2812',
          '\u2810',
          '\u2810',
          '\u2812',
          '\u2813',
          '\u280B',
          '\u2809',
          '\u2808',
        ],
      },
      dots8: {
        interval: 80,
        frames: [
          '\u2801',
          '\u2801',
          '\u2809',
          '\u2819',
          '\u281A',
          '\u2812',
          '\u2802',
          '\u2802',
          '\u2812',
          '\u2832',
          '\u2834',
          '\u2824',
          '\u2804',
          '\u2804',
          '\u2824',
          '\u2820',
          '\u2820',
          '\u2824',
          '\u2826',
          '\u2816',
          '\u2812',
          '\u2810',
          '\u2810',
          '\u2812',
          '\u2813',
          '\u280B',
          '\u2809',
          '\u2808',
          '\u2808',
        ],
      },
      dots9: {
        interval: 80,
        frames: ['\u28B9', '\u28BA', '\u28BC', '\u28F8', '\u28C7', '\u2867', '\u2857', '\u284F'],
      },
      dots10: {
        interval: 80,
        frames: ['\u2884', '\u2882', '\u2881', '\u2841', '\u2848', '\u2850', '\u2860'],
      },
      dots11: {
        interval: 100,
        frames: ['\u2801', '\u2802', '\u2804', '\u2840', '\u2880', '\u2820', '\u2810', '\u2808'],
      },
      dots12: {
        interval: 80,
        frames: [
          '\u2880\u2800',
          '\u2840\u2800',
          '\u2804\u2800',
          '\u2882\u2800',
          '\u2842\u2800',
          '\u2805\u2800',
          '\u2883\u2800',
          '\u2843\u2800',
          '\u280D\u2800',
          '\u288B\u2800',
          '\u284B\u2800',
          '\u280D\u2801',
          '\u288B\u2801',
          '\u284B\u2801',
          '\u280D\u2809',
          '\u280B\u2809',
          '\u280B\u2809',
          '\u2809\u2819',
          '\u2809\u2819',
          '\u2809\u2829',
          '\u2808\u2899',
          '\u2808\u2859',
          '\u2888\u2829',
          '\u2840\u2899',
          '\u2804\u2859',
          '\u2882\u2829',
          '\u2842\u2898',
          '\u2805\u2858',
          '\u2883\u2828',
          '\u2843\u2890',
          '\u280D\u2850',
          '\u288B\u2820',
          '\u284B\u2880',
          '\u280D\u2841',
          '\u288B\u2801',
          '\u284B\u2801',
          '\u280D\u2809',
          '\u280B\u2809',
          '\u280B\u2809',
          '\u2809\u2819',
          '\u2809\u2819',
          '\u2809\u2829',
          '\u2808\u2899',
          '\u2808\u2859',
          '\u2808\u2829',
          '\u2800\u2899',
          '\u2800\u2859',
          '\u2800\u2829',
          '\u2800\u2898',
          '\u2800\u2858',
          '\u2800\u2828',
          '\u2800\u2890',
          '\u2800\u2850',
          '\u2800\u2820',
          '\u2800\u2880',
          '\u2800\u2840',
        ],
      },
      dots13: {
        interval: 80,
        frames: ['\u28FC', '\u28F9', '\u28BB', '\u283F', '\u285F', '\u28CF', '\u28E7', '\u28F6'],
      },
      dots8Bit: {
        interval: 80,
        frames: [
          '\u2800',
          '\u2801',
          '\u2802',
          '\u2803',
          '\u2804',
          '\u2805',
          '\u2806',
          '\u2807',
          '\u2840',
          '\u2841',
          '\u2842',
          '\u2843',
          '\u2844',
          '\u2845',
          '\u2846',
          '\u2847',
          '\u2808',
          '\u2809',
          '\u280A',
          '\u280B',
          '\u280C',
          '\u280D',
          '\u280E',
          '\u280F',
          '\u2848',
          '\u2849',
          '\u284A',
          '\u284B',
          '\u284C',
          '\u284D',
          '\u284E',
          '\u284F',
          '\u2810',
          '\u2811',
          '\u2812',
          '\u2813',
          '\u2814',
          '\u2815',
          '\u2816',
          '\u2817',
          '\u2850',
          '\u2851',
          '\u2852',
          '\u2853',
          '\u2854',
          '\u2855',
          '\u2856',
          '\u2857',
          '\u2818',
          '\u2819',
          '\u281A',
          '\u281B',
          '\u281C',
          '\u281D',
          '\u281E',
          '\u281F',
          '\u2858',
          '\u2859',
          '\u285A',
          '\u285B',
          '\u285C',
          '\u285D',
          '\u285E',
          '\u285F',
          '\u2820',
          '\u2821',
          '\u2822',
          '\u2823',
          '\u2824',
          '\u2825',
          '\u2826',
          '\u2827',
          '\u2860',
          '\u2861',
          '\u2862',
          '\u2863',
          '\u2864',
          '\u2865',
          '\u2866',
          '\u2867',
          '\u2828',
          '\u2829',
          '\u282A',
          '\u282B',
          '\u282C',
          '\u282D',
          '\u282E',
          '\u282F',
          '\u2868',
          '\u2869',
          '\u286A',
          '\u286B',
          '\u286C',
          '\u286D',
          '\u286E',
          '\u286F',
          '\u2830',
          '\u2831',
          '\u2832',
          '\u2833',
          '\u2834',
          '\u2835',
          '\u2836',
          '\u2837',
          '\u2870',
          '\u2871',
          '\u2872',
          '\u2873',
          '\u2874',
          '\u2875',
          '\u2876',
          '\u2877',
          '\u2838',
          '\u2839',
          '\u283A',
          '\u283B',
          '\u283C',
          '\u283D',
          '\u283E',
          '\u283F',
          '\u2878',
          '\u2879',
          '\u287A',
          '\u287B',
          '\u287C',
          '\u287D',
          '\u287E',
          '\u287F',
          '\u2880',
          '\u2881',
          '\u2882',
          '\u2883',
          '\u2884',
          '\u2885',
          '\u2886',
          '\u2887',
          '\u28C0',
          '\u28C1',
          '\u28C2',
          '\u28C3',
          '\u28C4',
          '\u28C5',
          '\u28C6',
          '\u28C7',
          '\u2888',
          '\u2889',
          '\u288A',
          '\u288B',
          '\u288C',
          '\u288D',
          '\u288E',
          '\u288F',
          '\u28C8',
          '\u28C9',
          '\u28CA',
          '\u28CB',
          '\u28CC',
          '\u28CD',
          '\u28CE',
          '\u28CF',
          '\u2890',
          '\u2891',
          '\u2892',
          '\u2893',
          '\u2894',
          '\u2895',
          '\u2896',
          '\u2897',
          '\u28D0',
          '\u28D1',
          '\u28D2',
          '\u28D3',
          '\u28D4',
          '\u28D5',
          '\u28D6',
          '\u28D7',
          '\u2898',
          '\u2899',
          '\u289A',
          '\u289B',
          '\u289C',
          '\u289D',
          '\u289E',
          '\u289F',
          '\u28D8',
          '\u28D9',
          '\u28DA',
          '\u28DB',
          '\u28DC',
          '\u28DD',
          '\u28DE',
          '\u28DF',
          '\u28A0',
          '\u28A1',
          '\u28A2',
          '\u28A3',
          '\u28A4',
          '\u28A5',
          '\u28A6',
          '\u28A7',
          '\u28E0',
          '\u28E1',
          '\u28E2',
          '\u28E3',
          '\u28E4',
          '\u28E5',
          '\u28E6',
          '\u28E7',
          '\u28A8',
          '\u28A9',
          '\u28AA',
          '\u28AB',
          '\u28AC',
          '\u28AD',
          '\u28AE',
          '\u28AF',
          '\u28E8',
          '\u28E9',
          '\u28EA',
          '\u28EB',
          '\u28EC',
          '\u28ED',
          '\u28EE',
          '\u28EF',
          '\u28B0',
          '\u28B1',
          '\u28B2',
          '\u28B3',
          '\u28B4',
          '\u28B5',
          '\u28B6',
          '\u28B7',
          '\u28F0',
          '\u28F1',
          '\u28F2',
          '\u28F3',
          '\u28F4',
          '\u28F5',
          '\u28F6',
          '\u28F7',
          '\u28B8',
          '\u28B9',
          '\u28BA',
          '\u28BB',
          '\u28BC',
          '\u28BD',
          '\u28BE',
          '\u28BF',
          '\u28F8',
          '\u28F9',
          '\u28FA',
          '\u28FB',
          '\u28FC',
          '\u28FD',
          '\u28FE',
          '\u28FF',
        ],
      },
      sand: {
        interval: 80,
        frames: [
          '\u2801',
          '\u2802',
          '\u2804',
          '\u2840',
          '\u2848',
          '\u2850',
          '\u2860',
          '\u28C0',
          '\u28C1',
          '\u28C2',
          '\u28C4',
          '\u28CC',
          '\u28D4',
          '\u28E4',
          '\u28E5',
          '\u28E6',
          '\u28EE',
          '\u28F6',
          '\u28F7',
          '\u28FF',
          '\u287F',
          '\u283F',
          '\u289F',
          '\u281F',
          '\u285B',
          '\u281B',
          '\u282B',
          '\u288B',
          '\u280B',
          '\u280D',
          '\u2849',
          '\u2809',
          '\u2811',
          '\u2821',
          '\u2881',
        ],
      },
      line: {
        interval: 130,
        frames: ['-', '\\', '|', '/'],
      },
      line2: {
        interval: 100,
        frames: ['\u2802', '-', '\u2013', '\u2014', '\u2013', '-'],
      },
      pipe: {
        interval: 100,
        frames: ['\u2524', '\u2518', '\u2534', '\u2514', '\u251C', '\u250C', '\u252C', '\u2510'],
      },
      simpleDots: {
        interval: 400,
        frames: ['.  ', '.. ', '...', '   '],
      },
      simpleDotsScrolling: {
        interval: 200,
        frames: ['.  ', '.. ', '...', ' ..', '  .', '   '],
      },
      star: {
        interval: 70,
        frames: ['\u2736', '\u2738', '\u2739', '\u273A', '\u2739', '\u2737'],
      },
      star2: {
        interval: 80,
        frames: ['+', 'x', '*'],
      },
      flip: {
        interval: 70,
        frames: ['_', '_', '_', '-', '`', '`', "'", '\xB4', '-', '_', '_', '_'],
      },
      hamburger: {
        interval: 100,
        frames: ['\u2631', '\u2632', '\u2634'],
      },
      growVertical: {
        interval: 120,
        frames: ['\u2581', '\u2583', '\u2584', '\u2585', '\u2586', '\u2587', '\u2586', '\u2585', '\u2584', '\u2583'],
      },
      growHorizontal: {
        interval: 120,
        frames: [
          '\u258F',
          '\u258E',
          '\u258D',
          '\u258C',
          '\u258B',
          '\u258A',
          '\u2589',
          '\u258A',
          '\u258B',
          '\u258C',
          '\u258D',
          '\u258E',
        ],
      },
      balloon: {
        interval: 140,
        frames: [' ', '.', 'o', 'O', '@', '*', ' '],
      },
      balloon2: {
        interval: 120,
        frames: ['.', 'o', 'O', '\xB0', 'O', 'o', '.'],
      },
      noise: {
        interval: 100,
        frames: ['\u2593', '\u2592', '\u2591'],
      },
      bounce: {
        interval: 120,
        frames: ['\u2801', '\u2802', '\u2804', '\u2802'],
      },
      boxBounce: {
        interval: 120,
        frames: ['\u2596', '\u2598', '\u259D', '\u2597'],
      },
      boxBounce2: {
        interval: 100,
        frames: ['\u258C', '\u2580', '\u2590', '\u2584'],
      },
      triangle: {
        interval: 50,
        frames: ['\u25E2', '\u25E3', '\u25E4', '\u25E5'],
      },
      binary: {
        interval: 80,
        frames: ['010010', '001100', '100101', '111010', '111101', '010111', '101011', '111000', '110011', '110101'],
      },
      arc: {
        interval: 100,
        frames: ['\u25DC', '\u25E0', '\u25DD', '\u25DE', '\u25E1', '\u25DF'],
      },
      circle: {
        interval: 120,
        frames: ['\u25E1', '\u2299', '\u25E0'],
      },
      squareCorners: {
        interval: 180,
        frames: ['\u25F0', '\u25F3', '\u25F2', '\u25F1'],
      },
      circleQuarters: {
        interval: 120,
        frames: ['\u25F4', '\u25F7', '\u25F6', '\u25F5'],
      },
      circleHalves: {
        interval: 50,
        frames: ['\u25D0', '\u25D3', '\u25D1', '\u25D2'],
      },
      squish: {
        interval: 100,
        frames: ['\u256B', '\u256A'],
      },
      toggle: {
        interval: 250,
        frames: ['\u22B6', '\u22B7'],
      },
      toggle2: {
        interval: 80,
        frames: ['\u25AB', '\u25AA'],
      },
      toggle3: {
        interval: 120,
        frames: ['\u25A1', '\u25A0'],
      },
      toggle4: {
        interval: 100,
        frames: ['\u25A0', '\u25A1', '\u25AA', '\u25AB'],
      },
      toggle5: {
        interval: 100,
        frames: ['\u25AE', '\u25AF'],
      },
      toggle6: {
        interval: 300,
        frames: ['\u101D', '\u1040'],
      },
      toggle7: {
        interval: 80,
        frames: ['\u29BE', '\u29BF'],
      },
      toggle8: {
        interval: 100,
        frames: ['\u25CD', '\u25CC'],
      },
      toggle9: {
        interval: 100,
        frames: ['\u25C9', '\u25CE'],
      },
      toggle10: {
        interval: 100,
        frames: ['\u3282', '\u3280', '\u3281'],
      },
      toggle11: {
        interval: 50,
        frames: ['\u29C7', '\u29C6'],
      },
      toggle12: {
        interval: 120,
        frames: ['\u2617', '\u2616'],
      },
      toggle13: {
        interval: 80,
        frames: ['=', '*', '-'],
      },
      arrow: {
        interval: 100,
        frames: ['\u2190', '\u2196', '\u2191', '\u2197', '\u2192', '\u2198', '\u2193', '\u2199'],
      },
      arrow2: {
        interval: 80,
        frames: [
          '\u2B06\uFE0F ',
          '\u2197\uFE0F ',
          '\u27A1\uFE0F ',
          '\u2198\uFE0F ',
          '\u2B07\uFE0F ',
          '\u2199\uFE0F ',
          '\u2B05\uFE0F ',
          '\u2196\uFE0F ',
        ],
      },
      arrow3: {
        interval: 120,
        frames: [
          '\u25B9\u25B9\u25B9\u25B9\u25B9',
          '\u25B8\u25B9\u25B9\u25B9\u25B9',
          '\u25B9\u25B8\u25B9\u25B9\u25B9',
          '\u25B9\u25B9\u25B8\u25B9\u25B9',
          '\u25B9\u25B9\u25B9\u25B8\u25B9',
          '\u25B9\u25B9\u25B9\u25B9\u25B8',
        ],
      },
      bouncingBar: {
        interval: 80,
        frames: [
          '[    ]',
          '[=   ]',
          '[==  ]',
          '[=== ]',
          '[====]',
          '[ ===]',
          '[  ==]',
          '[   =]',
          '[    ]',
          '[   =]',
          '[  ==]',
          '[ ===]',
          '[====]',
          '[=== ]',
          '[==  ]',
          '[=   ]',
        ],
      },
      bouncingBall: {
        interval: 80,
        frames: [
          '( \u25CF    )',
          '(  \u25CF   )',
          '(   \u25CF  )',
          '(    \u25CF )',
          '(     \u25CF)',
          '(    \u25CF )',
          '(   \u25CF  )',
          '(  \u25CF   )',
          '( \u25CF    )',
          '(\u25CF     )',
        ],
      },
      smiley: {
        interval: 200,
        frames: ['\u{1F604} ', '\u{1F61D} '],
      },
      monkey: {
        interval: 300,
        frames: ['\u{1F648} ', '\u{1F648} ', '\u{1F649} ', '\u{1F64A} '],
      },
      hearts: {
        interval: 100,
        frames: ['\u{1F49B} ', '\u{1F499} ', '\u{1F49C} ', '\u{1F49A} ', '\u2764\uFE0F '],
      },
      clock: {
        interval: 100,
        frames: [
          '\u{1F55B} ',
          '\u{1F550} ',
          '\u{1F551} ',
          '\u{1F552} ',
          '\u{1F553} ',
          '\u{1F554} ',
          '\u{1F555} ',
          '\u{1F556} ',
          '\u{1F557} ',
          '\u{1F558} ',
          '\u{1F559} ',
          '\u{1F55A} ',
        ],
      },
      earth: {
        interval: 180,
        frames: ['\u{1F30D} ', '\u{1F30E} ', '\u{1F30F} '],
      },
      material: {
        interval: 17,
        frames: [
          '\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581',
          '\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581',
          '\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581',
          '\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588',
          '\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588',
          '\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588',
          '\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588',
          '\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588',
          '\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588',
          '\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588',
          '\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581',
          '\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
          '\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581',
        ],
      },
      moon: {
        interval: 80,
        frames: [
          '\u{1F311} ',
          '\u{1F312} ',
          '\u{1F313} ',
          '\u{1F314} ',
          '\u{1F315} ',
          '\u{1F316} ',
          '\u{1F317} ',
          '\u{1F318} ',
        ],
      },
      runner: {
        interval: 140,
        frames: ['\u{1F6B6} ', '\u{1F3C3} '],
      },
      pong: {
        interval: 80,
        frames: [
          '\u2590\u2802       \u258C',
          '\u2590\u2808       \u258C',
          '\u2590 \u2802      \u258C',
          '\u2590 \u2820      \u258C',
          '\u2590  \u2840     \u258C',
          '\u2590  \u2820     \u258C',
          '\u2590   \u2802    \u258C',
          '\u2590   \u2808    \u258C',
          '\u2590    \u2802   \u258C',
          '\u2590    \u2820   \u258C',
          '\u2590     \u2840  \u258C',
          '\u2590     \u2820  \u258C',
          '\u2590      \u2802 \u258C',
          '\u2590      \u2808 \u258C',
          '\u2590       \u2802\u258C',
          '\u2590       \u2820\u258C',
          '\u2590       \u2840\u258C',
          '\u2590      \u2820 \u258C',
          '\u2590      \u2802 \u258C',
          '\u2590     \u2808  \u258C',
          '\u2590     \u2802  \u258C',
          '\u2590    \u2820   \u258C',
          '\u2590    \u2840   \u258C',
          '\u2590   \u2820    \u258C',
          '\u2590   \u2802    \u258C',
          '\u2590  \u2808     \u258C',
          '\u2590  \u2802     \u258C',
          '\u2590 \u2820      \u258C',
          '\u2590 \u2840      \u258C',
          '\u2590\u2820       \u258C',
        ],
      },
      shark: {
        interval: 120,
        frames: [
          '\u2590|\\____________\u258C',
          '\u2590_|\\___________\u258C',
          '\u2590__|\\__________\u258C',
          '\u2590___|\\_________\u258C',
          '\u2590____|\\________\u258C',
          '\u2590_____|\\_______\u258C',
          '\u2590______|\\______\u258C',
          '\u2590_______|\\_____\u258C',
          '\u2590________|\\____\u258C',
          '\u2590_________|\\___\u258C',
          '\u2590__________|\\__\u258C',
          '\u2590___________|\\_\u258C',
          '\u2590____________|\\\u258C',
          '\u2590____________/|\u258C',
          '\u2590___________/|_\u258C',
          '\u2590__________/|__\u258C',
          '\u2590_________/|___\u258C',
          '\u2590________/|____\u258C',
          '\u2590_______/|_____\u258C',
          '\u2590______/|______\u258C',
          '\u2590_____/|_______\u258C',
          '\u2590____/|________\u258C',
          '\u2590___/|_________\u258C',
          '\u2590__/|__________\u258C',
          '\u2590_/|___________\u258C',
          '\u2590/|____________\u258C',
        ],
      },
      dqpb: {
        interval: 100,
        frames: ['d', 'q', 'p', 'b'],
      },
      weather: {
        interval: 100,
        frames: [
          '\u2600\uFE0F ',
          '\u2600\uFE0F ',
          '\u2600\uFE0F ',
          '\u{1F324} ',
          '\u26C5\uFE0F ',
          '\u{1F325} ',
          '\u2601\uFE0F ',
          '\u{1F327} ',
          '\u{1F328} ',
          '\u{1F327} ',
          '\u{1F328} ',
          '\u{1F327} ',
          '\u{1F328} ',
          '\u26C8 ',
          '\u{1F328} ',
          '\u{1F327} ',
          '\u{1F328} ',
          '\u2601\uFE0F ',
          '\u{1F325} ',
          '\u26C5\uFE0F ',
          '\u{1F324} ',
          '\u2600\uFE0F ',
          '\u2600\uFE0F ',
        ],
      },
      christmas: {
        interval: 400,
        frames: ['\u{1F332}', '\u{1F384}'],
      },
      grenade: {
        interval: 80,
        frames: [
          '\u060C  ',
          '\u2032  ',
          ' \xB4 ',
          ' \u203E ',
          '  \u2E0C',
          '  \u2E0A',
          '  |',
          '  \u204E',
          '  \u2055',
          ' \u0DF4 ',
          '  \u2053',
          '   ',
          '   ',
          '   ',
        ],
      },
      point: {
        interval: 125,
        frames: [
          '\u2219\u2219\u2219',
          '\u25CF\u2219\u2219',
          '\u2219\u25CF\u2219',
          '\u2219\u2219\u25CF',
          '\u2219\u2219\u2219',
        ],
      },
      layer: {
        interval: 150,
        frames: ['-', '=', '\u2261'],
      },
      betaWave: {
        interval: 80,
        frames: [
          '\u03C1\u03B2\u03B2\u03B2\u03B2\u03B2\u03B2',
          '\u03B2\u03C1\u03B2\u03B2\u03B2\u03B2\u03B2',
          '\u03B2\u03B2\u03C1\u03B2\u03B2\u03B2\u03B2',
          '\u03B2\u03B2\u03B2\u03C1\u03B2\u03B2\u03B2',
          '\u03B2\u03B2\u03B2\u03B2\u03C1\u03B2\u03B2',
          '\u03B2\u03B2\u03B2\u03B2\u03B2\u03C1\u03B2',
          '\u03B2\u03B2\u03B2\u03B2\u03B2\u03B2\u03C1',
        ],
      },
      fingerDance: {
        interval: 160,
        frames: ['\u{1F918} ', '\u{1F91F} ', '\u{1F596} ', '\u270B ', '\u{1F91A} ', '\u{1F446} '],
      },
      fistBump: {
        interval: 80,
        frames: [
          '\u{1F91C}\u3000\u3000\u3000\u3000\u{1F91B} ',
          '\u{1F91C}\u3000\u3000\u3000\u3000\u{1F91B} ',
          '\u{1F91C}\u3000\u3000\u3000\u3000\u{1F91B} ',
          '\u3000\u{1F91C}\u3000\u3000\u{1F91B}\u3000 ',
          '\u3000\u3000\u{1F91C}\u{1F91B}\u3000\u3000 ',
          '\u3000\u{1F91C}\u2728\u{1F91B}\u3000\u3000 ',
          '\u{1F91C}\u3000\u2728\u3000\u{1F91B}\u3000 ',
        ],
      },
      soccerHeader: {
        interval: 80,
        frames: [
          ' \u{1F9D1}\u26BD\uFE0F       \u{1F9D1} ',
          '\u{1F9D1}  \u26BD\uFE0F      \u{1F9D1} ',
          '\u{1F9D1}   \u26BD\uFE0F     \u{1F9D1} ',
          '\u{1F9D1}    \u26BD\uFE0F    \u{1F9D1} ',
          '\u{1F9D1}     \u26BD\uFE0F   \u{1F9D1} ',
          '\u{1F9D1}      \u26BD\uFE0F  \u{1F9D1} ',
          '\u{1F9D1}       \u26BD\uFE0F\u{1F9D1}  ',
          '\u{1F9D1}      \u26BD\uFE0F  \u{1F9D1} ',
          '\u{1F9D1}     \u26BD\uFE0F   \u{1F9D1} ',
          '\u{1F9D1}    \u26BD\uFE0F    \u{1F9D1} ',
          '\u{1F9D1}   \u26BD\uFE0F     \u{1F9D1} ',
          '\u{1F9D1}  \u26BD\uFE0F      \u{1F9D1} ',
        ],
      },
      mindblown: {
        interval: 160,
        frames: [
          '\u{1F610} ',
          '\u{1F610} ',
          '\u{1F62E} ',
          '\u{1F62E} ',
          '\u{1F626} ',
          '\u{1F626} ',
          '\u{1F627} ',
          '\u{1F627} ',
          '\u{1F92F} ',
          '\u{1F4A5} ',
          '\u2728 ',
          '\u3000 ',
          '\u3000 ',
          '\u3000 ',
        ],
      },
      speaker: {
        interval: 160,
        frames: ['\u{1F508} ', '\u{1F509} ', '\u{1F50A} ', '\u{1F509} '],
      },
      orangePulse: {
        interval: 100,
        frames: ['\u{1F538} ', '\u{1F536} ', '\u{1F7E0} ', '\u{1F7E0} ', '\u{1F536} '],
      },
      bluePulse: {
        interval: 100,
        frames: ['\u{1F539} ', '\u{1F537} ', '\u{1F535} ', '\u{1F535} ', '\u{1F537} '],
      },
      orangeBluePulse: {
        interval: 100,
        frames: [
          '\u{1F538} ',
          '\u{1F536} ',
          '\u{1F7E0} ',
          '\u{1F7E0} ',
          '\u{1F536} ',
          '\u{1F539} ',
          '\u{1F537} ',
          '\u{1F535} ',
          '\u{1F535} ',
          '\u{1F537} ',
        ],
      },
      timeTravel: {
        interval: 100,
        frames: [
          '\u{1F55B} ',
          '\u{1F55A} ',
          '\u{1F559} ',
          '\u{1F558} ',
          '\u{1F557} ',
          '\u{1F556} ',
          '\u{1F555} ',
          '\u{1F554} ',
          '\u{1F553} ',
          '\u{1F552} ',
          '\u{1F551} ',
          '\u{1F550} ',
        ],
      },
      aesthetic: {
        interval: 80,
        frames: [
          '\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1\u25B1',
          '\u25B0\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1',
          '\u25B0\u25B0\u25B0\u25B1\u25B1\u25B1\u25B1',
          '\u25B0\u25B0\u25B0\u25B0\u25B1\u25B1\u25B1',
          '\u25B0\u25B0\u25B0\u25B0\u25B0\u25B1\u25B1',
          '\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B1',
          '\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0',
          '\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1\u25B1',
        ],
      },
      dwarfFortress: {
        interval: 80,
        frames: [
          ' \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '\u263A\u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '\u263A\u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '\u263A\u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '\u263A\u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '\u263A\u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '\u263A\u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '\u263A\u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '\u263A\u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '\u263A \u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u263A\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u263A\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u263A\u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u263A\u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u263A\u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u263A\u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u263A\u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u263A\u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u263A \u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u263A\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u263A\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u263A\u2593\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u263A\u2593\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u263A\u2592\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u263A\u2592\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u263A\u2591\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u263A\u2591\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u263A \u2588\u2588\u2588\xA3\xA3\xA3  ',
          '   \u263A\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '   \u263A\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '   \u263A\u2593\u2588\u2588\xA3\xA3\xA3  ',
          '   \u263A\u2593\u2588\u2588\xA3\xA3\xA3  ',
          '   \u263A\u2592\u2588\u2588\xA3\xA3\xA3  ',
          '   \u263A\u2592\u2588\u2588\xA3\xA3\xA3  ',
          '   \u263A\u2591\u2588\u2588\xA3\xA3\xA3  ',
          '   \u263A\u2591\u2588\u2588\xA3\xA3\xA3  ',
          '   \u263A \u2588\u2588\xA3\xA3\xA3  ',
          '    \u263A\u2588\u2588\xA3\xA3\xA3  ',
          '    \u263A\u2588\u2588\xA3\xA3\xA3  ',
          '    \u263A\u2593\u2588\xA3\xA3\xA3  ',
          '    \u263A\u2593\u2588\xA3\xA3\xA3  ',
          '    \u263A\u2592\u2588\xA3\xA3\xA3  ',
          '    \u263A\u2592\u2588\xA3\xA3\xA3  ',
          '    \u263A\u2591\u2588\xA3\xA3\xA3  ',
          '    \u263A\u2591\u2588\xA3\xA3\xA3  ',
          '    \u263A \u2588\xA3\xA3\xA3  ',
          '     \u263A\u2588\xA3\xA3\xA3  ',
          '     \u263A\u2588\xA3\xA3\xA3  ',
          '     \u263A\u2593\xA3\xA3\xA3  ',
          '     \u263A\u2593\xA3\xA3\xA3  ',
          '     \u263A\u2592\xA3\xA3\xA3  ',
          '     \u263A\u2592\xA3\xA3\xA3  ',
          '     \u263A\u2591\xA3\xA3\xA3  ',
          '     \u263A\u2591\xA3\xA3\xA3  ',
          '     \u263A \xA3\xA3\xA3  ',
          '      \u263A\xA3\xA3\xA3  ',
          '      \u263A\xA3\xA3\xA3  ',
          '      \u263A\u2593\xA3\xA3  ',
          '      \u263A\u2593\xA3\xA3  ',
          '      \u263A\u2592\xA3\xA3  ',
          '      \u263A\u2592\xA3\xA3  ',
          '      \u263A\u2591\xA3\xA3  ',
          '      \u263A\u2591\xA3\xA3  ',
          '      \u263A \xA3\xA3  ',
          '       \u263A\xA3\xA3  ',
          '       \u263A\xA3\xA3  ',
          '       \u263A\u2593\xA3  ',
          '       \u263A\u2593\xA3  ',
          '       \u263A\u2592\xA3  ',
          '       \u263A\u2592\xA3  ',
          '       \u263A\u2591\xA3  ',
          '       \u263A\u2591\xA3  ',
          '       \u263A \xA3  ',
          '        \u263A\xA3  ',
          '        \u263A\xA3  ',
          '        \u263A\u2593  ',
          '        \u263A\u2593  ',
          '        \u263A\u2592  ',
          '        \u263A\u2592  ',
          '        \u263A\u2591  ',
          '        \u263A\u2591  ',
          '        \u263A   ',
          '        \u263A  &',
          '        \u263A \u263C&',
          '       \u263A \u263C &',
          '       \u263A\u263C  &',
          '      \u263A\u263C  & ',
          '      \u203C   & ',
          '     \u263A   &  ',
          '    \u203C    &  ',
          '   \u263A    &   ',
          '  \u203C     &   ',
          ' \u263A     &    ',
          '\u203C      &    ',
          '      &     ',
          '      &     ',
          '     &   \u2591  ',
          '     &   \u2592  ',
          '    &    \u2593  ',
          '    &    \xA3  ',
          '   &    \u2591\xA3  ',
          '   &    \u2592\xA3  ',
          '  &     \u2593\xA3  ',
          '  &     \xA3\xA3  ',
          ' &     \u2591\xA3\xA3  ',
          ' &     \u2592\xA3\xA3  ',
          '&      \u2593\xA3\xA3  ',
          '&      \xA3\xA3\xA3  ',
          '      \u2591\xA3\xA3\xA3  ',
          '      \u2592\xA3\xA3\xA3  ',
          '      \u2593\xA3\xA3\xA3  ',
          '      \u2588\xA3\xA3\xA3  ',
          '     \u2591\u2588\xA3\xA3\xA3  ',
          '     \u2592\u2588\xA3\xA3\xA3  ',
          '     \u2593\u2588\xA3\xA3\xA3  ',
          '     \u2588\u2588\xA3\xA3\xA3  ',
          '    \u2591\u2588\u2588\xA3\xA3\xA3  ',
          '    \u2592\u2588\u2588\xA3\xA3\xA3  ',
          '    \u2593\u2588\u2588\xA3\xA3\xA3  ',
          '    \u2588\u2588\u2588\xA3\xA3\xA3  ',
          '   \u2591\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '   \u2592\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '   \u2593\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '   \u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          '  \u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
          ' \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ',
        ],
      },
    };
  },
});

// node_modules/cli-spinners/index.js
var require_cli_spinners = __commonJS({
  'node_modules/cli-spinners/index.js'(exports2, module2) {
    'use strict';
    var spinners = Object.assign({}, require_spinners());
    var spinnersList = Object.keys(spinners);
    Object.defineProperty(spinners, 'random', {
      get() {
        const randomIndex = Math.floor(Math.random() * spinnersList.length);
        const spinnerName = spinnersList[randomIndex];
        return spinners[spinnerName];
      },
    });
    module2.exports = spinners;
  },
});

// node_modules/ora/node_modules/emoji-regex/index.js
var require_emoji_regex = __commonJS({
  'node_modules/ora/node_modules/emoji-regex/index.js'(exports2, module2) {
    module2.exports = () => {
      return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC2\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
    };
  },
});

// scripts/update-changelog/update-changelog.mjs
var update_changelog_exports = {};
__export(update_changelog_exports, {
  preCommit: () => preCommit,
});
module.exports = __toCommonJS(update_changelog_exports);
var import_fs = __toESM(require('fs'), 1);
var import_url = require('url');
var import_semver2 = __toESM(require_semver2(), 1);

// node_modules/ky/distribution/errors/HTTPError.js
var HTTPError = class extends Error {
  response;
  request;
  options;
  constructor(response, request2, options2) {
    const code = response.status || response.status === 0 ? response.status : '';
    const title = response.statusText || '';
    const status = `${code} ${title}`.trim();
    const reason = status ? `status code ${status}` : 'an unknown error';
    super(`Request failed with ${reason}: ${request2.method} ${request2.url}`);
    this.name = 'HTTPError';
    this.response = response;
    this.request = request2;
    this.options = options2;
  }
};

// node_modules/ky/distribution/errors/TimeoutError.js
var TimeoutError = class extends Error {
  request;
  constructor(request2) {
    super(`Request timed out: ${request2.method} ${request2.url}`);
    this.name = 'TimeoutError';
    this.request = request2;
  }
};

// node_modules/ky/distribution/core/constants.js
var supportsRequestStreams = (() => {
  let duplexAccessed = false;
  let hasContentType = false;
  const supportsReadableStream = typeof globalThis.ReadableStream === 'function';
  const supportsRequest = typeof globalThis.Request === 'function';
  if (supportsReadableStream && supportsRequest) {
    try {
      hasContentType = new globalThis.Request('https://empty.invalid', {
        body: new globalThis.ReadableStream(),
        method: 'POST',
        // @ts-expect-error - Types are outdated.
        get duplex() {
          duplexAccessed = true;
          return 'half';
        },
      }).headers.has('Content-Type');
    } catch (error) {
      if (error instanceof Error && error.message === 'unsupported BodyInit type') {
        return false;
      }
      throw error;
    }
  }
  return duplexAccessed && !hasContentType;
})();
var supportsAbortController = typeof globalThis.AbortController === 'function';
var supportsResponseStreams = typeof globalThis.ReadableStream === 'function';
var supportsFormData = typeof globalThis.FormData === 'function';
var requestMethods = ['get', 'post', 'put', 'patch', 'head', 'delete'];
var validate = () => void 0;
validate();
var responseTypes = {
  json: 'application/json',
  text: 'text/*',
  formData: 'multipart/form-data',
  arrayBuffer: '*/*',
  blob: '*/*',
};
var maxSafeTimeout = 2147483647;
var usualFormBoundarySize = new TextEncoder().encode('------WebKitFormBoundaryaxpyiPgbbPti10Rw').length;
var stop = Symbol('stop');
var kyOptionKeys = {
  json: true,
  parseJson: true,
  stringifyJson: true,
  searchParams: true,
  prefixUrl: true,
  retry: true,
  timeout: true,
  hooks: true,
  throwHttpErrors: true,
  onDownloadProgress: true,
  onUploadProgress: true,
  fetch: true,
};
var requestOptionsRegistry = {
  method: true,
  headers: true,
  body: true,
  mode: true,
  credentials: true,
  cache: true,
  redirect: true,
  referrer: true,
  referrerPolicy: true,
  integrity: true,
  keepalive: true,
  signal: true,
  window: true,
  dispatcher: true,
  duplex: true,
  priority: true,
};

// node_modules/ky/distribution/utils/body.js
var getBodySize = (body) => {
  if (!body) {
    return 0;
  }
  if (body instanceof FormData) {
    let size = 0;
    for (const [key, value] of body) {
      size += usualFormBoundarySize;
      size += new TextEncoder().encode(`Content-Disposition: form-data; name="${key}"`).length;
      size += typeof value === 'string' ? new TextEncoder().encode(value).length : value.size;
    }
    return size;
  }
  if (body instanceof Blob) {
    return body.size;
  }
  if (body instanceof ArrayBuffer) {
    return body.byteLength;
  }
  if (typeof body === 'string') {
    return new TextEncoder().encode(body).length;
  }
  if (body instanceof URLSearchParams) {
    return new TextEncoder().encode(body.toString()).length;
  }
  if ('byteLength' in body) {
    return body.byteLength;
  }
  if (typeof body === 'object' && body !== null) {
    try {
      const jsonString = JSON.stringify(body);
      return new TextEncoder().encode(jsonString).length;
    } catch {
      return 0;
    }
  }
  return 0;
};
var streamResponse = (response, onDownloadProgress) => {
  const totalBytes = Number(response.headers.get('content-length')) || 0;
  let transferredBytes = 0;
  if (response.status === 204) {
    if (onDownloadProgress) {
      onDownloadProgress({ percent: 1, totalBytes, transferredBytes }, new Uint8Array());
    }
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
  return new Response(
    new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        if (onDownloadProgress) {
          onDownloadProgress({ percent: 0, transferredBytes: 0, totalBytes }, new Uint8Array());
        }
        async function read() {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          if (onDownloadProgress) {
            transferredBytes += value.byteLength;
            const percent = totalBytes === 0 ? 0 : transferredBytes / totalBytes;
            onDownloadProgress({ percent, transferredBytes, totalBytes }, value);
          }
          controller.enqueue(value);
          await read();
        }
        await read();
      },
    }),
    {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    },
  );
};
var streamRequest = (request2, onUploadProgress) => {
  const totalBytes = getBodySize(request2.body);
  let transferredBytes = 0;
  return new Request(request2, {
    // @ts-expect-error - Types are outdated.
    duplex: 'half',
    body: new ReadableStream({
      async start(controller) {
        const reader =
          request2.body instanceof ReadableStream ? request2.body.getReader() : new Response('').body.getReader();
        async function read() {
          const { done, value } = await reader.read();
          if (done) {
            if (onUploadProgress) {
              onUploadProgress(
                { percent: 1, transferredBytes, totalBytes: Math.max(totalBytes, transferredBytes) },
                new Uint8Array(),
              );
            }
            controller.close();
            return;
          }
          transferredBytes += value.byteLength;
          let percent = totalBytes === 0 ? 0 : transferredBytes / totalBytes;
          if (totalBytes < transferredBytes || percent === 1) {
            percent = 0.99;
          }
          if (onUploadProgress) {
            onUploadProgress({ percent: Number(percent.toFixed(2)), transferredBytes, totalBytes }, value);
          }
          controller.enqueue(value);
          await read();
        }
        await read();
      },
    }),
  });
};

// node_modules/ky/distribution/utils/is.js
var isObject = (value) => value !== null && typeof value === 'object';

// node_modules/ky/distribution/utils/merge.js
var validateAndMerge = (...sources) => {
  for (const source of sources) {
    if ((!isObject(source) || Array.isArray(source)) && source !== void 0) {
      throw new TypeError('The `options` argument must be an object');
    }
  }
  return deepMerge({}, ...sources);
};
var mergeHeaders = (source1 = {}, source2 = {}) => {
  const result = new globalThis.Headers(source1);
  const isHeadersInstance = source2 instanceof globalThis.Headers;
  const source = new globalThis.Headers(source2);
  for (const [key, value] of source.entries()) {
    if ((isHeadersInstance && value === 'undefined') || value === void 0) {
      result.delete(key);
    } else {
      result.set(key, value);
    }
  }
  return result;
};
function newHookValue(original, incoming, property) {
  return Object.hasOwn(incoming, property) && incoming[property] === void 0
    ? []
    : deepMerge(original[property] ?? [], incoming[property] ?? []);
}
var mergeHooks = (original = {}, incoming = {}) => ({
  beforeRequest: newHookValue(original, incoming, 'beforeRequest'),
  beforeRetry: newHookValue(original, incoming, 'beforeRetry'),
  afterResponse: newHookValue(original, incoming, 'afterResponse'),
  beforeError: newHookValue(original, incoming, 'beforeError'),
});
var deepMerge = (...sources) => {
  let returnValue = {};
  let headers = {};
  let hooks = {};
  for (const source of sources) {
    if (Array.isArray(source)) {
      if (!Array.isArray(returnValue)) {
        returnValue = [];
      }
      returnValue = [...returnValue, ...source];
    } else if (isObject(source)) {
      for (let [key, value] of Object.entries(source)) {
        if (isObject(value) && key in returnValue) {
          value = deepMerge(returnValue[key], value);
        }
        returnValue = { ...returnValue, [key]: value };
      }
      if (isObject(source.hooks)) {
        hooks = mergeHooks(hooks, source.hooks);
        returnValue.hooks = hooks;
      }
      if (isObject(source.headers)) {
        headers = mergeHeaders(headers, source.headers);
        returnValue.headers = headers;
      }
    }
  }
  return returnValue;
};

// node_modules/ky/distribution/utils/normalize.js
var normalizeRequestMethod = (input) => (requestMethods.includes(input) ? input.toUpperCase() : input);
var retryMethods = ['get', 'put', 'head', 'delete', 'options', 'trace'];
var retryStatusCodes = [408, 413, 429, 500, 502, 503, 504];
var retryAfterStatusCodes = [413, 429, 503];
var defaultRetryOptions = {
  limit: 2,
  methods: retryMethods,
  statusCodes: retryStatusCodes,
  afterStatusCodes: retryAfterStatusCodes,
  maxRetryAfter: Number.POSITIVE_INFINITY,
  backoffLimit: Number.POSITIVE_INFINITY,
  delay: (attemptCount) => 0.3 * 2 ** (attemptCount - 1) * 1e3,
};
var normalizeRetryOptions = (retry = {}) => {
  if (typeof retry === 'number') {
    return {
      ...defaultRetryOptions,
      limit: retry,
    };
  }
  if (retry.methods && !Array.isArray(retry.methods)) {
    throw new Error('retry.methods must be an array');
  }
  if (retry.statusCodes && !Array.isArray(retry.statusCodes)) {
    throw new Error('retry.statusCodes must be an array');
  }
  return {
    ...defaultRetryOptions,
    ...retry,
  };
};

// node_modules/ky/distribution/utils/timeout.js
async function timeout(request2, init, abortController, options2) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (abortController) {
        abortController.abort();
      }
      reject(new TimeoutError(request2));
    }, options2.timeout);
    void options2
      .fetch(request2, init)
      .then(resolve)
      .catch(reject)
      .then(() => {
        clearTimeout(timeoutId);
      });
  });
}

// node_modules/ky/distribution/utils/delay.js
async function delay(ms, { signal }) {
  return new Promise((resolve, reject) => {
    if (signal) {
      signal.throwIfAborted();
      signal.addEventListener('abort', abortHandler, { once: true });
    }
    function abortHandler() {
      clearTimeout(timeoutId);
      reject(signal.reason);
    }
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', abortHandler);
      resolve();
    }, ms);
  });
}

// node_modules/ky/distribution/utils/options.js
var findUnknownOptions = (request2, options2) => {
  const unknownOptions = {};
  for (const key in options2) {
    if (!(key in requestOptionsRegistry) && !(key in kyOptionKeys) && !(key in request2)) {
      unknownOptions[key] = options2[key];
    }
  }
  return unknownOptions;
};

// node_modules/ky/distribution/core/Ky.js
var Ky = class _Ky {
  static create(input, options2) {
    const ky2 = new _Ky(input, options2);
    const function_ = async () => {
      if (typeof ky2._options.timeout === 'number' && ky2._options.timeout > maxSafeTimeout) {
        throw new RangeError(`The \`timeout\` option cannot be greater than ${maxSafeTimeout}`);
      }
      await Promise.resolve();
      let response = await ky2._fetch();
      for (const hook2 of ky2._options.hooks.afterResponse) {
        const modifiedResponse = await hook2(ky2.request, ky2._options, ky2._decorateResponse(response.clone()));
        if (modifiedResponse instanceof globalThis.Response) {
          response = modifiedResponse;
        }
      }
      ky2._decorateResponse(response);
      if (!response.ok && ky2._options.throwHttpErrors) {
        let error = new HTTPError(response, ky2.request, ky2._options);
        for (const hook2 of ky2._options.hooks.beforeError) {
          error = await hook2(error);
        }
        throw error;
      }
      if (!ky2.request.bodyUsed) {
        await ky2.request.body?.cancel();
      }
      if (ky2._options.onDownloadProgress) {
        if (typeof ky2._options.onDownloadProgress !== 'function') {
          throw new TypeError('The `onDownloadProgress` option must be a function');
        }
        if (!supportsResponseStreams) {
          throw new Error('Streams are not supported in your environment. `ReadableStream` is missing.');
        }
        return streamResponse(response.clone(), ky2._options.onDownloadProgress);
      }
      return response;
    };
    const isRetriableMethod = ky2._options.retry.methods.includes(ky2.request.method.toLowerCase());
    const result = isRetriableMethod ? ky2._retry(function_) : function_();
    for (const [type, mimeType] of Object.entries(responseTypes)) {
      result[type] = async () => {
        ky2.request.headers.set('accept', ky2.request.headers.get('accept') || mimeType);
        const response = await result;
        if (type === 'json') {
          if (response.status === 204) {
            return '';
          }
          const arrayBuffer = await response.clone().arrayBuffer();
          const responseSize = arrayBuffer.byteLength;
          if (responseSize === 0) {
            return '';
          }
          if (options2.parseJson) {
            return options2.parseJson(await response.text());
          }
        }
        return response[type]();
      };
    }
    return result;
  }
  request;
  abortController;
  _retryCount = 0;
  _input;
  _options;
  // eslint-disable-next-line complexity
  constructor(input, options2 = {}) {
    this._input = input;
    this._options = {
      ...options2,
      headers: mergeHeaders(this._input.headers, options2.headers),
      hooks: mergeHooks(
        {
          beforeRequest: [],
          beforeRetry: [],
          beforeError: [],
          afterResponse: [],
        },
        options2.hooks,
      ),
      method: normalizeRequestMethod(options2.method ?? this._input.method ?? 'GET'),
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      prefixUrl: String(options2.prefixUrl || ''),
      retry: normalizeRetryOptions(options2.retry),
      throwHttpErrors: options2.throwHttpErrors !== false,
      timeout: options2.timeout ?? 1e4,
      fetch: options2.fetch ?? globalThis.fetch.bind(globalThis),
    };
    if (typeof this._input !== 'string' && !(this._input instanceof URL || this._input instanceof globalThis.Request)) {
      throw new TypeError('`input` must be a string, URL, or Request');
    }
    if (this._options.prefixUrl && typeof this._input === 'string') {
      if (this._input.startsWith('/')) {
        throw new Error('`input` must not begin with a slash when using `prefixUrl`');
      }
      if (!this._options.prefixUrl.endsWith('/')) {
        this._options.prefixUrl += '/';
      }
      this._input = this._options.prefixUrl + this._input;
    }
    if (supportsAbortController) {
      const originalSignal = this._options.signal ?? this._input.signal;
      this.abortController = new globalThis.AbortController();
      this._options.signal = originalSignal
        ? AbortSignal.any([originalSignal, this.abortController.signal])
        : this.abortController.signal;
    }
    if (supportsRequestStreams) {
      this._options.duplex = 'half';
    }
    if (this._options.json !== void 0) {
      this._options.body = this._options.stringifyJson?.(this._options.json) ?? JSON.stringify(this._options.json);
      this._options.headers.set('content-type', this._options.headers.get('content-type') ?? 'application/json');
    }
    this.request = new globalThis.Request(this._input, this._options);
    if (this._options.searchParams) {
      const textSearchParams =
        typeof this._options.searchParams === 'string'
          ? this._options.searchParams.replace(/^\?/, '')
          : new URLSearchParams(this._options.searchParams).toString();
      const searchParams = '?' + textSearchParams;
      const url = this.request.url.replace(/(?:\?.*?)?(?=#|$)/, searchParams);
      if (
        ((supportsFormData && this._options.body instanceof globalThis.FormData) ||
          this._options.body instanceof URLSearchParams) &&
        !(this._options.headers && this._options.headers['content-type'])
      ) {
        this.request.headers.delete('content-type');
      }
      this.request = new globalThis.Request(new globalThis.Request(url, { ...this.request }), this._options);
    }
    if (this._options.onUploadProgress) {
      if (typeof this._options.onUploadProgress !== 'function') {
        throw new TypeError('The `onUploadProgress` option must be a function');
      }
      if (!supportsRequestStreams) {
        throw new Error(
          'Request streams are not supported in your environment. The `duplex` option for `Request` is not available.',
        );
      }
      const originalBody = this.request.body;
      if (originalBody) {
        this.request = streamRequest(this.request, this._options.onUploadProgress);
      }
    }
  }
  _calculateRetryDelay(error) {
    this._retryCount++;
    if (this._retryCount > this._options.retry.limit || error instanceof TimeoutError) {
      throw error;
    }
    if (error instanceof HTTPError) {
      if (!this._options.retry.statusCodes.includes(error.response.status)) {
        throw error;
      }
      const retryAfter =
        error.response.headers.get('Retry-After') ??
        error.response.headers.get('RateLimit-Reset') ??
        error.response.headers.get('X-RateLimit-Reset') ??
        error.response.headers.get('X-Rate-Limit-Reset');
      if (retryAfter && this._options.retry.afterStatusCodes.includes(error.response.status)) {
        let after = Number(retryAfter) * 1e3;
        if (Number.isNaN(after)) {
          after = Date.parse(retryAfter) - Date.now();
        } else if (after >= Date.parse('2024-01-01')) {
          after -= Date.now();
        }
        const max = this._options.retry.maxRetryAfter ?? after;
        return after < max ? after : max;
      }
      if (error.response.status === 413) {
        throw error;
      }
    }
    const retryDelay = this._options.retry.delay(this._retryCount);
    return Math.min(this._options.retry.backoffLimit, retryDelay);
  }
  _decorateResponse(response) {
    if (this._options.parseJson) {
      response.json = async () => this._options.parseJson(await response.text());
    }
    return response;
  }
  async _retry(function_) {
    try {
      return await function_();
    } catch (error) {
      const ms = Math.min(this._calculateRetryDelay(error), maxSafeTimeout);
      if (this._retryCount < 1) {
        throw error;
      }
      await delay(ms, { signal: this._options.signal });
      for (const hook2 of this._options.hooks.beforeRetry) {
        const hookResult = await hook2({
          request: this.request,
          options: this._options,
          error,
          retryCount: this._retryCount,
        });
        if (hookResult === stop) {
          return;
        }
      }
      return this._retry(function_);
    }
  }
  async _fetch() {
    for (const hook2 of this._options.hooks.beforeRequest) {
      const result = await hook2(this.request, this._options);
      if (result instanceof Request) {
        this.request = result;
        break;
      }
      if (result instanceof Response) {
        return result;
      }
    }
    const nonRequestOptions = findUnknownOptions(this.request, this._options);
    const mainRequest = this.request;
    this.request = mainRequest.clone();
    if (this._options.timeout === false) {
      return this._options.fetch(mainRequest, nonRequestOptions);
    }
    return timeout(mainRequest, nonRequestOptions, this.abortController, this._options);
  }
};

// node_modules/ky/distribution/index.js
var createInstance = (defaults) => {
  const ky2 = (input, options2) => Ky.create(input, validateAndMerge(defaults, options2));
  for (const method of requestMethods) {
    ky2[method] = (input, options2) => Ky.create(input, validateAndMerge(defaults, options2, { method }));
  }
  ky2.create = (newDefaults) => createInstance(validateAndMerge(newDefaults));
  ky2.extend = (newDefaults) => {
    if (typeof newDefaults === 'function') {
      newDefaults = newDefaults(defaults ?? {});
    }
    return createInstance(validateAndMerge(defaults, newDefaults));
  };
  ky2.stop = stop;
  return ky2;
};
var ky = createInstance();
var distribution_default = ky;

// node_modules/registry-url/index.js
var import_rc = __toESM(require_rc(), 1);
function registryUrl(scope) {
  const result = (0, import_rc.default)('npm', { registry: 'https://registry.npmjs.org/' });
  const url = result[`${scope}:registry`] || result.config_registry || result.registry;
  return url.slice(-1) === '/' ? url : `${url}/`;
}

// node_modules/package-json/index.js
var import_registry_auth_token = __toESM(require_registry_auth_token(), 1);
var import_semver = __toESM(require_semver2(), 1);
var PackageNotFoundError = class extends Error {
  constructor(packageName) {
    super(`Package \`${packageName}\` could not be found`);
    this.name = 'PackageNotFoundError';
  }
};
var VersionNotFoundError = class extends Error {
  constructor(packageName, version) {
    super(`Version \`${version}\` for package \`${packageName}\` could not be found`);
    this.name = 'VersionNotFoundError';
  }
};
async function packageJson(packageName, options2 = {}) {
  let { version = 'latest' } = options2;
  const { omitDeprecated = true } = options2;
  const scope = packageName.split('/')[0];
  const registryUrl_ = options2.registryUrl ?? registryUrl(scope);
  const packageUrl = new URL(encodeURIComponent(packageName).replace(/^%40/, '@'), registryUrl_);
  const authInfo = (0, import_registry_auth_token.default)(registryUrl_.toString(), { recursive: true });
  const headers = {
    accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
  };
  if (options2.fullMetadata) {
    delete headers.accept;
  }
  if (authInfo) {
    headers.authorization = `${authInfo.type} ${authInfo.token}`;
  }
  let data;
  try {
    data = await distribution_default(packageUrl, { headers, keepalive: true }).json();
  } catch (error) {
    if (error?.response?.status === 404) {
      throw new PackageNotFoundError(packageName);
    }
    throw error;
  }
  if (options2.allVersions) {
    return data;
  }
  const versionError = new VersionNotFoundError(packageName, version);
  if (data['dist-tags'][version]) {
    const { time } = data;
    data = data.versions[data['dist-tags'][version]];
    data.time = time;
  } else if (version) {
    const versionExists = Boolean(data.versions[version]);
    if (omitDeprecated && !versionExists) {
      for (const [metadataVersion, metadata] of Object.entries(data.versions)) {
        if (metadata.deprecated) {
          delete data.versions[metadataVersion];
        }
      }
    }
    if (!versionExists) {
      const versions = Object.keys(data.versions);
      version = import_semver.default.maxSatisfying(versions, version);
      if (!version) {
        throw versionError;
      }
    }
    const { time } = data;
    data = data.versions[version];
    data.time = time;
    if (!data) {
      throw versionError;
    }
  }
  return data;
}

// node_modules/universal-user-agent/index.js
function getUserAgent() {
  if (typeof navigator === 'object' && 'userAgent' in navigator) {
    return navigator.userAgent;
  }
  if (typeof process === 'object' && process.version !== void 0) {
    return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
  }
  return '<environment undetectable>';
}

// node_modules/before-after-hook/lib/register.js
function register(state, name, method, options2) {
  if (typeof method !== 'function') {
    throw new Error('method for before hook must be a function');
  }
  if (!options2) {
    options2 = {};
  }
  if (Array.isArray(name)) {
    return name.reverse().reduce((callback, name2) => {
      return register.bind(null, state, name2, callback, options2);
    }, method)();
  }
  return Promise.resolve().then(() => {
    if (!state.registry[name]) {
      return method(options2);
    }
    return state.registry[name].reduce((method2, registered) => {
      return registered.hook.bind(null, method2, options2);
    }, method)();
  });
}

// node_modules/before-after-hook/lib/add.js
function addHook(state, kind, name, hook2) {
  const orig = hook2;
  if (!state.registry[name]) {
    state.registry[name] = [];
  }
  if (kind === 'before') {
    hook2 = (method, options2) => {
      return Promise.resolve().then(orig.bind(null, options2)).then(method.bind(null, options2));
    };
  }
  if (kind === 'after') {
    hook2 = (method, options2) => {
      let result;
      return Promise.resolve()
        .then(method.bind(null, options2))
        .then((result_) => {
          result = result_;
          return orig(result, options2);
        })
        .then(() => {
          return result;
        });
    };
  }
  if (kind === 'error') {
    hook2 = (method, options2) => {
      return Promise.resolve()
        .then(method.bind(null, options2))
        .catch((error) => {
          return orig(error, options2);
        });
    };
  }
  state.registry[name].push({
    hook: hook2,
    orig,
  });
}

// node_modules/before-after-hook/lib/remove.js
function removeHook(state, name, method) {
  if (!state.registry[name]) {
    return;
  }
  const index = state.registry[name]
    .map((registered) => {
      return registered.orig;
    })
    .indexOf(method);
  if (index === -1) {
    return;
  }
  state.registry[name].splice(index, 1);
}

// node_modules/before-after-hook/index.js
var bind = Function.bind;
var bindable = bind.bind(bind);
function bindApi(hook2, state, name) {
  const removeHookRef = bindable(removeHook, null).apply(null, name ? [state, name] : [state]);
  hook2.api = { remove: removeHookRef };
  hook2.remove = removeHookRef;
  ['before', 'error', 'after', 'wrap'].forEach((kind) => {
    const args = name ? [state, kind, name] : [state, kind];
    hook2[kind] = hook2.api[kind] = bindable(addHook, null).apply(null, args);
  });
}
function Singular() {
  const singularHookName = Symbol('Singular');
  const singularHookState = {
    registry: {},
  };
  const singularHook = register.bind(null, singularHookState, singularHookName);
  bindApi(singularHook, singularHookState, singularHookName);
  return singularHook;
}
function Collection() {
  const state = {
    registry: {},
  };
  const hook2 = register.bind(null, state);
  bindApi(hook2, state);
  return hook2;
}
var before_after_hook_default = { Singular, Collection };

// node_modules/@octokit/endpoint/dist-bundle/index.js
var VERSION = '0.0.0-development';
var userAgent = `octokit-endpoint.js/${VERSION} ${getUserAgent()}`;
var DEFAULTS = {
  method: 'GET',
  baseUrl: 'https://api.github.com',
  headers: {
    accept: 'application/vnd.github.v3+json',
    'user-agent': userAgent,
  },
  mediaType: {
    format: '',
  },
};
function lowercaseKeys(object) {
  if (!object) {
    return {};
  }
  return Object.keys(object).reduce((newObj, key) => {
    newObj[key.toLowerCase()] = object[key];
    return newObj;
  }, {});
}
function isPlainObject(value) {
  if (typeof value !== 'object' || value === null) return false;
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const proto2 = Object.getPrototypeOf(value);
  if (proto2 === null) return true;
  const Ctor = Object.prototype.hasOwnProperty.call(proto2, 'constructor') && proto2.constructor;
  return (
    typeof Ctor === 'function' &&
    Ctor instanceof Ctor &&
    Function.prototype.call(Ctor) === Function.prototype.call(value)
  );
}
function mergeDeep(defaults, options2) {
  const result = Object.assign({}, defaults);
  Object.keys(options2).forEach((key) => {
    if (isPlainObject(options2[key])) {
      if (!(key in defaults)) Object.assign(result, { [key]: options2[key] });
      else result[key] = mergeDeep(defaults[key], options2[key]);
    } else {
      Object.assign(result, { [key]: options2[key] });
    }
  });
  return result;
}
function removeUndefinedProperties(obj) {
  for (const key in obj) {
    if (obj[key] === void 0) {
      delete obj[key];
    }
  }
  return obj;
}
function merge(defaults, route, options2) {
  if (typeof route === 'string') {
    let [method, url] = route.split(' ');
    options2 = Object.assign(url ? { method, url } : { url: method }, options2);
  } else {
    options2 = Object.assign({}, route);
  }
  options2.headers = lowercaseKeys(options2.headers);
  removeUndefinedProperties(options2);
  removeUndefinedProperties(options2.headers);
  const mergedOptions = mergeDeep(defaults || {}, options2);
  if (options2.url === '/graphql') {
    if (defaults && defaults.mediaType.previews?.length) {
      mergedOptions.mediaType.previews = defaults.mediaType.previews
        .filter((preview) => !mergedOptions.mediaType.previews.includes(preview))
        .concat(mergedOptions.mediaType.previews);
    }
    mergedOptions.mediaType.previews = (mergedOptions.mediaType.previews || []).map((preview) =>
      preview.replace(/-preview/, ''),
    );
  }
  return mergedOptions;
}
function addQueryParameters(url, parameters) {
  const separator = /\?/.test(url) ? '&' : '?';
  const names = Object.keys(parameters);
  if (names.length === 0) {
    return url;
  }
  return (
    url +
    separator +
    names
      .map((name) => {
        if (name === 'q') {
          return 'q=' + parameters.q.split('+').map(encodeURIComponent).join('+');
        }
        return `${name}=${encodeURIComponent(parameters[name])}`;
      })
      .join('&')
  );
}
var urlVariableRegex = /\{[^{}}]+\}/g;
function removeNonChars(variableName) {
  return variableName.replace(/(?:^\W+)|(?:(?<!\W)\W+$)/g, '').split(/,/);
}
function extractUrlVariableNames(url) {
  const matches = url.match(urlVariableRegex);
  if (!matches) {
    return [];
  }
  return matches.map(removeNonChars).reduce((a, b) => a.concat(b), []);
}
function omit(object, keysToOmit) {
  const result = { __proto__: null };
  for (const key of Object.keys(object)) {
    if (keysToOmit.indexOf(key) === -1) {
      result[key] = object[key];
    }
  }
  return result;
}
function encodeReserved(str) {
  return str
    .split(/(%[0-9A-Fa-f]{2})/g)
    .map(function (part) {
      if (!/%[0-9A-Fa-f]/.test(part)) {
        part = encodeURI(part).replace(/%5B/g, '[').replace(/%5D/g, ']');
      }
      return part;
    })
    .join('');
}
function encodeUnreserved(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
}
function encodeValue(operator, value, key) {
  value = operator === '+' || operator === '#' ? encodeReserved(value) : encodeUnreserved(value);
  if (key) {
    return encodeUnreserved(key) + '=' + value;
  } else {
    return value;
  }
}
function isDefined(value) {
  return value !== void 0 && value !== null;
}
function isKeyOperator(operator) {
  return operator === ';' || operator === '&' || operator === '?';
}
function getValues(context, operator, key, modifier) {
  var value = context[key],
    result = [];
  if (isDefined(value) && value !== '') {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      value = value.toString();
      if (modifier && modifier !== '*') {
        value = value.substring(0, parseInt(modifier, 10));
      }
      result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : ''));
    } else {
      if (modifier === '*') {
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(function (value2) {
            result.push(encodeValue(operator, value2, isKeyOperator(operator) ? key : ''));
          });
        } else {
          Object.keys(value).forEach(function (k) {
            if (isDefined(value[k])) {
              result.push(encodeValue(operator, value[k], k));
            }
          });
        }
      } else {
        const tmp = [];
        if (Array.isArray(value)) {
          value.filter(isDefined).forEach(function (value2) {
            tmp.push(encodeValue(operator, value2));
          });
        } else {
          Object.keys(value).forEach(function (k) {
            if (isDefined(value[k])) {
              tmp.push(encodeUnreserved(k));
              tmp.push(encodeValue(operator, value[k].toString()));
            }
          });
        }
        if (isKeyOperator(operator)) {
          result.push(encodeUnreserved(key) + '=' + tmp.join(','));
        } else if (tmp.length !== 0) {
          result.push(tmp.join(','));
        }
      }
    }
  } else {
    if (operator === ';') {
      if (isDefined(value)) {
        result.push(encodeUnreserved(key));
      }
    } else if (value === '' && (operator === '&' || operator === '?')) {
      result.push(encodeUnreserved(key) + '=');
    } else if (value === '') {
      result.push('');
    }
  }
  return result;
}
function parseUrl(template) {
  return {
    expand: expand.bind(null, template),
  };
}
function expand(template, context) {
  var operators = ['+', '#', '.', '/', ';', '?', '&'];
  template = template.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, function (_, expression, literal) {
    if (expression) {
      let operator = '';
      const values = [];
      if (operators.indexOf(expression.charAt(0)) !== -1) {
        operator = expression.charAt(0);
        expression = expression.substr(1);
      }
      expression.split(/,/g).forEach(function (variable) {
        var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
        values.push(getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
      });
      if (operator && operator !== '+') {
        var separator = ',';
        if (operator === '?') {
          separator = '&';
        } else if (operator !== '#') {
          separator = operator;
        }
        return (values.length !== 0 ? operator : '') + values.join(separator);
      } else {
        return values.join(',');
      }
    } else {
      return encodeReserved(literal);
    }
  });
  if (template === '/') {
    return template;
  } else {
    return template.replace(/\/$/, '');
  }
}
function parse(options2) {
  let method = options2.method.toUpperCase();
  let url = (options2.url || '/').replace(/:([a-z]\w+)/g, '{$1}');
  let headers = Object.assign({}, options2.headers);
  let body;
  let parameters = omit(options2, ['method', 'baseUrl', 'url', 'headers', 'request', 'mediaType']);
  const urlVariableNames = extractUrlVariableNames(url);
  url = parseUrl(url).expand(parameters);
  if (!/^http/.test(url)) {
    url = options2.baseUrl + url;
  }
  const omittedParameters = Object.keys(options2)
    .filter((option) => urlVariableNames.includes(option))
    .concat('baseUrl');
  const remainingParameters = omit(parameters, omittedParameters);
  const isBinaryRequest = /application\/octet-stream/i.test(headers.accept);
  if (!isBinaryRequest) {
    if (options2.mediaType.format) {
      headers.accept = headers.accept
        .split(/,/)
        .map((format) =>
          format.replace(
            /application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/,
            `application/vnd$1$2.${options2.mediaType.format}`,
          ),
        )
        .join(',');
    }
    if (url.endsWith('/graphql')) {
      if (options2.mediaType.previews?.length) {
        const previewsFromAcceptHeader = headers.accept.match(/(?<![\w-])[\w-]+(?=-preview)/g) || [];
        headers.accept = previewsFromAcceptHeader
          .concat(options2.mediaType.previews)
          .map((preview) => {
            const format = options2.mediaType.format ? `.${options2.mediaType.format}` : '+json';
            return `application/vnd.github.${preview}-preview${format}`;
          })
          .join(',');
      }
    }
  }
  if (['GET', 'HEAD'].includes(method)) {
    url = addQueryParameters(url, remainingParameters);
  } else {
    if ('data' in remainingParameters) {
      body = remainingParameters.data;
    } else {
      if (Object.keys(remainingParameters).length) {
        body = remainingParameters;
      }
    }
  }
  if (!headers['content-type'] && typeof body !== 'undefined') {
    headers['content-type'] = 'application/json; charset=utf-8';
  }
  if (['PATCH', 'PUT'].includes(method) && typeof body === 'undefined') {
    body = '';
  }
  return Object.assign(
    { method, url, headers },
    typeof body !== 'undefined' ? { body } : null,
    options2.request ? { request: options2.request } : null,
  );
}
function endpointWithDefaults(defaults, route, options2) {
  return parse(merge(defaults, route, options2));
}
function withDefaults(oldDefaults, newDefaults) {
  const DEFAULTS2 = merge(oldDefaults, newDefaults);
  const endpoint2 = endpointWithDefaults.bind(null, DEFAULTS2);
  return Object.assign(endpoint2, {
    DEFAULTS: DEFAULTS2,
    defaults: withDefaults.bind(null, DEFAULTS2),
    merge: merge.bind(null, DEFAULTS2),
    parse,
  });
}
var endpoint = withDefaults(null, DEFAULTS);

// node_modules/@octokit/request/dist-bundle/index.js
var import_fast_content_type_parse = __toESM(require_fast_content_type_parse(), 1);

// node_modules/@octokit/request-error/dist-src/index.js
var RequestError = class extends Error {
  name;
  /**
   * http status code
   */
  status;
  /**
   * Request options that lead to the error.
   */
  request;
  /**
   * Response object if a response was received
   */
  response;
  constructor(message, statusCode, options2) {
    super(message);
    this.name = 'HttpError';
    this.status = Number.parseInt(statusCode);
    if (Number.isNaN(this.status)) {
      this.status = 0;
    }
    if ('response' in options2) {
      this.response = options2.response;
    }
    const requestCopy = Object.assign({}, options2.request);
    if (options2.request.headers.authorization) {
      requestCopy.headers = Object.assign({}, options2.request.headers, {
        authorization: options2.request.headers.authorization.replace(/(?<! ) .*$/, ' [REDACTED]'),
      });
    }
    requestCopy.url = requestCopy.url
      .replace(/\bclient_secret=\w+/g, 'client_secret=[REDACTED]')
      .replace(/\baccess_token=\w+/g, 'access_token=[REDACTED]');
    this.request = requestCopy;
  }
};

// node_modules/@octokit/request/dist-bundle/index.js
var VERSION2 = '0.0.0-development';
var defaults_default = {
  headers: {
    'user-agent': `octokit-request.js/${VERSION2} ${getUserAgent()}`,
  },
};
function isPlainObject2(value) {
  if (typeof value !== 'object' || value === null) return false;
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const proto2 = Object.getPrototypeOf(value);
  if (proto2 === null) return true;
  const Ctor = Object.prototype.hasOwnProperty.call(proto2, 'constructor') && proto2.constructor;
  return (
    typeof Ctor === 'function' &&
    Ctor instanceof Ctor &&
    Function.prototype.call(Ctor) === Function.prototype.call(value)
  );
}
async function fetchWrapper(requestOptions) {
  const fetch = requestOptions.request?.fetch || globalThis.fetch;
  if (!fetch) {
    throw new Error(
      'fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing',
    );
  }
  const log = requestOptions.request?.log || console;
  const parseSuccessResponseBody = requestOptions.request?.parseSuccessResponseBody !== false;
  const body =
    isPlainObject2(requestOptions.body) || Array.isArray(requestOptions.body)
      ? JSON.stringify(requestOptions.body)
      : requestOptions.body;
  const requestHeaders = Object.fromEntries(
    Object.entries(requestOptions.headers).map(([name, value]) => [name, String(value)]),
  );
  let fetchResponse;
  try {
    fetchResponse = await fetch(requestOptions.url, {
      method: requestOptions.method,
      body,
      redirect: requestOptions.request?.redirect,
      headers: requestHeaders,
      signal: requestOptions.request?.signal,
      // duplex must be set if request.body is ReadableStream or Async Iterables.
      // See https://fetch.spec.whatwg.org/#dom-requestinit-duplex.
      ...(requestOptions.body && { duplex: 'half' }),
    });
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        error.status = 500;
        throw error;
      }
      message = error.message;
      if (error.name === 'TypeError' && 'cause' in error) {
        if (error.cause instanceof Error) {
          message = error.cause.message;
        } else if (typeof error.cause === 'string') {
          message = error.cause;
        }
      }
    }
    const requestError = new RequestError(message, 500, {
      request: requestOptions,
    });
    requestError.cause = error;
    throw requestError;
  }
  const status = fetchResponse.status;
  const url = fetchResponse.url;
  const responseHeaders = {};
  for (const [key, value] of fetchResponse.headers) {
    responseHeaders[key] = value;
  }
  const octokitResponse = {
    url,
    status,
    headers: responseHeaders,
    data: '',
  };
  if ('deprecation' in responseHeaders) {
    const matches = responseHeaders.link && responseHeaders.link.match(/<([^<>]+)>; rel="deprecation"/);
    const deprecationLink = matches && matches.pop();
    log.warn(
      `[@octokit/request] "${requestOptions.method} ${requestOptions.url}" is deprecated. It is scheduled to be removed on ${responseHeaders.sunset}${deprecationLink ? `. See ${deprecationLink}` : ''}`,
    );
  }
  if (status === 204 || status === 205) {
    return octokitResponse;
  }
  if (requestOptions.method === 'HEAD') {
    if (status < 400) {
      return octokitResponse;
    }
    throw new RequestError(fetchResponse.statusText, status, {
      response: octokitResponse,
      request: requestOptions,
    });
  }
  if (status === 304) {
    octokitResponse.data = await getResponseData(fetchResponse);
    throw new RequestError('Not modified', status, {
      response: octokitResponse,
      request: requestOptions,
    });
  }
  if (status >= 400) {
    octokitResponse.data = await getResponseData(fetchResponse);
    throw new RequestError(toErrorMessage(octokitResponse.data), status, {
      response: octokitResponse,
      request: requestOptions,
    });
  }
  octokitResponse.data = parseSuccessResponseBody ? await getResponseData(fetchResponse) : fetchResponse.body;
  return octokitResponse;
}
async function getResponseData(response) {
  const contentType = response.headers.get('content-type');
  if (!contentType) {
    return response.text().catch(() => '');
  }
  const mimetype = (0, import_fast_content_type_parse.safeParse)(contentType);
  if (isJSONResponse(mimetype)) {
    let text = '';
    try {
      text = await response.text();
      return JSON.parse(text);
    } catch (err) {
      return text;
    }
  } else if (mimetype.type.startsWith('text/') || mimetype.parameters.charset?.toLowerCase() === 'utf-8') {
    return response.text().catch(() => '');
  } else {
    return response.arrayBuffer().catch(() => new ArrayBuffer(0));
  }
}
function isJSONResponse(mimetype) {
  return mimetype.type === 'application/json' || mimetype.type === 'application/scim+json';
}
function toErrorMessage(data) {
  if (typeof data === 'string') {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return 'Unknown error';
  }
  if ('message' in data) {
    const suffix = 'documentation_url' in data ? ` - ${data.documentation_url}` : '';
    return Array.isArray(data.errors)
      ? `${data.message}: ${data.errors.map((v) => JSON.stringify(v)).join(', ')}${suffix}`
      : `${data.message}${suffix}`;
  }
  return `Unknown error: ${JSON.stringify(data)}`;
}
function withDefaults2(oldEndpoint, newDefaults) {
  const endpoint2 = oldEndpoint.defaults(newDefaults);
  const newApi = function (route, parameters) {
    const endpointOptions = endpoint2.merge(route, parameters);
    if (!endpointOptions.request || !endpointOptions.request.hook) {
      return fetchWrapper(endpoint2.parse(endpointOptions));
    }
    const request2 = (route2, parameters2) => {
      return fetchWrapper(endpoint2.parse(endpoint2.merge(route2, parameters2)));
    };
    Object.assign(request2, {
      endpoint: endpoint2,
      defaults: withDefaults2.bind(null, endpoint2),
    });
    return endpointOptions.request.hook(request2, endpointOptions);
  };
  return Object.assign(newApi, {
    endpoint: endpoint2,
    defaults: withDefaults2.bind(null, endpoint2),
  });
}
var request = withDefaults2(endpoint, defaults_default);

// node_modules/@octokit/graphql/dist-bundle/index.js
var VERSION3 = '0.0.0-development';
function _buildMessageForResponseErrors(data) {
  return (
    `Request failed due to following response errors:
` + data.errors.map((e) => ` - ${e.message}`).join('\n')
  );
}
var GraphqlResponseError = class extends Error {
  constructor(request2, headers, response) {
    super(_buildMessageForResponseErrors(response));
    this.request = request2;
    this.headers = headers;
    this.response = response;
    this.errors = response.errors;
    this.data = response.data;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  name = 'GraphqlResponseError';
  errors;
  data;
};
var NON_VARIABLE_OPTIONS = ['method', 'baseUrl', 'url', 'headers', 'request', 'query', 'mediaType', 'operationName'];
var FORBIDDEN_VARIABLE_OPTIONS = ['query', 'method', 'url'];
var GHES_V3_SUFFIX_REGEX = /\/api\/v3\/?$/;
function graphql(request2, query, options2) {
  if (options2) {
    if (typeof query === 'string' && 'query' in options2) {
      return Promise.reject(new Error(`[@octokit/graphql] "query" cannot be used as variable name`));
    }
    for (const key in options2) {
      if (!FORBIDDEN_VARIABLE_OPTIONS.includes(key)) continue;
      return Promise.reject(new Error(`[@octokit/graphql] "${key}" cannot be used as variable name`));
    }
  }
  const parsedOptions = typeof query === 'string' ? Object.assign({ query }, options2) : query;
  const requestOptions = Object.keys(parsedOptions).reduce((result, key) => {
    if (NON_VARIABLE_OPTIONS.includes(key)) {
      result[key] = parsedOptions[key];
      return result;
    }
    if (!result.variables) {
      result.variables = {};
    }
    result.variables[key] = parsedOptions[key];
    return result;
  }, {});
  const baseUrl = parsedOptions.baseUrl || request2.endpoint.DEFAULTS.baseUrl;
  if (GHES_V3_SUFFIX_REGEX.test(baseUrl)) {
    requestOptions.url = baseUrl.replace(GHES_V3_SUFFIX_REGEX, '/api/graphql');
  }
  return request2(requestOptions).then((response) => {
    if (response.data.errors) {
      const headers = {};
      for (const key of Object.keys(response.headers)) {
        headers[key] = response.headers[key];
      }
      throw new GraphqlResponseError(requestOptions, headers, response.data);
    }
    return response.data.data;
  });
}
function withDefaults3(request2, newDefaults) {
  const newRequest = request2.defaults(newDefaults);
  const newApi = (query, options2) => {
    return graphql(newRequest, query, options2);
  };
  return Object.assign(newApi, {
    defaults: withDefaults3.bind(null, newRequest),
    endpoint: newRequest.endpoint,
  });
}
var graphql2 = withDefaults3(request, {
  headers: {
    'user-agent': `octokit-graphql.js/${VERSION3} ${getUserAgent()}`,
  },
  method: 'POST',
  url: '/graphql',
});
function withCustomRequest(customRequest) {
  return withDefaults3(customRequest, {
    method: 'POST',
    url: '/graphql',
  });
}

// node_modules/@octokit/auth-token/dist-bundle/index.js
var b64url = '(?:[a-zA-Z0-9_-]+)';
var sep = '\\.';
var jwtRE = new RegExp(`^${b64url}${sep}${b64url}${sep}${b64url}$`);
var isJWT = jwtRE.test.bind(jwtRE);
async function auth(token) {
  const isApp = isJWT(token);
  const isInstallation = token.startsWith('v1.') || token.startsWith('ghs_');
  const isUserToServer = token.startsWith('ghu_');
  const tokenType = isApp ? 'app' : isInstallation ? 'installation' : isUserToServer ? 'user-to-server' : 'oauth';
  return {
    type: 'token',
    token,
    tokenType,
  };
}
function withAuthorizationPrefix(token) {
  if (token.split(/\./).length === 3) {
    return `bearer ${token}`;
  }
  return `token ${token}`;
}
async function hook(token, request2, route, parameters) {
  const endpoint2 = request2.endpoint.merge(route, parameters);
  endpoint2.headers.authorization = withAuthorizationPrefix(token);
  return request2(endpoint2);
}
var createTokenAuth = function createTokenAuth2(token) {
  if (!token) {
    throw new Error('[@octokit/auth-token] No token passed to createTokenAuth');
  }
  if (typeof token !== 'string') {
    throw new Error('[@octokit/auth-token] Token passed to createTokenAuth is not a string');
  }
  token = token.replace(/^(token|bearer) +/i, '');
  return Object.assign(auth.bind(null, token), {
    hook: hook.bind(null, token),
  });
};

// node_modules/@octokit/core/dist-src/version.js
var VERSION4 = '6.1.4';

// node_modules/@octokit/core/dist-src/index.js
var noop = () => {};
var consoleWarn = console.warn.bind(console);
var consoleError = console.error.bind(console);
var userAgentTrail = `octokit-core.js/${VERSION4} ${getUserAgent()}`;
var Octokit = class {
  static VERSION = VERSION4;
  static defaults(defaults) {
    const OctokitWithDefaults = class extends this {
      constructor(...args) {
        const options2 = args[0] || {};
        if (typeof defaults === 'function') {
          super(defaults(options2));
          return;
        }
        super(
          Object.assign(
            {},
            defaults,
            options2,
            options2.userAgent && defaults.userAgent
              ? {
                  userAgent: `${options2.userAgent} ${defaults.userAgent}`,
                }
              : null,
          ),
        );
      }
    };
    return OctokitWithDefaults;
  }
  static plugins = [];
  /**
   * Attach a plugin (or many) to your Octokit instance.
   *
   * @example
   * const API = Octokit.plugin(plugin1, plugin2, plugin3, ...)
   */
  static plugin(...newPlugins) {
    const currentPlugins = this.plugins;
    const NewOctokit = class extends this {
      static plugins = currentPlugins.concat(newPlugins.filter((plugin) => !currentPlugins.includes(plugin)));
    };
    return NewOctokit;
  }
  constructor(options2 = {}) {
    const hook2 = new before_after_hook_default.Collection();
    const requestDefaults = {
      baseUrl: request.endpoint.DEFAULTS.baseUrl,
      headers: {},
      request: Object.assign({}, options2.request, {
        // @ts-ignore internal usage only, no need to type
        hook: hook2.bind(null, 'request'),
      }),
      mediaType: {
        previews: [],
        format: '',
      },
    };
    requestDefaults.headers['user-agent'] = options2.userAgent
      ? `${options2.userAgent} ${userAgentTrail}`
      : userAgentTrail;
    if (options2.baseUrl) {
      requestDefaults.baseUrl = options2.baseUrl;
    }
    if (options2.previews) {
      requestDefaults.mediaType.previews = options2.previews;
    }
    if (options2.timeZone) {
      requestDefaults.headers['time-zone'] = options2.timeZone;
    }
    this.request = request.defaults(requestDefaults);
    this.graphql = withCustomRequest(this.request).defaults(requestDefaults);
    this.log = Object.assign(
      {
        debug: noop,
        info: noop,
        warn: consoleWarn,
        error: consoleError,
      },
      options2.log,
    );
    this.hook = hook2;
    if (!options2.authStrategy) {
      if (!options2.auth) {
        this.auth = async () => ({
          type: 'unauthenticated',
        });
      } else {
        const auth2 = createTokenAuth(options2.auth);
        hook2.wrap('request', auth2.hook);
        this.auth = auth2;
      }
    } else {
      const { authStrategy, ...otherOptions } = options2;
      const auth2 = authStrategy(
        Object.assign(
          {
            request: this.request,
            log: this.log,
            // we pass the current octokit instance as well as its constructor options
            // to allow for authentication strategies that return a new octokit instance
            // that shares the same internal state as the current one. The original
            // requirement for this was the "event-octokit" authentication strategy
            // of https://github.com/probot/octokit-auth-probot.
            octokit: this,
            octokitOptions: otherOptions,
          },
          options2.auth,
        ),
      );
      hook2.wrap('request', auth2.hook);
      this.auth = auth2;
    }
    const classConstructor = this.constructor;
    for (let i = 0; i < classConstructor.plugins.length; ++i) {
      Object.assign(this, classConstructor.plugins[i](this, options2));
    }
  }
  // assigned during constructor
  request;
  graphql;
  log;
  hook;
  // TODO: type `octokit.auth` based on passed options.authStrategy
  auth;
};

// node_modules/@octokit/plugin-request-log/dist-src/version.js
var VERSION5 = '5.3.1';

// node_modules/@octokit/plugin-request-log/dist-src/index.js
function requestLog(octokit2) {
  octokit2.hook.wrap('request', (request2, options2) => {
    octokit2.log.debug('request', options2);
    const start = Date.now();
    const requestOptions = octokit2.request.endpoint.parse(options2);
    const path = requestOptions.url.replace(options2.baseUrl, '');
    return request2(options2)
      .then((response) => {
        const requestId = response.headers['x-github-request-id'];
        octokit2.log.info(
          `${requestOptions.method} ${path} - ${response.status} with id ${requestId} in ${Date.now() - start}ms`,
        );
        return response;
      })
      .catch((error) => {
        const requestId = error.response?.headers['x-github-request-id'] || 'UNKNOWN';
        octokit2.log.error(
          `${requestOptions.method} ${path} - ${error.status} with id ${requestId} in ${Date.now() - start}ms`,
        );
        throw error;
      });
  });
}
requestLog.VERSION = VERSION5;

// node_modules/@octokit/plugin-paginate-rest/dist-bundle/index.js
var VERSION6 = '0.0.0-development';
function normalizePaginatedListResponse(response) {
  if (!response.data) {
    return {
      ...response,
      data: [],
    };
  }
  const responseNeedsNormalization = 'total_count' in response.data && !('url' in response.data);
  if (!responseNeedsNormalization) return response;
  const incompleteResults = response.data.incomplete_results;
  const repositorySelection = response.data.repository_selection;
  const totalCount = response.data.total_count;
  delete response.data.incomplete_results;
  delete response.data.repository_selection;
  delete response.data.total_count;
  const namespaceKey = Object.keys(response.data)[0];
  const data = response.data[namespaceKey];
  response.data = data;
  if (typeof incompleteResults !== 'undefined') {
    response.data.incomplete_results = incompleteResults;
  }
  if (typeof repositorySelection !== 'undefined') {
    response.data.repository_selection = repositorySelection;
  }
  response.data.total_count = totalCount;
  return response;
}
function iterator(octokit2, route, parameters) {
  const options2 =
    typeof route === 'function' ? route.endpoint(parameters) : octokit2.request.endpoint(route, parameters);
  const requestMethod = typeof route === 'function' ? route : octokit2.request;
  const method = options2.method;
  const headers = options2.headers;
  let url = options2.url;
  return {
    [Symbol.asyncIterator]: () => ({
      async next() {
        if (!url) return { done: true };
        try {
          const response = await requestMethod({ method, url, headers });
          const normalizedResponse = normalizePaginatedListResponse(response);
          url = ((normalizedResponse.headers.link || '').match(/<([^<>]+)>;\s*rel="next"/) || [])[1];
          return { value: normalizedResponse };
        } catch (error) {
          if (error.status !== 409) throw error;
          url = '';
          return {
            value: {
              status: 200,
              headers: {},
              data: [],
            },
          };
        }
      },
    }),
  };
}
function paginate(octokit2, route, parameters, mapFn) {
  if (typeof parameters === 'function') {
    mapFn = parameters;
    parameters = void 0;
  }
  return gather(octokit2, [], iterator(octokit2, route, parameters)[Symbol.asyncIterator](), mapFn);
}
function gather(octokit2, results, iterator2, mapFn) {
  return iterator2.next().then((result) => {
    if (result.done) {
      return results;
    }
    let earlyExit = false;
    function done() {
      earlyExit = true;
    }
    results = results.concat(mapFn ? mapFn(result.value, done) : result.value.data);
    if (earlyExit) {
      return results;
    }
    return gather(octokit2, results, iterator2, mapFn);
  });
}
var composePaginateRest = Object.assign(paginate, {
  iterator,
});
function paginateRest(octokit2) {
  return {
    paginate: Object.assign(paginate.bind(null, octokit2), {
      iterator: iterator.bind(null, octokit2),
    }),
  };
}
paginateRest.VERSION = VERSION6;

// node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/version.js
var VERSION7 = '13.5.0';

// node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/generated/endpoints.js
var Endpoints = {
  actions: {
    addCustomLabelsToSelfHostedRunnerForOrg: ['POST /orgs/{org}/actions/runners/{runner_id}/labels'],
    addCustomLabelsToSelfHostedRunnerForRepo: ['POST /repos/{owner}/{repo}/actions/runners/{runner_id}/labels'],
    addRepoAccessToSelfHostedRunnerGroupInOrg: [
      'PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories/{repository_id}',
    ],
    addSelectedRepoToOrgSecret: ['PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}'],
    addSelectedRepoToOrgVariable: ['PUT /orgs/{org}/actions/variables/{name}/repositories/{repository_id}'],
    approveWorkflowRun: ['POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve'],
    cancelWorkflowRun: ['POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel'],
    createEnvironmentVariable: ['POST /repos/{owner}/{repo}/environments/{environment_name}/variables'],
    createHostedRunnerForOrg: ['POST /orgs/{org}/actions/hosted-runners'],
    createOrUpdateEnvironmentSecret: [
      'PUT /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}',
    ],
    createOrUpdateOrgSecret: ['PUT /orgs/{org}/actions/secrets/{secret_name}'],
    createOrUpdateRepoSecret: ['PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}'],
    createOrgVariable: ['POST /orgs/{org}/actions/variables'],
    createRegistrationTokenForOrg: ['POST /orgs/{org}/actions/runners/registration-token'],
    createRegistrationTokenForRepo: ['POST /repos/{owner}/{repo}/actions/runners/registration-token'],
    createRemoveTokenForOrg: ['POST /orgs/{org}/actions/runners/remove-token'],
    createRemoveTokenForRepo: ['POST /repos/{owner}/{repo}/actions/runners/remove-token'],
    createRepoVariable: ['POST /repos/{owner}/{repo}/actions/variables'],
    createWorkflowDispatch: ['POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches'],
    deleteActionsCacheById: ['DELETE /repos/{owner}/{repo}/actions/caches/{cache_id}'],
    deleteActionsCacheByKey: ['DELETE /repos/{owner}/{repo}/actions/caches{?key,ref}'],
    deleteArtifact: ['DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}'],
    deleteEnvironmentSecret: ['DELETE /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}'],
    deleteEnvironmentVariable: ['DELETE /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}'],
    deleteHostedRunnerForOrg: ['DELETE /orgs/{org}/actions/hosted-runners/{hosted_runner_id}'],
    deleteOrgSecret: ['DELETE /orgs/{org}/actions/secrets/{secret_name}'],
    deleteOrgVariable: ['DELETE /orgs/{org}/actions/variables/{name}'],
    deleteRepoSecret: ['DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}'],
    deleteRepoVariable: ['DELETE /repos/{owner}/{repo}/actions/variables/{name}'],
    deleteSelfHostedRunnerFromOrg: ['DELETE /orgs/{org}/actions/runners/{runner_id}'],
    deleteSelfHostedRunnerFromRepo: ['DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}'],
    deleteWorkflowRun: ['DELETE /repos/{owner}/{repo}/actions/runs/{run_id}'],
    deleteWorkflowRunLogs: ['DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs'],
    disableSelectedRepositoryGithubActionsOrganization: [
      'DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}',
    ],
    disableWorkflow: ['PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable'],
    downloadArtifact: ['GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}'],
    downloadJobLogsForWorkflowRun: ['GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs'],
    downloadWorkflowRunAttemptLogs: ['GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs'],
    downloadWorkflowRunLogs: ['GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs'],
    enableSelectedRepositoryGithubActionsOrganization: [
      'PUT /orgs/{org}/actions/permissions/repositories/{repository_id}',
    ],
    enableWorkflow: ['PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable'],
    forceCancelWorkflowRun: ['POST /repos/{owner}/{repo}/actions/runs/{run_id}/force-cancel'],
    generateRunnerJitconfigForOrg: ['POST /orgs/{org}/actions/runners/generate-jitconfig'],
    generateRunnerJitconfigForRepo: ['POST /repos/{owner}/{repo}/actions/runners/generate-jitconfig'],
    getActionsCacheList: ['GET /repos/{owner}/{repo}/actions/caches'],
    getActionsCacheUsage: ['GET /repos/{owner}/{repo}/actions/cache/usage'],
    getActionsCacheUsageByRepoForOrg: ['GET /orgs/{org}/actions/cache/usage-by-repository'],
    getActionsCacheUsageForOrg: ['GET /orgs/{org}/actions/cache/usage'],
    getAllowedActionsOrganization: ['GET /orgs/{org}/actions/permissions/selected-actions'],
    getAllowedActionsRepository: ['GET /repos/{owner}/{repo}/actions/permissions/selected-actions'],
    getArtifact: ['GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}'],
    getCustomOidcSubClaimForRepo: ['GET /repos/{owner}/{repo}/actions/oidc/customization/sub'],
    getEnvironmentPublicKey: ['GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/public-key'],
    getEnvironmentSecret: ['GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}'],
    getEnvironmentVariable: ['GET /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}'],
    getGithubActionsDefaultWorkflowPermissionsOrganization: ['GET /orgs/{org}/actions/permissions/workflow'],
    getGithubActionsDefaultWorkflowPermissionsRepository: ['GET /repos/{owner}/{repo}/actions/permissions/workflow'],
    getGithubActionsPermissionsOrganization: ['GET /orgs/{org}/actions/permissions'],
    getGithubActionsPermissionsRepository: ['GET /repos/{owner}/{repo}/actions/permissions'],
    getHostedRunnerForOrg: ['GET /orgs/{org}/actions/hosted-runners/{hosted_runner_id}'],
    getHostedRunnersGithubOwnedImagesForOrg: ['GET /orgs/{org}/actions/hosted-runners/images/github-owned'],
    getHostedRunnersLimitsForOrg: ['GET /orgs/{org}/actions/hosted-runners/limits'],
    getHostedRunnersMachineSpecsForOrg: ['GET /orgs/{org}/actions/hosted-runners/machine-sizes'],
    getHostedRunnersPartnerImagesForOrg: ['GET /orgs/{org}/actions/hosted-runners/images/partner'],
    getHostedRunnersPlatformsForOrg: ['GET /orgs/{org}/actions/hosted-runners/platforms'],
    getJobForWorkflowRun: ['GET /repos/{owner}/{repo}/actions/jobs/{job_id}'],
    getOrgPublicKey: ['GET /orgs/{org}/actions/secrets/public-key'],
    getOrgSecret: ['GET /orgs/{org}/actions/secrets/{secret_name}'],
    getOrgVariable: ['GET /orgs/{org}/actions/variables/{name}'],
    getPendingDeploymentsForRun: ['GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments'],
    getRepoPermissions: [
      'GET /repos/{owner}/{repo}/actions/permissions',
      {},
      { renamed: ['actions', 'getGithubActionsPermissionsRepository'] },
    ],
    getRepoPublicKey: ['GET /repos/{owner}/{repo}/actions/secrets/public-key'],
    getRepoSecret: ['GET /repos/{owner}/{repo}/actions/secrets/{secret_name}'],
    getRepoVariable: ['GET /repos/{owner}/{repo}/actions/variables/{name}'],
    getReviewsForRun: ['GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals'],
    getSelfHostedRunnerForOrg: ['GET /orgs/{org}/actions/runners/{runner_id}'],
    getSelfHostedRunnerForRepo: ['GET /repos/{owner}/{repo}/actions/runners/{runner_id}'],
    getWorkflow: ['GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}'],
    getWorkflowAccessToRepository: ['GET /repos/{owner}/{repo}/actions/permissions/access'],
    getWorkflowRun: ['GET /repos/{owner}/{repo}/actions/runs/{run_id}'],
    getWorkflowRunAttempt: ['GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}'],
    getWorkflowRunUsage: ['GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing'],
    getWorkflowUsage: ['GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing'],
    listArtifactsForRepo: ['GET /repos/{owner}/{repo}/actions/artifacts'],
    listEnvironmentSecrets: ['GET /repos/{owner}/{repo}/environments/{environment_name}/secrets'],
    listEnvironmentVariables: ['GET /repos/{owner}/{repo}/environments/{environment_name}/variables'],
    listGithubHostedRunnersInGroupForOrg: ['GET /orgs/{org}/actions/runner-groups/{runner_group_id}/hosted-runners'],
    listHostedRunnersForOrg: ['GET /orgs/{org}/actions/hosted-runners'],
    listJobsForWorkflowRun: ['GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs'],
    listJobsForWorkflowRunAttempt: ['GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs'],
    listLabelsForSelfHostedRunnerForOrg: ['GET /orgs/{org}/actions/runners/{runner_id}/labels'],
    listLabelsForSelfHostedRunnerForRepo: ['GET /repos/{owner}/{repo}/actions/runners/{runner_id}/labels'],
    listOrgSecrets: ['GET /orgs/{org}/actions/secrets'],
    listOrgVariables: ['GET /orgs/{org}/actions/variables'],
    listRepoOrganizationSecrets: ['GET /repos/{owner}/{repo}/actions/organization-secrets'],
    listRepoOrganizationVariables: ['GET /repos/{owner}/{repo}/actions/organization-variables'],
    listRepoSecrets: ['GET /repos/{owner}/{repo}/actions/secrets'],
    listRepoVariables: ['GET /repos/{owner}/{repo}/actions/variables'],
    listRepoWorkflows: ['GET /repos/{owner}/{repo}/actions/workflows'],
    listRunnerApplicationsForOrg: ['GET /orgs/{org}/actions/runners/downloads'],
    listRunnerApplicationsForRepo: ['GET /repos/{owner}/{repo}/actions/runners/downloads'],
    listSelectedReposForOrgSecret: ['GET /orgs/{org}/actions/secrets/{secret_name}/repositories'],
    listSelectedReposForOrgVariable: ['GET /orgs/{org}/actions/variables/{name}/repositories'],
    listSelectedRepositoriesEnabledGithubActionsOrganization: ['GET /orgs/{org}/actions/permissions/repositories'],
    listSelfHostedRunnersForOrg: ['GET /orgs/{org}/actions/runners'],
    listSelfHostedRunnersForRepo: ['GET /repos/{owner}/{repo}/actions/runners'],
    listWorkflowRunArtifacts: ['GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts'],
    listWorkflowRuns: ['GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs'],
    listWorkflowRunsForRepo: ['GET /repos/{owner}/{repo}/actions/runs'],
    reRunJobForWorkflowRun: ['POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun'],
    reRunWorkflow: ['POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun'],
    reRunWorkflowFailedJobs: ['POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs'],
    removeAllCustomLabelsFromSelfHostedRunnerForOrg: ['DELETE /orgs/{org}/actions/runners/{runner_id}/labels'],
    removeAllCustomLabelsFromSelfHostedRunnerForRepo: [
      'DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels',
    ],
    removeCustomLabelFromSelfHostedRunnerForOrg: ['DELETE /orgs/{org}/actions/runners/{runner_id}/labels/{name}'],
    removeCustomLabelFromSelfHostedRunnerForRepo: [
      'DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels/{name}',
    ],
    removeSelectedRepoFromOrgSecret: ['DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}'],
    removeSelectedRepoFromOrgVariable: ['DELETE /orgs/{org}/actions/variables/{name}/repositories/{repository_id}'],
    reviewCustomGatesForRun: ['POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule'],
    reviewPendingDeploymentsForRun: ['POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments'],
    setAllowedActionsOrganization: ['PUT /orgs/{org}/actions/permissions/selected-actions'],
    setAllowedActionsRepository: ['PUT /repos/{owner}/{repo}/actions/permissions/selected-actions'],
    setCustomLabelsForSelfHostedRunnerForOrg: ['PUT /orgs/{org}/actions/runners/{runner_id}/labels'],
    setCustomLabelsForSelfHostedRunnerForRepo: ['PUT /repos/{owner}/{repo}/actions/runners/{runner_id}/labels'],
    setCustomOidcSubClaimForRepo: ['PUT /repos/{owner}/{repo}/actions/oidc/customization/sub'],
    setGithubActionsDefaultWorkflowPermissionsOrganization: ['PUT /orgs/{org}/actions/permissions/workflow'],
    setGithubActionsDefaultWorkflowPermissionsRepository: ['PUT /repos/{owner}/{repo}/actions/permissions/workflow'],
    setGithubActionsPermissionsOrganization: ['PUT /orgs/{org}/actions/permissions'],
    setGithubActionsPermissionsRepository: ['PUT /repos/{owner}/{repo}/actions/permissions'],
    setSelectedReposForOrgSecret: ['PUT /orgs/{org}/actions/secrets/{secret_name}/repositories'],
    setSelectedReposForOrgVariable: ['PUT /orgs/{org}/actions/variables/{name}/repositories'],
    setSelectedRepositoriesEnabledGithubActionsOrganization: ['PUT /orgs/{org}/actions/permissions/repositories'],
    setWorkflowAccessToRepository: ['PUT /repos/{owner}/{repo}/actions/permissions/access'],
    updateEnvironmentVariable: ['PATCH /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}'],
    updateHostedRunnerForOrg: ['PATCH /orgs/{org}/actions/hosted-runners/{hosted_runner_id}'],
    updateOrgVariable: ['PATCH /orgs/{org}/actions/variables/{name}'],
    updateRepoVariable: ['PATCH /repos/{owner}/{repo}/actions/variables/{name}'],
  },
  activity: {
    checkRepoIsStarredByAuthenticatedUser: ['GET /user/starred/{owner}/{repo}'],
    deleteRepoSubscription: ['DELETE /repos/{owner}/{repo}/subscription'],
    deleteThreadSubscription: ['DELETE /notifications/threads/{thread_id}/subscription'],
    getFeeds: ['GET /feeds'],
    getRepoSubscription: ['GET /repos/{owner}/{repo}/subscription'],
    getThread: ['GET /notifications/threads/{thread_id}'],
    getThreadSubscriptionForAuthenticatedUser: ['GET /notifications/threads/{thread_id}/subscription'],
    listEventsForAuthenticatedUser: ['GET /users/{username}/events'],
    listNotificationsForAuthenticatedUser: ['GET /notifications'],
    listOrgEventsForAuthenticatedUser: ['GET /users/{username}/events/orgs/{org}'],
    listPublicEvents: ['GET /events'],
    listPublicEventsForRepoNetwork: ['GET /networks/{owner}/{repo}/events'],
    listPublicEventsForUser: ['GET /users/{username}/events/public'],
    listPublicOrgEvents: ['GET /orgs/{org}/events'],
    listReceivedEventsForUser: ['GET /users/{username}/received_events'],
    listReceivedPublicEventsForUser: ['GET /users/{username}/received_events/public'],
    listRepoEvents: ['GET /repos/{owner}/{repo}/events'],
    listRepoNotificationsForAuthenticatedUser: ['GET /repos/{owner}/{repo}/notifications'],
    listReposStarredByAuthenticatedUser: ['GET /user/starred'],
    listReposStarredByUser: ['GET /users/{username}/starred'],
    listReposWatchedByUser: ['GET /users/{username}/subscriptions'],
    listStargazersForRepo: ['GET /repos/{owner}/{repo}/stargazers'],
    listWatchedReposForAuthenticatedUser: ['GET /user/subscriptions'],
    listWatchersForRepo: ['GET /repos/{owner}/{repo}/subscribers'],
    markNotificationsAsRead: ['PUT /notifications'],
    markRepoNotificationsAsRead: ['PUT /repos/{owner}/{repo}/notifications'],
    markThreadAsDone: ['DELETE /notifications/threads/{thread_id}'],
    markThreadAsRead: ['PATCH /notifications/threads/{thread_id}'],
    setRepoSubscription: ['PUT /repos/{owner}/{repo}/subscription'],
    setThreadSubscription: ['PUT /notifications/threads/{thread_id}/subscription'],
    starRepoForAuthenticatedUser: ['PUT /user/starred/{owner}/{repo}'],
    unstarRepoForAuthenticatedUser: ['DELETE /user/starred/{owner}/{repo}'],
  },
  apps: {
    addRepoToInstallation: [
      'PUT /user/installations/{installation_id}/repositories/{repository_id}',
      {},
      { renamed: ['apps', 'addRepoToInstallationForAuthenticatedUser'] },
    ],
    addRepoToInstallationForAuthenticatedUser: [
      'PUT /user/installations/{installation_id}/repositories/{repository_id}',
    ],
    checkToken: ['POST /applications/{client_id}/token'],
    createFromManifest: ['POST /app-manifests/{code}/conversions'],
    createInstallationAccessToken: ['POST /app/installations/{installation_id}/access_tokens'],
    deleteAuthorization: ['DELETE /applications/{client_id}/grant'],
    deleteInstallation: ['DELETE /app/installations/{installation_id}'],
    deleteToken: ['DELETE /applications/{client_id}/token'],
    getAuthenticated: ['GET /app'],
    getBySlug: ['GET /apps/{app_slug}'],
    getInstallation: ['GET /app/installations/{installation_id}'],
    getOrgInstallation: ['GET /orgs/{org}/installation'],
    getRepoInstallation: ['GET /repos/{owner}/{repo}/installation'],
    getSubscriptionPlanForAccount: ['GET /marketplace_listing/accounts/{account_id}'],
    getSubscriptionPlanForAccountStubbed: ['GET /marketplace_listing/stubbed/accounts/{account_id}'],
    getUserInstallation: ['GET /users/{username}/installation'],
    getWebhookConfigForApp: ['GET /app/hook/config'],
    getWebhookDelivery: ['GET /app/hook/deliveries/{delivery_id}'],
    listAccountsForPlan: ['GET /marketplace_listing/plans/{plan_id}/accounts'],
    listAccountsForPlanStubbed: ['GET /marketplace_listing/stubbed/plans/{plan_id}/accounts'],
    listInstallationReposForAuthenticatedUser: ['GET /user/installations/{installation_id}/repositories'],
    listInstallationRequestsForAuthenticatedApp: ['GET /app/installation-requests'],
    listInstallations: ['GET /app/installations'],
    listInstallationsForAuthenticatedUser: ['GET /user/installations'],
    listPlans: ['GET /marketplace_listing/plans'],
    listPlansStubbed: ['GET /marketplace_listing/stubbed/plans'],
    listReposAccessibleToInstallation: ['GET /installation/repositories'],
    listSubscriptionsForAuthenticatedUser: ['GET /user/marketplace_purchases'],
    listSubscriptionsForAuthenticatedUserStubbed: ['GET /user/marketplace_purchases/stubbed'],
    listWebhookDeliveries: ['GET /app/hook/deliveries'],
    redeliverWebhookDelivery: ['POST /app/hook/deliveries/{delivery_id}/attempts'],
    removeRepoFromInstallation: [
      'DELETE /user/installations/{installation_id}/repositories/{repository_id}',
      {},
      { renamed: ['apps', 'removeRepoFromInstallationForAuthenticatedUser'] },
    ],
    removeRepoFromInstallationForAuthenticatedUser: [
      'DELETE /user/installations/{installation_id}/repositories/{repository_id}',
    ],
    resetToken: ['PATCH /applications/{client_id}/token'],
    revokeInstallationAccessToken: ['DELETE /installation/token'],
    scopeToken: ['POST /applications/{client_id}/token/scoped'],
    suspendInstallation: ['PUT /app/installations/{installation_id}/suspended'],
    unsuspendInstallation: ['DELETE /app/installations/{installation_id}/suspended'],
    updateWebhookConfigForApp: ['PATCH /app/hook/config'],
  },
  billing: {
    getGithubActionsBillingOrg: ['GET /orgs/{org}/settings/billing/actions'],
    getGithubActionsBillingUser: ['GET /users/{username}/settings/billing/actions'],
    getGithubBillingUsageReportOrg: ['GET /organizations/{org}/settings/billing/usage'],
    getGithubPackagesBillingOrg: ['GET /orgs/{org}/settings/billing/packages'],
    getGithubPackagesBillingUser: ['GET /users/{username}/settings/billing/packages'],
    getSharedStorageBillingOrg: ['GET /orgs/{org}/settings/billing/shared-storage'],
    getSharedStorageBillingUser: ['GET /users/{username}/settings/billing/shared-storage'],
  },
  checks: {
    create: ['POST /repos/{owner}/{repo}/check-runs'],
    createSuite: ['POST /repos/{owner}/{repo}/check-suites'],
    get: ['GET /repos/{owner}/{repo}/check-runs/{check_run_id}'],
    getSuite: ['GET /repos/{owner}/{repo}/check-suites/{check_suite_id}'],
    listAnnotations: ['GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations'],
    listForRef: ['GET /repos/{owner}/{repo}/commits/{ref}/check-runs'],
    listForSuite: ['GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs'],
    listSuitesForRef: ['GET /repos/{owner}/{repo}/commits/{ref}/check-suites'],
    rerequestRun: ['POST /repos/{owner}/{repo}/check-runs/{check_run_id}/rerequest'],
    rerequestSuite: ['POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest'],
    setSuitesPreferences: ['PATCH /repos/{owner}/{repo}/check-suites/preferences'],
    update: ['PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}'],
  },
  codeScanning: {
    commitAutofix: ['POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits'],
    createAutofix: ['POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'],
    createVariantAnalysis: ['POST /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses'],
    deleteAnalysis: ['DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}{?confirm_delete}'],
    deleteCodeqlDatabase: ['DELETE /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}'],
    getAlert: [
      'GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}',
      {},
      { renamedParameters: { alert_id: 'alert_number' } },
    ],
    getAnalysis: ['GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}'],
    getAutofix: ['GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'],
    getCodeqlDatabase: ['GET /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}'],
    getDefaultSetup: ['GET /repos/{owner}/{repo}/code-scanning/default-setup'],
    getSarif: ['GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}'],
    getVariantAnalysis: [
      'GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}',
    ],
    getVariantAnalysisRepoTask: [
      'GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}/repos/{repo_owner}/{repo_name}',
    ],
    listAlertInstances: ['GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances'],
    listAlertsForOrg: ['GET /orgs/{org}/code-scanning/alerts'],
    listAlertsForRepo: ['GET /repos/{owner}/{repo}/code-scanning/alerts'],
    listAlertsInstances: [
      'GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances',
      {},
      { renamed: ['codeScanning', 'listAlertInstances'] },
    ],
    listCodeqlDatabases: ['GET /repos/{owner}/{repo}/code-scanning/codeql/databases'],
    listRecentAnalyses: ['GET /repos/{owner}/{repo}/code-scanning/analyses'],
    updateAlert: ['PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}'],
    updateDefaultSetup: ['PATCH /repos/{owner}/{repo}/code-scanning/default-setup'],
    uploadSarif: ['POST /repos/{owner}/{repo}/code-scanning/sarifs'],
  },
  codeSecurity: {
    attachConfiguration: ['POST /orgs/{org}/code-security/configurations/{configuration_id}/attach'],
    attachEnterpriseConfiguration: [
      'POST /enterprises/{enterprise}/code-security/configurations/{configuration_id}/attach',
    ],
    createConfiguration: ['POST /orgs/{org}/code-security/configurations'],
    createConfigurationForEnterprise: ['POST /enterprises/{enterprise}/code-security/configurations'],
    deleteConfiguration: ['DELETE /orgs/{org}/code-security/configurations/{configuration_id}'],
    deleteConfigurationForEnterprise: [
      'DELETE /enterprises/{enterprise}/code-security/configurations/{configuration_id}',
    ],
    detachConfiguration: ['DELETE /orgs/{org}/code-security/configurations/detach'],
    getConfiguration: ['GET /orgs/{org}/code-security/configurations/{configuration_id}'],
    getConfigurationForRepository: ['GET /repos/{owner}/{repo}/code-security-configuration'],
    getConfigurationsForEnterprise: ['GET /enterprises/{enterprise}/code-security/configurations'],
    getConfigurationsForOrg: ['GET /orgs/{org}/code-security/configurations'],
    getDefaultConfigurations: ['GET /orgs/{org}/code-security/configurations/defaults'],
    getDefaultConfigurationsForEnterprise: ['GET /enterprises/{enterprise}/code-security/configurations/defaults'],
    getRepositoriesForConfiguration: ['GET /orgs/{org}/code-security/configurations/{configuration_id}/repositories'],
    getRepositoriesForEnterpriseConfiguration: [
      'GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}/repositories',
    ],
    getSingleConfigurationForEnterprise: [
      'GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}',
    ],
    setConfigurationAsDefault: ['PUT /orgs/{org}/code-security/configurations/{configuration_id}/defaults'],
    setConfigurationAsDefaultForEnterprise: [
      'PUT /enterprises/{enterprise}/code-security/configurations/{configuration_id}/defaults',
    ],
    updateConfiguration: ['PATCH /orgs/{org}/code-security/configurations/{configuration_id}'],
    updateEnterpriseConfiguration: ['PATCH /enterprises/{enterprise}/code-security/configurations/{configuration_id}'],
  },
  codesOfConduct: {
    getAllCodesOfConduct: ['GET /codes_of_conduct'],
    getConductCode: ['GET /codes_of_conduct/{key}'],
  },
  codespaces: {
    addRepositoryForSecretForAuthenticatedUser: [
      'PUT /user/codespaces/secrets/{secret_name}/repositories/{repository_id}',
    ],
    addSelectedRepoToOrgSecret: ['PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}'],
    checkPermissionsForDevcontainer: ['GET /repos/{owner}/{repo}/codespaces/permissions_check'],
    codespaceMachinesForAuthenticatedUser: ['GET /user/codespaces/{codespace_name}/machines'],
    createForAuthenticatedUser: ['POST /user/codespaces'],
    createOrUpdateOrgSecret: ['PUT /orgs/{org}/codespaces/secrets/{secret_name}'],
    createOrUpdateRepoSecret: ['PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name}'],
    createOrUpdateSecretForAuthenticatedUser: ['PUT /user/codespaces/secrets/{secret_name}'],
    createWithPrForAuthenticatedUser: ['POST /repos/{owner}/{repo}/pulls/{pull_number}/codespaces'],
    createWithRepoForAuthenticatedUser: ['POST /repos/{owner}/{repo}/codespaces'],
    deleteForAuthenticatedUser: ['DELETE /user/codespaces/{codespace_name}'],
    deleteFromOrganization: ['DELETE /orgs/{org}/members/{username}/codespaces/{codespace_name}'],
    deleteOrgSecret: ['DELETE /orgs/{org}/codespaces/secrets/{secret_name}'],
    deleteRepoSecret: ['DELETE /repos/{owner}/{repo}/codespaces/secrets/{secret_name}'],
    deleteSecretForAuthenticatedUser: ['DELETE /user/codespaces/secrets/{secret_name}'],
    exportForAuthenticatedUser: ['POST /user/codespaces/{codespace_name}/exports'],
    getCodespacesForUserInOrg: ['GET /orgs/{org}/members/{username}/codespaces'],
    getExportDetailsForAuthenticatedUser: ['GET /user/codespaces/{codespace_name}/exports/{export_id}'],
    getForAuthenticatedUser: ['GET /user/codespaces/{codespace_name}'],
    getOrgPublicKey: ['GET /orgs/{org}/codespaces/secrets/public-key'],
    getOrgSecret: ['GET /orgs/{org}/codespaces/secrets/{secret_name}'],
    getPublicKeyForAuthenticatedUser: ['GET /user/codespaces/secrets/public-key'],
    getRepoPublicKey: ['GET /repos/{owner}/{repo}/codespaces/secrets/public-key'],
    getRepoSecret: ['GET /repos/{owner}/{repo}/codespaces/secrets/{secret_name}'],
    getSecretForAuthenticatedUser: ['GET /user/codespaces/secrets/{secret_name}'],
    listDevcontainersInRepositoryForAuthenticatedUser: ['GET /repos/{owner}/{repo}/codespaces/devcontainers'],
    listForAuthenticatedUser: ['GET /user/codespaces'],
    listInOrganization: ['GET /orgs/{org}/codespaces', {}, { renamedParameters: { org_id: 'org' } }],
    listInRepositoryForAuthenticatedUser: ['GET /repos/{owner}/{repo}/codespaces'],
    listOrgSecrets: ['GET /orgs/{org}/codespaces/secrets'],
    listRepoSecrets: ['GET /repos/{owner}/{repo}/codespaces/secrets'],
    listRepositoriesForSecretForAuthenticatedUser: ['GET /user/codespaces/secrets/{secret_name}/repositories'],
    listSecretsForAuthenticatedUser: ['GET /user/codespaces/secrets'],
    listSelectedReposForOrgSecret: ['GET /orgs/{org}/codespaces/secrets/{secret_name}/repositories'],
    preFlightWithRepoForAuthenticatedUser: ['GET /repos/{owner}/{repo}/codespaces/new'],
    publishForAuthenticatedUser: ['POST /user/codespaces/{codespace_name}/publish'],
    removeRepositoryForSecretForAuthenticatedUser: [
      'DELETE /user/codespaces/secrets/{secret_name}/repositories/{repository_id}',
    ],
    removeSelectedRepoFromOrgSecret: [
      'DELETE /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}',
    ],
    repoMachinesForAuthenticatedUser: ['GET /repos/{owner}/{repo}/codespaces/machines'],
    setRepositoriesForSecretForAuthenticatedUser: ['PUT /user/codespaces/secrets/{secret_name}/repositories'],
    setSelectedReposForOrgSecret: ['PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories'],
    startForAuthenticatedUser: ['POST /user/codespaces/{codespace_name}/start'],
    stopForAuthenticatedUser: ['POST /user/codespaces/{codespace_name}/stop'],
    stopInOrganization: ['POST /orgs/{org}/members/{username}/codespaces/{codespace_name}/stop'],
    updateForAuthenticatedUser: ['PATCH /user/codespaces/{codespace_name}'],
  },
  copilot: {
    addCopilotSeatsForTeams: ['POST /orgs/{org}/copilot/billing/selected_teams'],
    addCopilotSeatsForUsers: ['POST /orgs/{org}/copilot/billing/selected_users'],
    cancelCopilotSeatAssignmentForTeams: ['DELETE /orgs/{org}/copilot/billing/selected_teams'],
    cancelCopilotSeatAssignmentForUsers: ['DELETE /orgs/{org}/copilot/billing/selected_users'],
    copilotMetricsForOrganization: ['GET /orgs/{org}/copilot/metrics'],
    copilotMetricsForTeam: ['GET /orgs/{org}/team/{team_slug}/copilot/metrics'],
    getCopilotOrganizationDetails: ['GET /orgs/{org}/copilot/billing'],
    getCopilotSeatDetailsForUser: ['GET /orgs/{org}/members/{username}/copilot'],
    listCopilotSeats: ['GET /orgs/{org}/copilot/billing/seats'],
    usageMetricsForOrg: ['GET /orgs/{org}/copilot/usage'],
    usageMetricsForTeam: ['GET /orgs/{org}/team/{team_slug}/copilot/usage'],
  },
  dependabot: {
    addSelectedRepoToOrgSecret: ['PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}'],
    createOrUpdateOrgSecret: ['PUT /orgs/{org}/dependabot/secrets/{secret_name}'],
    createOrUpdateRepoSecret: ['PUT /repos/{owner}/{repo}/dependabot/secrets/{secret_name}'],
    deleteOrgSecret: ['DELETE /orgs/{org}/dependabot/secrets/{secret_name}'],
    deleteRepoSecret: ['DELETE /repos/{owner}/{repo}/dependabot/secrets/{secret_name}'],
    getAlert: ['GET /repos/{owner}/{repo}/dependabot/alerts/{alert_number}'],
    getOrgPublicKey: ['GET /orgs/{org}/dependabot/secrets/public-key'],
    getOrgSecret: ['GET /orgs/{org}/dependabot/secrets/{secret_name}'],
    getRepoPublicKey: ['GET /repos/{owner}/{repo}/dependabot/secrets/public-key'],
    getRepoSecret: ['GET /repos/{owner}/{repo}/dependabot/secrets/{secret_name}'],
    listAlertsForEnterprise: ['GET /enterprises/{enterprise}/dependabot/alerts'],
    listAlertsForOrg: ['GET /orgs/{org}/dependabot/alerts'],
    listAlertsForRepo: ['GET /repos/{owner}/{repo}/dependabot/alerts'],
    listOrgSecrets: ['GET /orgs/{org}/dependabot/secrets'],
    listRepoSecrets: ['GET /repos/{owner}/{repo}/dependabot/secrets'],
    listSelectedReposForOrgSecret: ['GET /orgs/{org}/dependabot/secrets/{secret_name}/repositories'],
    removeSelectedRepoFromOrgSecret: [
      'DELETE /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}',
    ],
    setSelectedReposForOrgSecret: ['PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories'],
    updateAlert: ['PATCH /repos/{owner}/{repo}/dependabot/alerts/{alert_number}'],
  },
  dependencyGraph: {
    createRepositorySnapshot: ['POST /repos/{owner}/{repo}/dependency-graph/snapshots'],
    diffRange: ['GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}'],
    exportSbom: ['GET /repos/{owner}/{repo}/dependency-graph/sbom'],
  },
  emojis: { get: ['GET /emojis'] },
  gists: {
    checkIsStarred: ['GET /gists/{gist_id}/star'],
    create: ['POST /gists'],
    createComment: ['POST /gists/{gist_id}/comments'],
    delete: ['DELETE /gists/{gist_id}'],
    deleteComment: ['DELETE /gists/{gist_id}/comments/{comment_id}'],
    fork: ['POST /gists/{gist_id}/forks'],
    get: ['GET /gists/{gist_id}'],
    getComment: ['GET /gists/{gist_id}/comments/{comment_id}'],
    getRevision: ['GET /gists/{gist_id}/{sha}'],
    list: ['GET /gists'],
    listComments: ['GET /gists/{gist_id}/comments'],
    listCommits: ['GET /gists/{gist_id}/commits'],
    listForUser: ['GET /users/{username}/gists'],
    listForks: ['GET /gists/{gist_id}/forks'],
    listPublic: ['GET /gists/public'],
    listStarred: ['GET /gists/starred'],
    star: ['PUT /gists/{gist_id}/star'],
    unstar: ['DELETE /gists/{gist_id}/star'],
    update: ['PATCH /gists/{gist_id}'],
    updateComment: ['PATCH /gists/{gist_id}/comments/{comment_id}'],
  },
  git: {
    createBlob: ['POST /repos/{owner}/{repo}/git/blobs'],
    createCommit: ['POST /repos/{owner}/{repo}/git/commits'],
    createRef: ['POST /repos/{owner}/{repo}/git/refs'],
    createTag: ['POST /repos/{owner}/{repo}/git/tags'],
    createTree: ['POST /repos/{owner}/{repo}/git/trees'],
    deleteRef: ['DELETE /repos/{owner}/{repo}/git/refs/{ref}'],
    getBlob: ['GET /repos/{owner}/{repo}/git/blobs/{file_sha}'],
    getCommit: ['GET /repos/{owner}/{repo}/git/commits/{commit_sha}'],
    getRef: ['GET /repos/{owner}/{repo}/git/ref/{ref}'],
    getTag: ['GET /repos/{owner}/{repo}/git/tags/{tag_sha}'],
    getTree: ['GET /repos/{owner}/{repo}/git/trees/{tree_sha}'],
    listMatchingRefs: ['GET /repos/{owner}/{repo}/git/matching-refs/{ref}'],
    updateRef: ['PATCH /repos/{owner}/{repo}/git/refs/{ref}'],
  },
  gitignore: {
    getAllTemplates: ['GET /gitignore/templates'],
    getTemplate: ['GET /gitignore/templates/{name}'],
  },
  hostedCompute: {
    createNetworkConfigurationForOrg: ['POST /orgs/{org}/settings/network-configurations'],
    deleteNetworkConfigurationFromOrg: [
      'DELETE /orgs/{org}/settings/network-configurations/{network_configuration_id}',
    ],
    getNetworkConfigurationForOrg: ['GET /orgs/{org}/settings/network-configurations/{network_configuration_id}'],
    getNetworkSettingsForOrg: ['GET /orgs/{org}/settings/network-settings/{network_settings_id}'],
    listNetworkConfigurationsForOrg: ['GET /orgs/{org}/settings/network-configurations'],
    updateNetworkConfigurationForOrg: ['PATCH /orgs/{org}/settings/network-configurations/{network_configuration_id}'],
  },
  interactions: {
    getRestrictionsForAuthenticatedUser: ['GET /user/interaction-limits'],
    getRestrictionsForOrg: ['GET /orgs/{org}/interaction-limits'],
    getRestrictionsForRepo: ['GET /repos/{owner}/{repo}/interaction-limits'],
    getRestrictionsForYourPublicRepos: [
      'GET /user/interaction-limits',
      {},
      { renamed: ['interactions', 'getRestrictionsForAuthenticatedUser'] },
    ],
    removeRestrictionsForAuthenticatedUser: ['DELETE /user/interaction-limits'],
    removeRestrictionsForOrg: ['DELETE /orgs/{org}/interaction-limits'],
    removeRestrictionsForRepo: ['DELETE /repos/{owner}/{repo}/interaction-limits'],
    removeRestrictionsForYourPublicRepos: [
      'DELETE /user/interaction-limits',
      {},
      { renamed: ['interactions', 'removeRestrictionsForAuthenticatedUser'] },
    ],
    setRestrictionsForAuthenticatedUser: ['PUT /user/interaction-limits'],
    setRestrictionsForOrg: ['PUT /orgs/{org}/interaction-limits'],
    setRestrictionsForRepo: ['PUT /repos/{owner}/{repo}/interaction-limits'],
    setRestrictionsForYourPublicRepos: [
      'PUT /user/interaction-limits',
      {},
      { renamed: ['interactions', 'setRestrictionsForAuthenticatedUser'] },
    ],
  },
  issues: {
    addAssignees: ['POST /repos/{owner}/{repo}/issues/{issue_number}/assignees'],
    addLabels: ['POST /repos/{owner}/{repo}/issues/{issue_number}/labels'],
    addSubIssue: ['POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues'],
    checkUserCanBeAssigned: ['GET /repos/{owner}/{repo}/assignees/{assignee}'],
    checkUserCanBeAssignedToIssue: ['GET /repos/{owner}/{repo}/issues/{issue_number}/assignees/{assignee}'],
    create: ['POST /repos/{owner}/{repo}/issues'],
    createComment: ['POST /repos/{owner}/{repo}/issues/{issue_number}/comments'],
    createLabel: ['POST /repos/{owner}/{repo}/labels'],
    createMilestone: ['POST /repos/{owner}/{repo}/milestones'],
    deleteComment: ['DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}'],
    deleteLabel: ['DELETE /repos/{owner}/{repo}/labels/{name}'],
    deleteMilestone: ['DELETE /repos/{owner}/{repo}/milestones/{milestone_number}'],
    get: ['GET /repos/{owner}/{repo}/issues/{issue_number}'],
    getComment: ['GET /repos/{owner}/{repo}/issues/comments/{comment_id}'],
    getEvent: ['GET /repos/{owner}/{repo}/issues/events/{event_id}'],
    getLabel: ['GET /repos/{owner}/{repo}/labels/{name}'],
    getMilestone: ['GET /repos/{owner}/{repo}/milestones/{milestone_number}'],
    list: ['GET /issues'],
    listAssignees: ['GET /repos/{owner}/{repo}/assignees'],
    listComments: ['GET /repos/{owner}/{repo}/issues/{issue_number}/comments'],
    listCommentsForRepo: ['GET /repos/{owner}/{repo}/issues/comments'],
    listEvents: ['GET /repos/{owner}/{repo}/issues/{issue_number}/events'],
    listEventsForRepo: ['GET /repos/{owner}/{repo}/issues/events'],
    listEventsForTimeline: ['GET /repos/{owner}/{repo}/issues/{issue_number}/timeline'],
    listForAuthenticatedUser: ['GET /user/issues'],
    listForOrg: ['GET /orgs/{org}/issues'],
    listForRepo: ['GET /repos/{owner}/{repo}/issues'],
    listLabelsForMilestone: ['GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels'],
    listLabelsForRepo: ['GET /repos/{owner}/{repo}/labels'],
    listLabelsOnIssue: ['GET /repos/{owner}/{repo}/issues/{issue_number}/labels'],
    listMilestones: ['GET /repos/{owner}/{repo}/milestones'],
    listSubIssues: ['GET /repos/{owner}/{repo}/issues/{issue_number}/sub_issues'],
    lock: ['PUT /repos/{owner}/{repo}/issues/{issue_number}/lock'],
    removeAllLabels: ['DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels'],
    removeAssignees: ['DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees'],
    removeLabel: ['DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}'],
    removeSubIssue: ['DELETE /repos/{owner}/{repo}/issues/{issue_number}/sub_issue'],
    reprioritizeSubIssue: ['PATCH /repos/{owner}/{repo}/issues/{issue_number}/sub_issues/priority'],
    setLabels: ['PUT /repos/{owner}/{repo}/issues/{issue_number}/labels'],
    unlock: ['DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock'],
    update: ['PATCH /repos/{owner}/{repo}/issues/{issue_number}'],
    updateComment: ['PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}'],
    updateLabel: ['PATCH /repos/{owner}/{repo}/labels/{name}'],
    updateMilestone: ['PATCH /repos/{owner}/{repo}/milestones/{milestone_number}'],
  },
  licenses: {
    get: ['GET /licenses/{license}'],
    getAllCommonlyUsed: ['GET /licenses'],
    getForRepo: ['GET /repos/{owner}/{repo}/license'],
  },
  markdown: {
    render: ['POST /markdown'],
    renderRaw: ['POST /markdown/raw', { headers: { 'content-type': 'text/plain; charset=utf-8' } }],
  },
  meta: {
    get: ['GET /meta'],
    getAllVersions: ['GET /versions'],
    getOctocat: ['GET /octocat'],
    getZen: ['GET /zen'],
    root: ['GET /'],
  },
  migrations: {
    deleteArchiveForAuthenticatedUser: ['DELETE /user/migrations/{migration_id}/archive'],
    deleteArchiveForOrg: ['DELETE /orgs/{org}/migrations/{migration_id}/archive'],
    downloadArchiveForOrg: ['GET /orgs/{org}/migrations/{migration_id}/archive'],
    getArchiveForAuthenticatedUser: ['GET /user/migrations/{migration_id}/archive'],
    getStatusForAuthenticatedUser: ['GET /user/migrations/{migration_id}'],
    getStatusForOrg: ['GET /orgs/{org}/migrations/{migration_id}'],
    listForAuthenticatedUser: ['GET /user/migrations'],
    listForOrg: ['GET /orgs/{org}/migrations'],
    listReposForAuthenticatedUser: ['GET /user/migrations/{migration_id}/repositories'],
    listReposForOrg: ['GET /orgs/{org}/migrations/{migration_id}/repositories'],
    listReposForUser: [
      'GET /user/migrations/{migration_id}/repositories',
      {},
      { renamed: ['migrations', 'listReposForAuthenticatedUser'] },
    ],
    startForAuthenticatedUser: ['POST /user/migrations'],
    startForOrg: ['POST /orgs/{org}/migrations'],
    unlockRepoForAuthenticatedUser: ['DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock'],
    unlockRepoForOrg: ['DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock'],
  },
  oidc: {
    getOidcCustomSubTemplateForOrg: ['GET /orgs/{org}/actions/oidc/customization/sub'],
    updateOidcCustomSubTemplateForOrg: ['PUT /orgs/{org}/actions/oidc/customization/sub'],
  },
  orgs: {
    addSecurityManagerTeam: [
      'PUT /orgs/{org}/security-managers/teams/{team_slug}',
      {},
      {
        deprecated:
          'octokit.rest.orgs.addSecurityManagerTeam() is deprecated, see https://docs.github.com/rest/orgs/security-managers#add-a-security-manager-team',
      },
    ],
    assignTeamToOrgRole: ['PUT /orgs/{org}/organization-roles/teams/{team_slug}/{role_id}'],
    assignUserToOrgRole: ['PUT /orgs/{org}/organization-roles/users/{username}/{role_id}'],
    blockUser: ['PUT /orgs/{org}/blocks/{username}'],
    cancelInvitation: ['DELETE /orgs/{org}/invitations/{invitation_id}'],
    checkBlockedUser: ['GET /orgs/{org}/blocks/{username}'],
    checkMembershipForUser: ['GET /orgs/{org}/members/{username}'],
    checkPublicMembershipForUser: ['GET /orgs/{org}/public_members/{username}'],
    convertMemberToOutsideCollaborator: ['PUT /orgs/{org}/outside_collaborators/{username}'],
    createInvitation: ['POST /orgs/{org}/invitations'],
    createIssueType: ['POST /orgs/{org}/issue-types'],
    createOrUpdateCustomProperties: ['PATCH /orgs/{org}/properties/schema'],
    createOrUpdateCustomPropertiesValuesForRepos: ['PATCH /orgs/{org}/properties/values'],
    createOrUpdateCustomProperty: ['PUT /orgs/{org}/properties/schema/{custom_property_name}'],
    createWebhook: ['POST /orgs/{org}/hooks'],
    delete: ['DELETE /orgs/{org}'],
    deleteIssueType: ['DELETE /orgs/{org}/issue-types/{issue_type_id}'],
    deleteWebhook: ['DELETE /orgs/{org}/hooks/{hook_id}'],
    enableOrDisableSecurityProductOnAllOrgRepos: [
      'POST /orgs/{org}/{security_product}/{enablement}',
      {},
      {
        deprecated:
          'octokit.rest.orgs.enableOrDisableSecurityProductOnAllOrgRepos() is deprecated, see https://docs.github.com/rest/orgs/orgs#enable-or-disable-a-security-feature-for-an-organization',
      },
    ],
    get: ['GET /orgs/{org}'],
    getAllCustomProperties: ['GET /orgs/{org}/properties/schema'],
    getCustomProperty: ['GET /orgs/{org}/properties/schema/{custom_property_name}'],
    getMembershipForAuthenticatedUser: ['GET /user/memberships/orgs/{org}'],
    getMembershipForUser: ['GET /orgs/{org}/memberships/{username}'],
    getOrgRole: ['GET /orgs/{org}/organization-roles/{role_id}'],
    getOrgRulesetHistory: ['GET /orgs/{org}/rulesets/{ruleset_id}/history'],
    getOrgRulesetVersion: ['GET /orgs/{org}/rulesets/{ruleset_id}/history/{version_id}'],
    getWebhook: ['GET /orgs/{org}/hooks/{hook_id}'],
    getWebhookConfigForOrg: ['GET /orgs/{org}/hooks/{hook_id}/config'],
    getWebhookDelivery: ['GET /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}'],
    list: ['GET /organizations'],
    listAppInstallations: ['GET /orgs/{org}/installations'],
    listAttestations: ['GET /orgs/{org}/attestations/{subject_digest}'],
    listBlockedUsers: ['GET /orgs/{org}/blocks'],
    listCustomPropertiesValuesForRepos: ['GET /orgs/{org}/properties/values'],
    listFailedInvitations: ['GET /orgs/{org}/failed_invitations'],
    listForAuthenticatedUser: ['GET /user/orgs'],
    listForUser: ['GET /users/{username}/orgs'],
    listInvitationTeams: ['GET /orgs/{org}/invitations/{invitation_id}/teams'],
    listIssueTypes: ['GET /orgs/{org}/issue-types'],
    listMembers: ['GET /orgs/{org}/members'],
    listMembershipsForAuthenticatedUser: ['GET /user/memberships/orgs'],
    listOrgRoleTeams: ['GET /orgs/{org}/organization-roles/{role_id}/teams'],
    listOrgRoleUsers: ['GET /orgs/{org}/organization-roles/{role_id}/users'],
    listOrgRoles: ['GET /orgs/{org}/organization-roles'],
    listOrganizationFineGrainedPermissions: ['GET /orgs/{org}/organization-fine-grained-permissions'],
    listOutsideCollaborators: ['GET /orgs/{org}/outside_collaborators'],
    listPatGrantRepositories: ['GET /orgs/{org}/personal-access-tokens/{pat_id}/repositories'],
    listPatGrantRequestRepositories: ['GET /orgs/{org}/personal-access-token-requests/{pat_request_id}/repositories'],
    listPatGrantRequests: ['GET /orgs/{org}/personal-access-token-requests'],
    listPatGrants: ['GET /orgs/{org}/personal-access-tokens'],
    listPendingInvitations: ['GET /orgs/{org}/invitations'],
    listPublicMembers: ['GET /orgs/{org}/public_members'],
    listSecurityManagerTeams: [
      'GET /orgs/{org}/security-managers',
      {},
      {
        deprecated:
          'octokit.rest.orgs.listSecurityManagerTeams() is deprecated, see https://docs.github.com/rest/orgs/security-managers#list-security-manager-teams',
      },
    ],
    listWebhookDeliveries: ['GET /orgs/{org}/hooks/{hook_id}/deliveries'],
    listWebhooks: ['GET /orgs/{org}/hooks'],
    pingWebhook: ['POST /orgs/{org}/hooks/{hook_id}/pings'],
    redeliverWebhookDelivery: ['POST /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts'],
    removeCustomProperty: ['DELETE /orgs/{org}/properties/schema/{custom_property_name}'],
    removeMember: ['DELETE /orgs/{org}/members/{username}'],
    removeMembershipForUser: ['DELETE /orgs/{org}/memberships/{username}'],
    removeOutsideCollaborator: ['DELETE /orgs/{org}/outside_collaborators/{username}'],
    removePublicMembershipForAuthenticatedUser: ['DELETE /orgs/{org}/public_members/{username}'],
    removeSecurityManagerTeam: [
      'DELETE /orgs/{org}/security-managers/teams/{team_slug}',
      {},
      {
        deprecated:
          'octokit.rest.orgs.removeSecurityManagerTeam() is deprecated, see https://docs.github.com/rest/orgs/security-managers#remove-a-security-manager-team',
      },
    ],
    reviewPatGrantRequest: ['POST /orgs/{org}/personal-access-token-requests/{pat_request_id}'],
    reviewPatGrantRequestsInBulk: ['POST /orgs/{org}/personal-access-token-requests'],
    revokeAllOrgRolesTeam: ['DELETE /orgs/{org}/organization-roles/teams/{team_slug}'],
    revokeAllOrgRolesUser: ['DELETE /orgs/{org}/organization-roles/users/{username}'],
    revokeOrgRoleTeam: ['DELETE /orgs/{org}/organization-roles/teams/{team_slug}/{role_id}'],
    revokeOrgRoleUser: ['DELETE /orgs/{org}/organization-roles/users/{username}/{role_id}'],
    setMembershipForUser: ['PUT /orgs/{org}/memberships/{username}'],
    setPublicMembershipForAuthenticatedUser: ['PUT /orgs/{org}/public_members/{username}'],
    unblockUser: ['DELETE /orgs/{org}/blocks/{username}'],
    update: ['PATCH /orgs/{org}'],
    updateIssueType: ['PUT /orgs/{org}/issue-types/{issue_type_id}'],
    updateMembershipForAuthenticatedUser: ['PATCH /user/memberships/orgs/{org}'],
    updatePatAccess: ['POST /orgs/{org}/personal-access-tokens/{pat_id}'],
    updatePatAccesses: ['POST /orgs/{org}/personal-access-tokens'],
    updateWebhook: ['PATCH /orgs/{org}/hooks/{hook_id}'],
    updateWebhookConfigForOrg: ['PATCH /orgs/{org}/hooks/{hook_id}/config'],
  },
  packages: {
    deletePackageForAuthenticatedUser: ['DELETE /user/packages/{package_type}/{package_name}'],
    deletePackageForOrg: ['DELETE /orgs/{org}/packages/{package_type}/{package_name}'],
    deletePackageForUser: ['DELETE /users/{username}/packages/{package_type}/{package_name}'],
    deletePackageVersionForAuthenticatedUser: [
      'DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}',
    ],
    deletePackageVersionForOrg: [
      'DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}',
    ],
    deletePackageVersionForUser: [
      'DELETE /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}',
    ],
    getAllPackageVersionsForAPackageOwnedByAnOrg: [
      'GET /orgs/{org}/packages/{package_type}/{package_name}/versions',
      {},
      { renamed: ['packages', 'getAllPackageVersionsForPackageOwnedByOrg'] },
    ],
    getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: [
      'GET /user/packages/{package_type}/{package_name}/versions',
      {},
      {
        renamed: ['packages', 'getAllPackageVersionsForPackageOwnedByAuthenticatedUser'],
      },
    ],
    getAllPackageVersionsForPackageOwnedByAuthenticatedUser: [
      'GET /user/packages/{package_type}/{package_name}/versions',
    ],
    getAllPackageVersionsForPackageOwnedByOrg: ['GET /orgs/{org}/packages/{package_type}/{package_name}/versions'],
    getAllPackageVersionsForPackageOwnedByUser: [
      'GET /users/{username}/packages/{package_type}/{package_name}/versions',
    ],
    getPackageForAuthenticatedUser: ['GET /user/packages/{package_type}/{package_name}'],
    getPackageForOrganization: ['GET /orgs/{org}/packages/{package_type}/{package_name}'],
    getPackageForUser: ['GET /users/{username}/packages/{package_type}/{package_name}'],
    getPackageVersionForAuthenticatedUser: [
      'GET /user/packages/{package_type}/{package_name}/versions/{package_version_id}',
    ],
    getPackageVersionForOrganization: [
      'GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}',
    ],
    getPackageVersionForUser: [
      'GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}',
    ],
    listDockerMigrationConflictingPackagesForAuthenticatedUser: ['GET /user/docker/conflicts'],
    listDockerMigrationConflictingPackagesForOrganization: ['GET /orgs/{org}/docker/conflicts'],
    listDockerMigrationConflictingPackagesForUser: ['GET /users/{username}/docker/conflicts'],
    listPackagesForAuthenticatedUser: ['GET /user/packages'],
    listPackagesForOrganization: ['GET /orgs/{org}/packages'],
    listPackagesForUser: ['GET /users/{username}/packages'],
    restorePackageForAuthenticatedUser: ['POST /user/packages/{package_type}/{package_name}/restore{?token}'],
    restorePackageForOrg: ['POST /orgs/{org}/packages/{package_type}/{package_name}/restore{?token}'],
    restorePackageForUser: ['POST /users/{username}/packages/{package_type}/{package_name}/restore{?token}'],
    restorePackageVersionForAuthenticatedUser: [
      'POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore',
    ],
    restorePackageVersionForOrg: [
      'POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore',
    ],
    restorePackageVersionForUser: [
      'POST /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore',
    ],
  },
  privateRegistries: {
    createOrgPrivateRegistry: ['POST /orgs/{org}/private-registries'],
    deleteOrgPrivateRegistry: ['DELETE /orgs/{org}/private-registries/{secret_name}'],
    getOrgPrivateRegistry: ['GET /orgs/{org}/private-registries/{secret_name}'],
    getOrgPublicKey: ['GET /orgs/{org}/private-registries/public-key'],
    listOrgPrivateRegistries: ['GET /orgs/{org}/private-registries'],
    updateOrgPrivateRegistry: ['PATCH /orgs/{org}/private-registries/{secret_name}'],
  },
  projects: {
    addCollaborator: [
      'PUT /projects/{project_id}/collaborators/{username}',
      {},
      {
        deprecated:
          'octokit.rest.projects.addCollaborator() is deprecated, see https://docs.github.com/rest/projects/collaborators#add-project-collaborator',
      },
    ],
    createCard: [
      'POST /projects/columns/{column_id}/cards',
      {},
      {
        deprecated:
          'octokit.rest.projects.createCard() is deprecated, see https://docs.github.com/rest/projects/cards#create-a-project-card',
      },
    ],
    createColumn: [
      'POST /projects/{project_id}/columns',
      {},
      {
        deprecated:
          'octokit.rest.projects.createColumn() is deprecated, see https://docs.github.com/rest/projects/columns#create-a-project-column',
      },
    ],
    createForAuthenticatedUser: [
      'POST /user/projects',
      {},
      {
        deprecated:
          'octokit.rest.projects.createForAuthenticatedUser() is deprecated, see https://docs.github.com/rest/projects/projects#create-a-user-project',
      },
    ],
    createForOrg: [
      'POST /orgs/{org}/projects',
      {},
      {
        deprecated:
          'octokit.rest.projects.createForOrg() is deprecated, see https://docs.github.com/rest/projects/projects#create-an-organization-project',
      },
    ],
    createForRepo: [
      'POST /repos/{owner}/{repo}/projects',
      {},
      {
        deprecated:
          'octokit.rest.projects.createForRepo() is deprecated, see https://docs.github.com/rest/projects/projects#create-a-repository-project',
      },
    ],
    delete: [
      'DELETE /projects/{project_id}',
      {},
      {
        deprecated:
          'octokit.rest.projects.delete() is deprecated, see https://docs.github.com/rest/projects/projects#delete-a-project',
      },
    ],
    deleteCard: [
      'DELETE /projects/columns/cards/{card_id}',
      {},
      {
        deprecated:
          'octokit.rest.projects.deleteCard() is deprecated, see https://docs.github.com/rest/projects/cards#delete-a-project-card',
      },
    ],
    deleteColumn: [
      'DELETE /projects/columns/{column_id}',
      {},
      {
        deprecated:
          'octokit.rest.projects.deleteColumn() is deprecated, see https://docs.github.com/rest/projects/columns#delete-a-project-column',
      },
    ],
    get: [
      'GET /projects/{project_id}',
      {},
      {
        deprecated:
          'octokit.rest.projects.get() is deprecated, see https://docs.github.com/rest/projects/projects#get-a-project',
      },
    ],
    getCard: [
      'GET /projects/columns/cards/{card_id}',
      {},
      {
        deprecated:
          'octokit.rest.projects.getCard() is deprecated, see https://docs.github.com/rest/projects/cards#get-a-project-card',
      },
    ],
    getColumn: [
      'GET /projects/columns/{column_id}',
      {},
      {
        deprecated:
          'octokit.rest.projects.getColumn() is deprecated, see https://docs.github.com/rest/projects/columns#get-a-project-column',
      },
    ],
    getPermissionForUser: [
      'GET /projects/{project_id}/collaborators/{username}/permission',
      {},
      {
        deprecated:
          'octokit.rest.projects.getPermissionForUser() is deprecated, see https://docs.github.com/rest/projects/collaborators#get-project-permission-for-a-user',
      },
    ],
    listCards: [
      'GET /projects/columns/{column_id}/cards',
      {},
      {
        deprecated:
          'octokit.rest.projects.listCards() is deprecated, see https://docs.github.com/rest/projects/cards#list-project-cards',
      },
    ],
    listCollaborators: [
      'GET /projects/{project_id}/collaborators',
      {},
      {
        deprecated:
          'octokit.rest.projects.listCollaborators() is deprecated, see https://docs.github.com/rest/projects/collaborators#list-project-collaborators',
      },
    ],
    listColumns: [
      'GET /projects/{project_id}/columns',
      {},
      {
        deprecated:
          'octokit.rest.projects.listColumns() is deprecated, see https://docs.github.com/rest/projects/columns#list-project-columns',
      },
    ],
    listForOrg: [
      'GET /orgs/{org}/projects',
      {},
      {
        deprecated:
          'octokit.rest.projects.listForOrg() is deprecated, see https://docs.github.com/rest/projects/projects#list-organization-projects',
      },
    ],
    listForRepo: [
      'GET /repos/{owner}/{repo}/projects',
      {},
      {
        deprecated:
          'octokit.rest.projects.listForRepo() is deprecated, see https://docs.github.com/rest/projects/projects#list-repository-projects',
      },
    ],
    listForUser: [
      'GET /users/{username}/projects',
      {},
      {
        deprecated:
          'octokit.rest.projects.listForUser() is deprecated, see https://docs.github.com/rest/projects/projects#list-user-projects',
      },
    ],
    moveCard: [
      'POST /projects/columns/cards/{card_id}/moves',
      {},
      {
        deprecated:
          'octokit.rest.projects.moveCard() is deprecated, see https://docs.github.com/rest/projects/cards#move-a-project-card',
      },
    ],
    moveColumn: [
      'POST /projects/columns/{column_id}/moves',
      {},
      {
        deprecated:
          'octokit.rest.projects.moveColumn() is deprecated, see https://docs.github.com/rest/projects/columns#move-a-project-column',
      },
    ],
    removeCollaborator: [
      'DELETE /projects/{project_id}/collaborators/{username}',
      {},
      {
        deprecated:
          'octokit.rest.projects.removeCollaborator() is deprecated, see https://docs.github.com/rest/projects/collaborators#remove-user-as-a-collaborator',
      },
    ],
    update: [
      'PATCH /projects/{project_id}',
      {},
      {
        deprecated:
          'octokit.rest.projects.update() is deprecated, see https://docs.github.com/rest/projects/projects#update-a-project',
      },
    ],
    updateCard: [
      'PATCH /projects/columns/cards/{card_id}',
      {},
      {
        deprecated:
          'octokit.rest.projects.updateCard() is deprecated, see https://docs.github.com/rest/projects/cards#update-an-existing-project-card',
      },
    ],
    updateColumn: [
      'PATCH /projects/columns/{column_id}',
      {},
      {
        deprecated:
          'octokit.rest.projects.updateColumn() is deprecated, see https://docs.github.com/rest/projects/columns#update-an-existing-project-column',
      },
    ],
  },
  pulls: {
    checkIfMerged: ['GET /repos/{owner}/{repo}/pulls/{pull_number}/merge'],
    create: ['POST /repos/{owner}/{repo}/pulls'],
    createReplyForReviewComment: ['POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies'],
    createReview: ['POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews'],
    createReviewComment: ['POST /repos/{owner}/{repo}/pulls/{pull_number}/comments'],
    deletePendingReview: ['DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}'],
    deleteReviewComment: ['DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}'],
    dismissReview: ['PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals'],
    get: ['GET /repos/{owner}/{repo}/pulls/{pull_number}'],
    getReview: ['GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}'],
    getReviewComment: ['GET /repos/{owner}/{repo}/pulls/comments/{comment_id}'],
    list: ['GET /repos/{owner}/{repo}/pulls'],
    listCommentsForReview: ['GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments'],
    listCommits: ['GET /repos/{owner}/{repo}/pulls/{pull_number}/commits'],
    listFiles: ['GET /repos/{owner}/{repo}/pulls/{pull_number}/files'],
    listRequestedReviewers: ['GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers'],
    listReviewComments: ['GET /repos/{owner}/{repo}/pulls/{pull_number}/comments'],
    listReviewCommentsForRepo: ['GET /repos/{owner}/{repo}/pulls/comments'],
    listReviews: ['GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews'],
    merge: ['PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge'],
    removeRequestedReviewers: ['DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers'],
    requestReviewers: ['POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers'],
    submitReview: ['POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events'],
    update: ['PATCH /repos/{owner}/{repo}/pulls/{pull_number}'],
    updateBranch: ['PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch'],
    updateReview: ['PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}'],
    updateReviewComment: ['PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}'],
  },
  rateLimit: { get: ['GET /rate_limit'] },
  reactions: {
    createForCommitComment: ['POST /repos/{owner}/{repo}/comments/{comment_id}/reactions'],
    createForIssue: ['POST /repos/{owner}/{repo}/issues/{issue_number}/reactions'],
    createForIssueComment: ['POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions'],
    createForPullRequestReviewComment: ['POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions'],
    createForRelease: ['POST /repos/{owner}/{repo}/releases/{release_id}/reactions'],
    createForTeamDiscussionCommentInOrg: [
      'POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions',
    ],
    createForTeamDiscussionInOrg: ['POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions'],
    deleteForCommitComment: ['DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}'],
    deleteForIssue: ['DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}'],
    deleteForIssueComment: ['DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}'],
    deleteForPullRequestComment: ['DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}'],
    deleteForRelease: ['DELETE /repos/{owner}/{repo}/releases/{release_id}/reactions/{reaction_id}'],
    deleteForTeamDiscussion: [
      'DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}',
    ],
    deleteForTeamDiscussionComment: [
      'DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}',
    ],
    listForCommitComment: ['GET /repos/{owner}/{repo}/comments/{comment_id}/reactions'],
    listForIssue: ['GET /repos/{owner}/{repo}/issues/{issue_number}/reactions'],
    listForIssueComment: ['GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions'],
    listForPullRequestReviewComment: ['GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions'],
    listForRelease: ['GET /repos/{owner}/{repo}/releases/{release_id}/reactions'],
    listForTeamDiscussionCommentInOrg: [
      'GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions',
    ],
    listForTeamDiscussionInOrg: ['GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions'],
  },
  repos: {
    acceptInvitation: [
      'PATCH /user/repository_invitations/{invitation_id}',
      {},
      { renamed: ['repos', 'acceptInvitationForAuthenticatedUser'] },
    ],
    acceptInvitationForAuthenticatedUser: ['PATCH /user/repository_invitations/{invitation_id}'],
    addAppAccessRestrictions: [
      'POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps',
      {},
      { mapToData: 'apps' },
    ],
    addCollaborator: ['PUT /repos/{owner}/{repo}/collaborators/{username}'],
    addStatusCheckContexts: [
      'POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts',
      {},
      { mapToData: 'contexts' },
    ],
    addTeamAccessRestrictions: [
      'POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams',
      {},
      { mapToData: 'teams' },
    ],
    addUserAccessRestrictions: [
      'POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users',
      {},
      { mapToData: 'users' },
    ],
    cancelPagesDeployment: ['POST /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}/cancel'],
    checkAutomatedSecurityFixes: ['GET /repos/{owner}/{repo}/automated-security-fixes'],
    checkCollaborator: ['GET /repos/{owner}/{repo}/collaborators/{username}'],
    checkPrivateVulnerabilityReporting: ['GET /repos/{owner}/{repo}/private-vulnerability-reporting'],
    checkVulnerabilityAlerts: ['GET /repos/{owner}/{repo}/vulnerability-alerts'],
    codeownersErrors: ['GET /repos/{owner}/{repo}/codeowners/errors'],
    compareCommits: ['GET /repos/{owner}/{repo}/compare/{base}...{head}'],
    compareCommitsWithBasehead: ['GET /repos/{owner}/{repo}/compare/{basehead}'],
    createAttestation: ['POST /repos/{owner}/{repo}/attestations'],
    createAutolink: ['POST /repos/{owner}/{repo}/autolinks'],
    createCommitComment: ['POST /repos/{owner}/{repo}/commits/{commit_sha}/comments'],
    createCommitSignatureProtection: ['POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures'],
    createCommitStatus: ['POST /repos/{owner}/{repo}/statuses/{sha}'],
    createDeployKey: ['POST /repos/{owner}/{repo}/keys'],
    createDeployment: ['POST /repos/{owner}/{repo}/deployments'],
    createDeploymentBranchPolicy: [
      'POST /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies',
    ],
    createDeploymentProtectionRule: [
      'POST /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules',
    ],
    createDeploymentStatus: ['POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses'],
    createDispatchEvent: ['POST /repos/{owner}/{repo}/dispatches'],
    createForAuthenticatedUser: ['POST /user/repos'],
    createFork: ['POST /repos/{owner}/{repo}/forks'],
    createInOrg: ['POST /orgs/{org}/repos'],
    createOrUpdateCustomPropertiesValues: ['PATCH /repos/{owner}/{repo}/properties/values'],
    createOrUpdateEnvironment: ['PUT /repos/{owner}/{repo}/environments/{environment_name}'],
    createOrUpdateFileContents: ['PUT /repos/{owner}/{repo}/contents/{path}'],
    createOrgRuleset: ['POST /orgs/{org}/rulesets'],
    createPagesDeployment: ['POST /repos/{owner}/{repo}/pages/deployments'],
    createPagesSite: ['POST /repos/{owner}/{repo}/pages'],
    createRelease: ['POST /repos/{owner}/{repo}/releases'],
    createRepoRuleset: ['POST /repos/{owner}/{repo}/rulesets'],
    createUsingTemplate: ['POST /repos/{template_owner}/{template_repo}/generate'],
    createWebhook: ['POST /repos/{owner}/{repo}/hooks'],
    declineInvitation: [
      'DELETE /user/repository_invitations/{invitation_id}',
      {},
      { renamed: ['repos', 'declineInvitationForAuthenticatedUser'] },
    ],
    declineInvitationForAuthenticatedUser: ['DELETE /user/repository_invitations/{invitation_id}'],
    delete: ['DELETE /repos/{owner}/{repo}'],
    deleteAccessRestrictions: ['DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions'],
    deleteAdminBranchProtection: ['DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins'],
    deleteAnEnvironment: ['DELETE /repos/{owner}/{repo}/environments/{environment_name}'],
    deleteAutolink: ['DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}'],
    deleteBranchProtection: ['DELETE /repos/{owner}/{repo}/branches/{branch}/protection'],
    deleteCommitComment: ['DELETE /repos/{owner}/{repo}/comments/{comment_id}'],
    deleteCommitSignatureProtection: ['DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures'],
    deleteDeployKey: ['DELETE /repos/{owner}/{repo}/keys/{key_id}'],
    deleteDeployment: ['DELETE /repos/{owner}/{repo}/deployments/{deployment_id}'],
    deleteDeploymentBranchPolicy: [
      'DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}',
    ],
    deleteFile: ['DELETE /repos/{owner}/{repo}/contents/{path}'],
    deleteInvitation: ['DELETE /repos/{owner}/{repo}/invitations/{invitation_id}'],
    deleteOrgRuleset: ['DELETE /orgs/{org}/rulesets/{ruleset_id}'],
    deletePagesSite: ['DELETE /repos/{owner}/{repo}/pages'],
    deletePullRequestReviewProtection: [
      'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews',
    ],
    deleteRelease: ['DELETE /repos/{owner}/{repo}/releases/{release_id}'],
    deleteReleaseAsset: ['DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}'],
    deleteRepoRuleset: ['DELETE /repos/{owner}/{repo}/rulesets/{ruleset_id}'],
    deleteWebhook: ['DELETE /repos/{owner}/{repo}/hooks/{hook_id}'],
    disableAutomatedSecurityFixes: ['DELETE /repos/{owner}/{repo}/automated-security-fixes'],
    disableDeploymentProtectionRule: [
      'DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}',
    ],
    disablePrivateVulnerabilityReporting: ['DELETE /repos/{owner}/{repo}/private-vulnerability-reporting'],
    disableVulnerabilityAlerts: ['DELETE /repos/{owner}/{repo}/vulnerability-alerts'],
    downloadArchive: ['GET /repos/{owner}/{repo}/zipball/{ref}', {}, { renamed: ['repos', 'downloadZipballArchive'] }],
    downloadTarballArchive: ['GET /repos/{owner}/{repo}/tarball/{ref}'],
    downloadZipballArchive: ['GET /repos/{owner}/{repo}/zipball/{ref}'],
    enableAutomatedSecurityFixes: ['PUT /repos/{owner}/{repo}/automated-security-fixes'],
    enablePrivateVulnerabilityReporting: ['PUT /repos/{owner}/{repo}/private-vulnerability-reporting'],
    enableVulnerabilityAlerts: ['PUT /repos/{owner}/{repo}/vulnerability-alerts'],
    generateReleaseNotes: ['POST /repos/{owner}/{repo}/releases/generate-notes'],
    get: ['GET /repos/{owner}/{repo}'],
    getAccessRestrictions: ['GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions'],
    getAdminBranchProtection: ['GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins'],
    getAllDeploymentProtectionRules: [
      'GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules',
    ],
    getAllEnvironments: ['GET /repos/{owner}/{repo}/environments'],
    getAllStatusCheckContexts: [
      'GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts',
    ],
    getAllTopics: ['GET /repos/{owner}/{repo}/topics'],
    getAppsWithAccessToProtectedBranch: ['GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps'],
    getAutolink: ['GET /repos/{owner}/{repo}/autolinks/{autolink_id}'],
    getBranch: ['GET /repos/{owner}/{repo}/branches/{branch}'],
    getBranchProtection: ['GET /repos/{owner}/{repo}/branches/{branch}/protection'],
    getBranchRules: ['GET /repos/{owner}/{repo}/rules/branches/{branch}'],
    getClones: ['GET /repos/{owner}/{repo}/traffic/clones'],
    getCodeFrequencyStats: ['GET /repos/{owner}/{repo}/stats/code_frequency'],
    getCollaboratorPermissionLevel: ['GET /repos/{owner}/{repo}/collaborators/{username}/permission'],
    getCombinedStatusForRef: ['GET /repos/{owner}/{repo}/commits/{ref}/status'],
    getCommit: ['GET /repos/{owner}/{repo}/commits/{ref}'],
    getCommitActivityStats: ['GET /repos/{owner}/{repo}/stats/commit_activity'],
    getCommitComment: ['GET /repos/{owner}/{repo}/comments/{comment_id}'],
    getCommitSignatureProtection: ['GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures'],
    getCommunityProfileMetrics: ['GET /repos/{owner}/{repo}/community/profile'],
    getContent: ['GET /repos/{owner}/{repo}/contents/{path}'],
    getContributorsStats: ['GET /repos/{owner}/{repo}/stats/contributors'],
    getCustomDeploymentProtectionRule: [
      'GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}',
    ],
    getCustomPropertiesValues: ['GET /repos/{owner}/{repo}/properties/values'],
    getDeployKey: ['GET /repos/{owner}/{repo}/keys/{key_id}'],
    getDeployment: ['GET /repos/{owner}/{repo}/deployments/{deployment_id}'],
    getDeploymentBranchPolicy: [
      'GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}',
    ],
    getDeploymentStatus: ['GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}'],
    getEnvironment: ['GET /repos/{owner}/{repo}/environments/{environment_name}'],
    getLatestPagesBuild: ['GET /repos/{owner}/{repo}/pages/builds/latest'],
    getLatestRelease: ['GET /repos/{owner}/{repo}/releases/latest'],
    getOrgRuleSuite: ['GET /orgs/{org}/rulesets/rule-suites/{rule_suite_id}'],
    getOrgRuleSuites: ['GET /orgs/{org}/rulesets/rule-suites'],
    getOrgRuleset: ['GET /orgs/{org}/rulesets/{ruleset_id}'],
    getOrgRulesets: ['GET /orgs/{org}/rulesets'],
    getPages: ['GET /repos/{owner}/{repo}/pages'],
    getPagesBuild: ['GET /repos/{owner}/{repo}/pages/builds/{build_id}'],
    getPagesDeployment: ['GET /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}'],
    getPagesHealthCheck: ['GET /repos/{owner}/{repo}/pages/health'],
    getParticipationStats: ['GET /repos/{owner}/{repo}/stats/participation'],
    getPullRequestReviewProtection: [
      'GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews',
    ],
    getPunchCardStats: ['GET /repos/{owner}/{repo}/stats/punch_card'],
    getReadme: ['GET /repos/{owner}/{repo}/readme'],
    getReadmeInDirectory: ['GET /repos/{owner}/{repo}/readme/{dir}'],
    getRelease: ['GET /repos/{owner}/{repo}/releases/{release_id}'],
    getReleaseAsset: ['GET /repos/{owner}/{repo}/releases/assets/{asset_id}'],
    getReleaseByTag: ['GET /repos/{owner}/{repo}/releases/tags/{tag}'],
    getRepoRuleSuite: ['GET /repos/{owner}/{repo}/rulesets/rule-suites/{rule_suite_id}'],
    getRepoRuleSuites: ['GET /repos/{owner}/{repo}/rulesets/rule-suites'],
    getRepoRuleset: ['GET /repos/{owner}/{repo}/rulesets/{ruleset_id}'],
    getRepoRulesetHistory: ['GET /repos/{owner}/{repo}/rulesets/{ruleset_id}/history'],
    getRepoRulesetVersion: ['GET /repos/{owner}/{repo}/rulesets/{ruleset_id}/history/{version_id}'],
    getRepoRulesets: ['GET /repos/{owner}/{repo}/rulesets'],
    getStatusChecksProtection: ['GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks'],
    getTeamsWithAccessToProtectedBranch: ['GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams'],
    getTopPaths: ['GET /repos/{owner}/{repo}/traffic/popular/paths'],
    getTopReferrers: ['GET /repos/{owner}/{repo}/traffic/popular/referrers'],
    getUsersWithAccessToProtectedBranch: ['GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users'],
    getViews: ['GET /repos/{owner}/{repo}/traffic/views'],
    getWebhook: ['GET /repos/{owner}/{repo}/hooks/{hook_id}'],
    getWebhookConfigForRepo: ['GET /repos/{owner}/{repo}/hooks/{hook_id}/config'],
    getWebhookDelivery: ['GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}'],
    listActivities: ['GET /repos/{owner}/{repo}/activity'],
    listAttestations: ['GET /repos/{owner}/{repo}/attestations/{subject_digest}'],
    listAutolinks: ['GET /repos/{owner}/{repo}/autolinks'],
    listBranches: ['GET /repos/{owner}/{repo}/branches'],
    listBranchesForHeadCommit: ['GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head'],
    listCollaborators: ['GET /repos/{owner}/{repo}/collaborators'],
    listCommentsForCommit: ['GET /repos/{owner}/{repo}/commits/{commit_sha}/comments'],
    listCommitCommentsForRepo: ['GET /repos/{owner}/{repo}/comments'],
    listCommitStatusesForRef: ['GET /repos/{owner}/{repo}/commits/{ref}/statuses'],
    listCommits: ['GET /repos/{owner}/{repo}/commits'],
    listContributors: ['GET /repos/{owner}/{repo}/contributors'],
    listCustomDeploymentRuleIntegrations: [
      'GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/apps',
    ],
    listDeployKeys: ['GET /repos/{owner}/{repo}/keys'],
    listDeploymentBranchPolicies: [
      'GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies',
    ],
    listDeploymentStatuses: ['GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses'],
    listDeployments: ['GET /repos/{owner}/{repo}/deployments'],
    listForAuthenticatedUser: ['GET /user/repos'],
    listForOrg: ['GET /orgs/{org}/repos'],
    listForUser: ['GET /users/{username}/repos'],
    listForks: ['GET /repos/{owner}/{repo}/forks'],
    listInvitations: ['GET /repos/{owner}/{repo}/invitations'],
    listInvitationsForAuthenticatedUser: ['GET /user/repository_invitations'],
    listLanguages: ['GET /repos/{owner}/{repo}/languages'],
    listPagesBuilds: ['GET /repos/{owner}/{repo}/pages/builds'],
    listPublic: ['GET /repositories'],
    listPullRequestsAssociatedWithCommit: ['GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls'],
    listReleaseAssets: ['GET /repos/{owner}/{repo}/releases/{release_id}/assets'],
    listReleases: ['GET /repos/{owner}/{repo}/releases'],
    listTags: ['GET /repos/{owner}/{repo}/tags'],
    listTeams: ['GET /repos/{owner}/{repo}/teams'],
    listWebhookDeliveries: ['GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries'],
    listWebhooks: ['GET /repos/{owner}/{repo}/hooks'],
    merge: ['POST /repos/{owner}/{repo}/merges'],
    mergeUpstream: ['POST /repos/{owner}/{repo}/merge-upstream'],
    pingWebhook: ['POST /repos/{owner}/{repo}/hooks/{hook_id}/pings'],
    redeliverWebhookDelivery: ['POST /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts'],
    removeAppAccessRestrictions: [
      'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps',
      {},
      { mapToData: 'apps' },
    ],
    removeCollaborator: ['DELETE /repos/{owner}/{repo}/collaborators/{username}'],
    removeStatusCheckContexts: [
      'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts',
      {},
      { mapToData: 'contexts' },
    ],
    removeStatusCheckProtection: ['DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks'],
    removeTeamAccessRestrictions: [
      'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams',
      {},
      { mapToData: 'teams' },
    ],
    removeUserAccessRestrictions: [
      'DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users',
      {},
      { mapToData: 'users' },
    ],
    renameBranch: ['POST /repos/{owner}/{repo}/branches/{branch}/rename'],
    replaceAllTopics: ['PUT /repos/{owner}/{repo}/topics'],
    requestPagesBuild: ['POST /repos/{owner}/{repo}/pages/builds'],
    setAdminBranchProtection: ['POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins'],
    setAppAccessRestrictions: [
      'PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps',
      {},
      { mapToData: 'apps' },
    ],
    setStatusCheckContexts: [
      'PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts',
      {},
      { mapToData: 'contexts' },
    ],
    setTeamAccessRestrictions: [
      'PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams',
      {},
      { mapToData: 'teams' },
    ],
    setUserAccessRestrictions: [
      'PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users',
      {},
      { mapToData: 'users' },
    ],
    testPushWebhook: ['POST /repos/{owner}/{repo}/hooks/{hook_id}/tests'],
    transfer: ['POST /repos/{owner}/{repo}/transfer'],
    update: ['PATCH /repos/{owner}/{repo}'],
    updateBranchProtection: ['PUT /repos/{owner}/{repo}/branches/{branch}/protection'],
    updateCommitComment: ['PATCH /repos/{owner}/{repo}/comments/{comment_id}'],
    updateDeploymentBranchPolicy: [
      'PUT /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}',
    ],
    updateInformationAboutPagesSite: ['PUT /repos/{owner}/{repo}/pages'],
    updateInvitation: ['PATCH /repos/{owner}/{repo}/invitations/{invitation_id}'],
    updateOrgRuleset: ['PUT /orgs/{org}/rulesets/{ruleset_id}'],
    updatePullRequestReviewProtection: [
      'PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews',
    ],
    updateRelease: ['PATCH /repos/{owner}/{repo}/releases/{release_id}'],
    updateReleaseAsset: ['PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}'],
    updateRepoRuleset: ['PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}'],
    updateStatusCheckPotection: [
      'PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks',
      {},
      { renamed: ['repos', 'updateStatusCheckProtection'] },
    ],
    updateStatusCheckProtection: ['PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks'],
    updateWebhook: ['PATCH /repos/{owner}/{repo}/hooks/{hook_id}'],
    updateWebhookConfigForRepo: ['PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config'],
    uploadReleaseAsset: [
      'POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}',
      { baseUrl: 'https://uploads.github.com' },
    ],
  },
  search: {
    code: ['GET /search/code'],
    commits: ['GET /search/commits'],
    issuesAndPullRequests: [
      'GET /search/issues',
      {},
      {
        deprecated:
          'octokit.rest.search.issuesAndPullRequests() is deprecated, see https://docs.github.com/rest/search/search#search-issues-and-pull-requests',
      },
    ],
    labels: ['GET /search/labels'],
    repos: ['GET /search/repositories'],
    topics: ['GET /search/topics'],
    users: ['GET /search/users'],
  },
  secretScanning: {
    createPushProtectionBypass: ['POST /repos/{owner}/{repo}/secret-scanning/push-protection-bypasses'],
    getAlert: ['GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}'],
    getScanHistory: ['GET /repos/{owner}/{repo}/secret-scanning/scan-history'],
    listAlertsForEnterprise: ['GET /enterprises/{enterprise}/secret-scanning/alerts'],
    listAlertsForOrg: ['GET /orgs/{org}/secret-scanning/alerts'],
    listAlertsForRepo: ['GET /repos/{owner}/{repo}/secret-scanning/alerts'],
    listLocationsForAlert: ['GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations'],
    updateAlert: ['PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}'],
  },
  securityAdvisories: {
    createFork: ['POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/forks'],
    createPrivateVulnerabilityReport: ['POST /repos/{owner}/{repo}/security-advisories/reports'],
    createRepositoryAdvisory: ['POST /repos/{owner}/{repo}/security-advisories'],
    createRepositoryAdvisoryCveRequest: ['POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/cve'],
    getGlobalAdvisory: ['GET /advisories/{ghsa_id}'],
    getRepositoryAdvisory: ['GET /repos/{owner}/{repo}/security-advisories/{ghsa_id}'],
    listGlobalAdvisories: ['GET /advisories'],
    listOrgRepositoryAdvisories: ['GET /orgs/{org}/security-advisories'],
    listRepositoryAdvisories: ['GET /repos/{owner}/{repo}/security-advisories'],
    updateRepositoryAdvisory: ['PATCH /repos/{owner}/{repo}/security-advisories/{ghsa_id}'],
  },
  teams: {
    addOrUpdateMembershipForUserInOrg: ['PUT /orgs/{org}/teams/{team_slug}/memberships/{username}'],
    addOrUpdateProjectPermissionsInOrg: [
      'PUT /orgs/{org}/teams/{team_slug}/projects/{project_id}',
      {},
      {
        deprecated:
          'octokit.rest.teams.addOrUpdateProjectPermissionsInOrg() is deprecated, see https://docs.github.com/rest/teams/teams#add-or-update-team-project-permissions',
      },
    ],
    addOrUpdateProjectPermissionsLegacy: [
      'PUT /teams/{team_id}/projects/{project_id}',
      {},
      {
        deprecated:
          'octokit.rest.teams.addOrUpdateProjectPermissionsLegacy() is deprecated, see https://docs.github.com/rest/teams/teams#add-or-update-team-project-permissions-legacy',
      },
    ],
    addOrUpdateRepoPermissionsInOrg: ['PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}'],
    checkPermissionsForProjectInOrg: [
      'GET /orgs/{org}/teams/{team_slug}/projects/{project_id}',
      {},
      {
        deprecated:
          'octokit.rest.teams.checkPermissionsForProjectInOrg() is deprecated, see https://docs.github.com/rest/teams/teams#check-team-permissions-for-a-project',
      },
    ],
    checkPermissionsForProjectLegacy: [
      'GET /teams/{team_id}/projects/{project_id}',
      {},
      {
        deprecated:
          'octokit.rest.teams.checkPermissionsForProjectLegacy() is deprecated, see https://docs.github.com/rest/teams/teams#check-team-permissions-for-a-project-legacy',
      },
    ],
    checkPermissionsForRepoInOrg: ['GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}'],
    create: ['POST /orgs/{org}/teams'],
    createDiscussionCommentInOrg: ['POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments'],
    createDiscussionInOrg: ['POST /orgs/{org}/teams/{team_slug}/discussions'],
    deleteDiscussionCommentInOrg: [
      'DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}',
    ],
    deleteDiscussionInOrg: ['DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}'],
    deleteInOrg: ['DELETE /orgs/{org}/teams/{team_slug}'],
    getByName: ['GET /orgs/{org}/teams/{team_slug}'],
    getDiscussionCommentInOrg: [
      'GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}',
    ],
    getDiscussionInOrg: ['GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}'],
    getMembershipForUserInOrg: ['GET /orgs/{org}/teams/{team_slug}/memberships/{username}'],
    list: ['GET /orgs/{org}/teams'],
    listChildInOrg: ['GET /orgs/{org}/teams/{team_slug}/teams'],
    listDiscussionCommentsInOrg: ['GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments'],
    listDiscussionsInOrg: ['GET /orgs/{org}/teams/{team_slug}/discussions'],
    listForAuthenticatedUser: ['GET /user/teams'],
    listMembersInOrg: ['GET /orgs/{org}/teams/{team_slug}/members'],
    listPendingInvitationsInOrg: ['GET /orgs/{org}/teams/{team_slug}/invitations'],
    listProjectsInOrg: [
      'GET /orgs/{org}/teams/{team_slug}/projects',
      {},
      {
        deprecated:
          'octokit.rest.teams.listProjectsInOrg() is deprecated, see https://docs.github.com/rest/teams/teams#list-team-projects',
      },
    ],
    listProjectsLegacy: [
      'GET /teams/{team_id}/projects',
      {},
      {
        deprecated:
          'octokit.rest.teams.listProjectsLegacy() is deprecated, see https://docs.github.com/rest/teams/teams#list-team-projects-legacy',
      },
    ],
    listReposInOrg: ['GET /orgs/{org}/teams/{team_slug}/repos'],
    removeMembershipForUserInOrg: ['DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}'],
    removeProjectInOrg: [
      'DELETE /orgs/{org}/teams/{team_slug}/projects/{project_id}',
      {},
      {
        deprecated:
          'octokit.rest.teams.removeProjectInOrg() is deprecated, see https://docs.github.com/rest/teams/teams#remove-a-project-from-a-team',
      },
    ],
    removeProjectLegacy: [
      'DELETE /teams/{team_id}/projects/{project_id}',
      {},
      {
        deprecated:
          'octokit.rest.teams.removeProjectLegacy() is deprecated, see https://docs.github.com/rest/teams/teams#remove-a-project-from-a-team-legacy',
      },
    ],
    removeRepoInOrg: ['DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}'],
    updateDiscussionCommentInOrg: [
      'PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}',
    ],
    updateDiscussionInOrg: ['PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}'],
    updateInOrg: ['PATCH /orgs/{org}/teams/{team_slug}'],
  },
  users: {
    addEmailForAuthenticated: ['POST /user/emails', {}, { renamed: ['users', 'addEmailForAuthenticatedUser'] }],
    addEmailForAuthenticatedUser: ['POST /user/emails'],
    addSocialAccountForAuthenticatedUser: ['POST /user/social_accounts'],
    block: ['PUT /user/blocks/{username}'],
    checkBlocked: ['GET /user/blocks/{username}'],
    checkFollowingForUser: ['GET /users/{username}/following/{target_user}'],
    checkPersonIsFollowedByAuthenticated: ['GET /user/following/{username}'],
    createGpgKeyForAuthenticated: [
      'POST /user/gpg_keys',
      {},
      { renamed: ['users', 'createGpgKeyForAuthenticatedUser'] },
    ],
    createGpgKeyForAuthenticatedUser: ['POST /user/gpg_keys'],
    createPublicSshKeyForAuthenticated: [
      'POST /user/keys',
      {},
      { renamed: ['users', 'createPublicSshKeyForAuthenticatedUser'] },
    ],
    createPublicSshKeyForAuthenticatedUser: ['POST /user/keys'],
    createSshSigningKeyForAuthenticatedUser: ['POST /user/ssh_signing_keys'],
    deleteEmailForAuthenticated: ['DELETE /user/emails', {}, { renamed: ['users', 'deleteEmailForAuthenticatedUser'] }],
    deleteEmailForAuthenticatedUser: ['DELETE /user/emails'],
    deleteGpgKeyForAuthenticated: [
      'DELETE /user/gpg_keys/{gpg_key_id}',
      {},
      { renamed: ['users', 'deleteGpgKeyForAuthenticatedUser'] },
    ],
    deleteGpgKeyForAuthenticatedUser: ['DELETE /user/gpg_keys/{gpg_key_id}'],
    deletePublicSshKeyForAuthenticated: [
      'DELETE /user/keys/{key_id}',
      {},
      { renamed: ['users', 'deletePublicSshKeyForAuthenticatedUser'] },
    ],
    deletePublicSshKeyForAuthenticatedUser: ['DELETE /user/keys/{key_id}'],
    deleteSocialAccountForAuthenticatedUser: ['DELETE /user/social_accounts'],
    deleteSshSigningKeyForAuthenticatedUser: ['DELETE /user/ssh_signing_keys/{ssh_signing_key_id}'],
    follow: ['PUT /user/following/{username}'],
    getAuthenticated: ['GET /user'],
    getById: ['GET /user/{account_id}'],
    getByUsername: ['GET /users/{username}'],
    getContextForUser: ['GET /users/{username}/hovercard'],
    getGpgKeyForAuthenticated: [
      'GET /user/gpg_keys/{gpg_key_id}',
      {},
      { renamed: ['users', 'getGpgKeyForAuthenticatedUser'] },
    ],
    getGpgKeyForAuthenticatedUser: ['GET /user/gpg_keys/{gpg_key_id}'],
    getPublicSshKeyForAuthenticated: [
      'GET /user/keys/{key_id}',
      {},
      { renamed: ['users', 'getPublicSshKeyForAuthenticatedUser'] },
    ],
    getPublicSshKeyForAuthenticatedUser: ['GET /user/keys/{key_id}'],
    getSshSigningKeyForAuthenticatedUser: ['GET /user/ssh_signing_keys/{ssh_signing_key_id}'],
    list: ['GET /users'],
    listAttestations: ['GET /users/{username}/attestations/{subject_digest}'],
    listBlockedByAuthenticated: ['GET /user/blocks', {}, { renamed: ['users', 'listBlockedByAuthenticatedUser'] }],
    listBlockedByAuthenticatedUser: ['GET /user/blocks'],
    listEmailsForAuthenticated: ['GET /user/emails', {}, { renamed: ['users', 'listEmailsForAuthenticatedUser'] }],
    listEmailsForAuthenticatedUser: ['GET /user/emails'],
    listFollowedByAuthenticated: ['GET /user/following', {}, { renamed: ['users', 'listFollowedByAuthenticatedUser'] }],
    listFollowedByAuthenticatedUser: ['GET /user/following'],
    listFollowersForAuthenticatedUser: ['GET /user/followers'],
    listFollowersForUser: ['GET /users/{username}/followers'],
    listFollowingForUser: ['GET /users/{username}/following'],
    listGpgKeysForAuthenticated: ['GET /user/gpg_keys', {}, { renamed: ['users', 'listGpgKeysForAuthenticatedUser'] }],
    listGpgKeysForAuthenticatedUser: ['GET /user/gpg_keys'],
    listGpgKeysForUser: ['GET /users/{username}/gpg_keys'],
    listPublicEmailsForAuthenticated: [
      'GET /user/public_emails',
      {},
      { renamed: ['users', 'listPublicEmailsForAuthenticatedUser'] },
    ],
    listPublicEmailsForAuthenticatedUser: ['GET /user/public_emails'],
    listPublicKeysForUser: ['GET /users/{username}/keys'],
    listPublicSshKeysForAuthenticated: [
      'GET /user/keys',
      {},
      { renamed: ['users', 'listPublicSshKeysForAuthenticatedUser'] },
    ],
    listPublicSshKeysForAuthenticatedUser: ['GET /user/keys'],
    listSocialAccountsForAuthenticatedUser: ['GET /user/social_accounts'],
    listSocialAccountsForUser: ['GET /users/{username}/social_accounts'],
    listSshSigningKeysForAuthenticatedUser: ['GET /user/ssh_signing_keys'],
    listSshSigningKeysForUser: ['GET /users/{username}/ssh_signing_keys'],
    setPrimaryEmailVisibilityForAuthenticated: [
      'PATCH /user/email/visibility',
      {},
      { renamed: ['users', 'setPrimaryEmailVisibilityForAuthenticatedUser'] },
    ],
    setPrimaryEmailVisibilityForAuthenticatedUser: ['PATCH /user/email/visibility'],
    unblock: ['DELETE /user/blocks/{username}'],
    unfollow: ['DELETE /user/following/{username}'],
    updateAuthenticated: ['PATCH /user'],
  },
};
var endpoints_default = Endpoints;

// node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/endpoints-to-methods.js
var endpointMethodsMap = /* @__PURE__ */ new Map();
for (const [scope, endpoints] of Object.entries(endpoints_default)) {
  for (const [methodName, endpoint2] of Object.entries(endpoints)) {
    const [route, defaults, decorations] = endpoint2;
    const [method, url] = route.split(/ /);
    const endpointDefaults = Object.assign(
      {
        method,
        url,
      },
      defaults,
    );
    if (!endpointMethodsMap.has(scope)) {
      endpointMethodsMap.set(scope, /* @__PURE__ */ new Map());
    }
    endpointMethodsMap.get(scope).set(methodName, {
      scope,
      methodName,
      endpointDefaults,
      decorations,
    });
  }
}
var handler = {
  has({ scope }, methodName) {
    return endpointMethodsMap.get(scope).has(methodName);
  },
  getOwnPropertyDescriptor(target, methodName) {
    return {
      value: this.get(target, methodName),
      // ensures method is in the cache
      configurable: true,
      writable: true,
      enumerable: true,
    };
  },
  defineProperty(target, methodName, descriptor) {
    Object.defineProperty(target.cache, methodName, descriptor);
    return true;
  },
  deleteProperty(target, methodName) {
    delete target.cache[methodName];
    return true;
  },
  ownKeys({ scope }) {
    return [...endpointMethodsMap.get(scope).keys()];
  },
  set(target, methodName, value) {
    return (target.cache[methodName] = value);
  },
  get({ octokit: octokit2, scope, cache }, methodName) {
    if (cache[methodName]) {
      return cache[methodName];
    }
    const method = endpointMethodsMap.get(scope).get(methodName);
    if (!method) {
      return void 0;
    }
    const { endpointDefaults, decorations } = method;
    if (decorations) {
      cache[methodName] = decorate(octokit2, scope, methodName, endpointDefaults, decorations);
    } else {
      cache[methodName] = octokit2.request.defaults(endpointDefaults);
    }
    return cache[methodName];
  },
};
function endpointsToMethods(octokit2) {
  const newMethods = {};
  for (const scope of endpointMethodsMap.keys()) {
    newMethods[scope] = new Proxy({ octokit: octokit2, scope, cache: {} }, handler);
  }
  return newMethods;
}
function decorate(octokit2, scope, methodName, defaults, decorations) {
  const requestWithDefaults = octokit2.request.defaults(defaults);
  function withDecorations(...args) {
    let options2 = requestWithDefaults.endpoint.merge(...args);
    if (decorations.mapToData) {
      options2 = Object.assign({}, options2, {
        data: options2[decorations.mapToData],
        [decorations.mapToData]: void 0,
      });
      return requestWithDefaults(options2);
    }
    if (decorations.renamed) {
      const [newScope, newMethodName] = decorations.renamed;
      octokit2.log.warn(`octokit.${scope}.${methodName}() has been renamed to octokit.${newScope}.${newMethodName}()`);
    }
    if (decorations.deprecated) {
      octokit2.log.warn(decorations.deprecated);
    }
    if (decorations.renamedParameters) {
      const options22 = requestWithDefaults.endpoint.merge(...args);
      for (const [name, alias] of Object.entries(decorations.renamedParameters)) {
        if (name in options22) {
          octokit2.log.warn(
            `"${name}" parameter is deprecated for "octokit.${scope}.${methodName}()". Use "${alias}" instead`,
          );
          if (!(alias in options22)) {
            options22[alias] = options22[name];
          }
          delete options22[name];
        }
      }
      return requestWithDefaults(options22);
    }
    return requestWithDefaults(...args);
  }
  return Object.assign(withDecorations, requestWithDefaults);
}

// node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/index.js
function restEndpointMethods(octokit2) {
  const api = endpointsToMethods(octokit2);
  return {
    rest: api,
  };
}
restEndpointMethods.VERSION = VERSION7;
function legacyRestEndpointMethods(octokit2) {
  const api = endpointsToMethods(octokit2);
  return {
    ...api,
    rest: api,
  };
}
legacyRestEndpointMethods.VERSION = VERSION7;

// node_modules/@octokit/rest/dist-src/version.js
var VERSION8 = '21.1.1';

// node_modules/@octokit/rest/dist-src/index.js
var Octokit2 = Octokit.plugin(requestLog, legacyRestEndpointMethods, paginateRest).defaults({
  userAgent: `octokit-rest.js/${VERSION8}`,
});

// node_modules/commander/esm.mjs
var import_index = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  // deprecated old name
  Command,
  Argument,
  Option,
  Help,
} = import_index.default;

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 =
  (offset = 0) =>
  (code) =>
    `\x1B[${code + offset}m`;
var wrapAnsi256 =
  (offset = 0) =>
  (code) =>
    `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m =
  (offset = 0) =>
  (red, green, blue) =>
    `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29],
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39],
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49],
  },
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = /* @__PURE__ */ new Map();
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`,
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false,
    });
  }
  Object.defineProperty(styles, 'codes', {
    value: codes,
    enumerable: false,
  });
  styles.color.close = '\x1B[39m';
  styles.bgColor.close = '\x1B[49m';
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round(((red - 8) / 247) * 24) + 232;
        }
        return 16 + 36 * Math.round((red / 255) * 5) + 6 * Math.round((green / 255) * 5) + Math.round((blue / 255) * 5);
      },
      enumerable: false,
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join('');
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          /* eslint-disable no-bitwise */
          (integer >> 16) & 255,
          (integer >> 8) & 255,
          integer & 255,
          /* eslint-enable no-bitwise */
        ];
      },
      enumerable: false,
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false,
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = (remainder % 6) / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + ((Math.round(blue) << 2) | (Math.round(green) << 1) | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false,
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false,
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false,
    },
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
var import_node_process = __toESM(require('node:process'), 1);
var import_node_os = __toESM(require('node:os'), 1);
var import_node_tty = __toESM(require('node:tty'), 1);
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : import_node_process.default.argv) {
  const prefix = flag.startsWith('-') ? '' : flag.length === 1 ? '-' : '--';
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf('--');
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = import_node_process.default;
var flagForceColor;
if (hasFlag('no-color') || hasFlag('no-colors') || hasFlag('color=false') || hasFlag('color=never')) {
  flagForceColor = 0;
} else if (hasFlag('color') || hasFlag('colors') || hasFlag('color=true') || hasFlag('color=always')) {
  flagForceColor = 1;
}
function envForceColor() {
  if ('FORCE_COLOR' in env) {
    if (env.FORCE_COLOR === 'true') {
      return 1;
    }
    if (env.FORCE_COLOR === 'false') {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3,
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== void 0) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag('color=16m') || hasFlag('color=full') || hasFlag('color=truecolor')) {
      return 3;
    }
    if (hasFlag('color=256')) {
      return 2;
    }
  }
  if ('TF_BUILD' in env && 'AGENT_NAME' in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === void 0) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === 'dumb') {
    return min;
  }
  if (import_node_process.default.platform === 'win32') {
    const osRelease = import_node_os.default.release().split('.');
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ('CI' in env) {
    if (['GITHUB_ACTIONS', 'GITEA_ACTIONS', 'CIRCLECI'].some((key) => key in env)) {
      return 3;
    }
    if (
      ['TRAVIS', 'APPVEYOR', 'GITLAB_CI', 'BUILDKITE', 'DRONE'].some((sign) => sign in env) ||
      env.CI_NAME === 'codeship'
    ) {
      return 1;
    }
    return min;
  }
  if ('TEAMCITY_VERSION' in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === 'truecolor') {
    return 3;
  }
  if (env.TERM === 'xterm-kitty') {
    return 3;
  }
  if ('TERM_PROGRAM' in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);
    switch (env.TERM_PROGRAM) {
      case 'iTerm.app': {
        return version >= 3 ? 3 : 2;
      }
      case 'Apple_Terminal': {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ('COLORTERM' in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options2 = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options2,
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: import_node_tty.default.isatty(1) }),
  stderr: createSupportsColor({ isTTY: import_node_tty.default.isatty(2) }),
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = '';
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = '';
  do {
    const gotCR = string[index - 1] === '\r';
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? '\r\n' : '\n') + postfix;
    endIndex = index + 1;
    index = string.indexOf('\n', endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol('GENERATOR');
var STYLER = Symbol('STYLER');
var IS_EMPTY = Symbol('IS_EMPTY');
var levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];
var styles2 = /* @__PURE__ */ Object.create(null);
var applyOptions = (object, options2 = {}) => {
  if (options2.level && !(Number.isInteger(options2.level) && options2.level >= 0 && options2.level <= 3)) {
    throw new Error('The `level` option should be an integer from 0 to 3');
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options2.level === void 0 ? colorLevel : options2.level;
};
var chalkFactory = (options2) => {
  const chalk2 = (...strings) => strings.join(' ');
  applyOptions(chalk2, options2);
  Object.setPrototypeOf(chalk2, createChalk.prototype);
  return chalk2;
};
function createChalk(options2) {
  return chalkFactory(options2);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    },
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, 'visible', { value: builder });
    return builder;
  },
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === 'rgb') {
    if (level === 'ansi16m') {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === 'ansi256') {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === 'hex') {
    return getModelAnsi('rgb', level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ['rgb', 'hex', 'ansi256'];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this;
      return function (...arguments_) {
        const styler = createStyler(
          getModelAnsi(model, levelMapping[level], 'color', ...arguments_),
          ansi_styles_default.color.close,
          this[STYLER],
        );
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    },
  };
  const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level } = this;
      return function (...arguments_) {
        const styler = createStyler(
          getModelAnsi(model, levelMapping[level], 'bgColor', ...arguments_),
          ansi_styles_default.bgColor.close,
          this[STYLER],
        );
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    },
  };
}
var proto = Object.defineProperties(() => {}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    },
  },
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === void 0) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent,
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) =>
    applyStyle(builder, arguments_.length === 1 ? '' + arguments_[0] : arguments_.join(' '));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? '' : string;
  }
  let styler = self[STYLER];
  if (styler === void 0) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes('\x1B')) {
    while (styler !== void 0) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf('\n');
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// node_modules/ora/index.js
var import_node_process7 = __toESM(require('node:process'), 1);

// node_modules/cli-cursor/index.js
var import_node_process3 = __toESM(require('node:process'), 1);

// node_modules/restore-cursor/index.js
var import_node_process2 = __toESM(require('node:process'), 1);

// node_modules/mimic-function/index.js
var copyProperty = (to, from, property, ignoreNonConfigurable) => {
  if (property === 'length' || property === 'prototype') {
    return;
  }
  if (property === 'arguments' || property === 'caller') {
    return;
  }
  const toDescriptor = Object.getOwnPropertyDescriptor(to, property);
  const fromDescriptor = Object.getOwnPropertyDescriptor(from, property);
  if (!canCopyProperty(toDescriptor, fromDescriptor) && ignoreNonConfigurable) {
    return;
  }
  Object.defineProperty(to, property, fromDescriptor);
};
var canCopyProperty = function (toDescriptor, fromDescriptor) {
  return (
    toDescriptor === void 0 ||
    toDescriptor.configurable ||
    (toDescriptor.writable === fromDescriptor.writable &&
      toDescriptor.enumerable === fromDescriptor.enumerable &&
      toDescriptor.configurable === fromDescriptor.configurable &&
      (toDescriptor.writable || toDescriptor.value === fromDescriptor.value))
  );
};
var changePrototype = (to, from) => {
  const fromPrototype = Object.getPrototypeOf(from);
  if (fromPrototype === Object.getPrototypeOf(to)) {
    return;
  }
  Object.setPrototypeOf(to, fromPrototype);
};
var wrappedToString = (withName, fromBody) => `/* Wrapped ${withName}*/
${fromBody}`;
var toStringDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, 'toString');
var toStringName = Object.getOwnPropertyDescriptor(Function.prototype.toString, 'name');
var changeToString = (to, from, name) => {
  const withName = name === '' ? '' : `with ${name.trim()}() `;
  const newToString = wrappedToString.bind(null, withName, from.toString());
  Object.defineProperty(newToString, 'name', toStringName);
  const { writable, enumerable, configurable } = toStringDescriptor;
  Object.defineProperty(to, 'toString', { value: newToString, writable, enumerable, configurable });
};
function mimicFunction(to, from, { ignoreNonConfigurable = false } = {}) {
  const { name } = to;
  for (const property of Reflect.ownKeys(from)) {
    copyProperty(to, from, property, ignoreNonConfigurable);
  }
  changePrototype(to, from);
  changeToString(to, from, name);
  return to;
}

// node_modules/restore-cursor/node_modules/onetime/index.js
var calledFunctions = /* @__PURE__ */ new WeakMap();
var onetime = (function_, options2 = {}) => {
  if (typeof function_ !== 'function') {
    throw new TypeError('Expected a function');
  }
  let returnValue;
  let callCount = 0;
  const functionName = function_.displayName || function_.name || '<anonymous>';
  const onetime2 = function (...arguments_) {
    calledFunctions.set(onetime2, ++callCount);
    if (callCount === 1) {
      returnValue = function_.apply(this, arguments_);
      function_ = void 0;
    } else if (options2.throw === true) {
      throw new Error(`Function \`${functionName}\` can only be called once`);
    }
    return returnValue;
  };
  mimicFunction(onetime2, function_);
  calledFunctions.set(onetime2, callCount);
  return onetime2;
};
onetime.callCount = (function_) => {
  if (!calledFunctions.has(function_)) {
    throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
  }
  return calledFunctions.get(function_);
};
var onetime_default = onetime;

// node_modules/restore-cursor/node_modules/signal-exit/dist/mjs/signals.js
var signals = [];
signals.push('SIGHUP', 'SIGINT', 'SIGTERM');
if (process.platform !== 'win32') {
  signals.push(
    'SIGALRM',
    'SIGABRT',
    'SIGVTALRM',
    'SIGXCPU',
    'SIGXFSZ',
    'SIGUSR2',
    'SIGTRAP',
    'SIGSYS',
    'SIGQUIT',
    'SIGIOT',
    // should detect profiler and enable/disable accordingly.
    // see #21
    // 'SIGPROF'
  );
}
if (process.platform === 'linux') {
  signals.push('SIGIO', 'SIGPOLL', 'SIGPWR', 'SIGSTKFLT');
}

// node_modules/restore-cursor/node_modules/signal-exit/dist/mjs/index.js
var processOk = (process10) =>
  !!process10 &&
  typeof process10 === 'object' &&
  typeof process10.removeListener === 'function' &&
  typeof process10.emit === 'function' &&
  typeof process10.reallyExit === 'function' &&
  typeof process10.listeners === 'function' &&
  typeof process10.kill === 'function' &&
  typeof process10.pid === 'number' &&
  typeof process10.on === 'function';
var kExitEmitter = Symbol.for('signal-exit emitter');
var global2 = globalThis;
var ObjectDefineProperty = Object.defineProperty.bind(Object);
var Emitter = class {
  emitted = {
    afterExit: false,
    exit: false,
  };
  listeners = {
    afterExit: [],
    exit: [],
  };
  count = 0;
  id = Math.random();
  constructor() {
    if (global2[kExitEmitter]) {
      return global2[kExitEmitter];
    }
    ObjectDefineProperty(global2, kExitEmitter, {
      value: this,
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }
  on(ev, fn) {
    this.listeners[ev].push(fn);
  }
  removeListener(ev, fn) {
    const list = this.listeners[ev];
    const i = list.indexOf(fn);
    if (i === -1) {
      return;
    }
    if (i === 0 && list.length === 1) {
      list.length = 0;
    } else {
      list.splice(i, 1);
    }
  }
  emit(ev, code, signal) {
    if (this.emitted[ev]) {
      return false;
    }
    this.emitted[ev] = true;
    let ret = false;
    for (const fn of this.listeners[ev]) {
      ret = fn(code, signal) === true || ret;
    }
    if (ev === 'exit') {
      ret = this.emit('afterExit', code, signal) || ret;
    }
    return ret;
  }
};
var SignalExitBase = class {};
var signalExitWrap = (handler2) => {
  return {
    onExit(cb, opts) {
      return handler2.onExit(cb, opts);
    },
    load() {
      return handler2.load();
    },
    unload() {
      return handler2.unload();
    },
  };
};
var SignalExitFallback = class extends SignalExitBase {
  onExit() {
    return () => {};
  }
  load() {}
  unload() {}
};
var SignalExit = class extends SignalExitBase {
  // "SIGHUP" throws an `ENOSYS` error on Windows,
  // so use a supported signal instead
  /* c8 ignore start */
  #hupSig = process3.platform === 'win32' ? 'SIGINT' : 'SIGHUP';
  /* c8 ignore stop */
  #emitter = new Emitter();
  #process;
  #originalProcessEmit;
  #originalProcessReallyExit;
  #sigListeners = {};
  #loaded = false;
  constructor(process10) {
    super();
    this.#process = process10;
    this.#sigListeners = {};
    for (const sig of signals) {
      this.#sigListeners[sig] = () => {
        const listeners = this.#process.listeners(sig);
        let { count } = this.#emitter;
        const p = process10;
        if (typeof p.__signal_exit_emitter__ === 'object' && typeof p.__signal_exit_emitter__.count === 'number') {
          count += p.__signal_exit_emitter__.count;
        }
        if (listeners.length === count) {
          this.unload();
          const ret = this.#emitter.emit('exit', null, sig);
          const s = sig === 'SIGHUP' ? this.#hupSig : sig;
          if (!ret) process10.kill(process10.pid, s);
        }
      };
    }
    this.#originalProcessReallyExit = process10.reallyExit;
    this.#originalProcessEmit = process10.emit;
  }
  onExit(cb, opts) {
    if (!processOk(this.#process)) {
      return () => {};
    }
    if (this.#loaded === false) {
      this.load();
    }
    const ev = opts?.alwaysLast ? 'afterExit' : 'exit';
    this.#emitter.on(ev, cb);
    return () => {
      this.#emitter.removeListener(ev, cb);
      if (this.#emitter.listeners['exit'].length === 0 && this.#emitter.listeners['afterExit'].length === 0) {
        this.unload();
      }
    };
  }
  load() {
    if (this.#loaded) {
      return;
    }
    this.#loaded = true;
    this.#emitter.count += 1;
    for (const sig of signals) {
      try {
        const fn = this.#sigListeners[sig];
        if (fn) this.#process.on(sig, fn);
      } catch (_) {}
    }
    this.#process.emit = (ev, ...a) => {
      return this.#processEmit(ev, ...a);
    };
    this.#process.reallyExit = (code) => {
      return this.#processReallyExit(code);
    };
  }
  unload() {
    if (!this.#loaded) {
      return;
    }
    this.#loaded = false;
    signals.forEach((sig) => {
      const listener = this.#sigListeners[sig];
      if (!listener) {
        throw new Error('Listener not defined for signal: ' + sig);
      }
      try {
        this.#process.removeListener(sig, listener);
      } catch (_) {}
    });
    this.#process.emit = this.#originalProcessEmit;
    this.#process.reallyExit = this.#originalProcessReallyExit;
    this.#emitter.count -= 1;
  }
  #processReallyExit(code) {
    if (!processOk(this.#process)) {
      return 0;
    }
    this.#process.exitCode = code || 0;
    this.#emitter.emit('exit', this.#process.exitCode, null);
    return this.#originalProcessReallyExit.call(this.#process, this.#process.exitCode);
  }
  #processEmit(ev, ...args) {
    const og = this.#originalProcessEmit;
    if (ev === 'exit' && processOk(this.#process)) {
      if (typeof args[0] === 'number') {
        this.#process.exitCode = args[0];
      }
      const ret = og.call(this.#process, ev, ...args);
      this.#emitter.emit('exit', this.#process.exitCode, null);
      return ret;
    } else {
      return og.call(this.#process, ev, ...args);
    }
  }
};
var process3 = globalThis.process;
var {
  /**
   * Called when the process is exiting, whether via signal, explicit
   * exit, or running out of stuff to do.
   *
   * If the global process object is not suitable for instrumentation,
   * then this will be a no-op.
   *
   * Returns a function that may be used to unload signal-exit.
   */
  onExit,
  /**
   * Load the listeners.  Likely you never need to call this, unless
   * doing a rather deep integration with signal-exit functionality.
   * Mostly exposed for the benefit of testing.
   *
   * @internal
   */
  load,
  /**
   * Unload the listeners.  Likely you never need to call this, unless
   * doing a rather deep integration with signal-exit functionality.
   * Mostly exposed for the benefit of testing.
   *
   * @internal
   */
  unload,
} = signalExitWrap(processOk(process3) ? new SignalExit(process3) : new SignalExitFallback());

// node_modules/restore-cursor/index.js
var terminal = import_node_process2.default.stderr.isTTY
  ? import_node_process2.default.stderr
  : import_node_process2.default.stdout.isTTY
    ? import_node_process2.default.stdout
    : void 0;
var restoreCursor = terminal
  ? onetime_default(() => {
      onExit(
        () => {
          terminal.write('\x1B[?25h');
        },
        { alwaysLast: true },
      );
    })
  : () => {};
var restore_cursor_default = restoreCursor;

// node_modules/cli-cursor/index.js
var isHidden = false;
var cliCursor = {};
cliCursor.show = (writableStream = import_node_process3.default.stderr) => {
  if (!writableStream.isTTY) {
    return;
  }
  isHidden = false;
  writableStream.write('\x1B[?25h');
};
cliCursor.hide = (writableStream = import_node_process3.default.stderr) => {
  if (!writableStream.isTTY) {
    return;
  }
  restore_cursor_default();
  isHidden = true;
  writableStream.write('\x1B[?25l');
};
cliCursor.toggle = (force, writableStream) => {
  if (force !== void 0) {
    isHidden = force;
  }
  if (isHidden) {
    cliCursor.show(writableStream);
  } else {
    cliCursor.hide(writableStream);
  }
};
var cli_cursor_default = cliCursor;

// node_modules/ora/index.js
var import_cli_spinners = __toESM(require_cli_spinners(), 1);

// node_modules/log-symbols/node_modules/is-unicode-supported/index.js
var import_node_process4 = __toESM(require('node:process'), 1);
function isUnicodeSupported() {
  if (import_node_process4.default.platform !== 'win32') {
    return import_node_process4.default.env.TERM !== 'linux';
  }
  return (
    Boolean(import_node_process4.default.env.CI) ||
    Boolean(import_node_process4.default.env.WT_SESSION) ||
    Boolean(import_node_process4.default.env.TERMINUS_SUBLIME) ||
    import_node_process4.default.env.ConEmuTask === '{cmd::Cmder}' ||
    import_node_process4.default.env.TERM_PROGRAM === 'Terminus-Sublime' ||
    import_node_process4.default.env.TERM_PROGRAM === 'vscode' ||
    import_node_process4.default.env.TERM === 'xterm-256color' ||
    import_node_process4.default.env.TERM === 'alacritty' ||
    import_node_process4.default.env.TERMINAL_EMULATOR === 'JetBrains-JediTerm'
  );
}

// node_modules/log-symbols/index.js
var main = {
  info: source_default.blue('\u2139'),
  success: source_default.green('\u2714'),
  warning: source_default.yellow('\u26A0'),
  error: source_default.red('\u2716'),
};
var fallback = {
  info: source_default.blue('i'),
  success: source_default.green('\u221A'),
  warning: source_default.yellow('\u203C'),
  error: source_default.red('\xD7'),
};
var logSymbols = isUnicodeSupported() ? main : fallback;
var log_symbols_default = logSymbols;

// node_modules/ora/node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
  const ST = '(?:\\u0007|\\u001B\\u005C|\\u009C)';
  const pattern = [
    `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  ].join('|');
  return new RegExp(pattern, onlyFirst ? void 0 : 'g');
}

// node_modules/ora/node_modules/strip-ansi/index.js
var regex = ansiRegex();
function stripAnsi(string) {
  if (typeof string !== 'string') {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  return string.replace(regex, '');
}

// node_modules/get-east-asian-width/lookup.js
function isAmbiguous(x) {
  return (
    x === 161 ||
    x === 164 ||
    x === 167 ||
    x === 168 ||
    x === 170 ||
    x === 173 ||
    x === 174 ||
    (x >= 176 && x <= 180) ||
    (x >= 182 && x <= 186) ||
    (x >= 188 && x <= 191) ||
    x === 198 ||
    x === 208 ||
    x === 215 ||
    x === 216 ||
    (x >= 222 && x <= 225) ||
    x === 230 ||
    (x >= 232 && x <= 234) ||
    x === 236 ||
    x === 237 ||
    x === 240 ||
    x === 242 ||
    x === 243 ||
    (x >= 247 && x <= 250) ||
    x === 252 ||
    x === 254 ||
    x === 257 ||
    x === 273 ||
    x === 275 ||
    x === 283 ||
    x === 294 ||
    x === 295 ||
    x === 299 ||
    (x >= 305 && x <= 307) ||
    x === 312 ||
    (x >= 319 && x <= 322) ||
    x === 324 ||
    (x >= 328 && x <= 331) ||
    x === 333 ||
    x === 338 ||
    x === 339 ||
    x === 358 ||
    x === 359 ||
    x === 363 ||
    x === 462 ||
    x === 464 ||
    x === 466 ||
    x === 468 ||
    x === 470 ||
    x === 472 ||
    x === 474 ||
    x === 476 ||
    x === 593 ||
    x === 609 ||
    x === 708 ||
    x === 711 ||
    (x >= 713 && x <= 715) ||
    x === 717 ||
    x === 720 ||
    (x >= 728 && x <= 731) ||
    x === 733 ||
    x === 735 ||
    (x >= 768 && x <= 879) ||
    (x >= 913 && x <= 929) ||
    (x >= 931 && x <= 937) ||
    (x >= 945 && x <= 961) ||
    (x >= 963 && x <= 969) ||
    x === 1025 ||
    (x >= 1040 && x <= 1103) ||
    x === 1105 ||
    x === 8208 ||
    (x >= 8211 && x <= 8214) ||
    x === 8216 ||
    x === 8217 ||
    x === 8220 ||
    x === 8221 ||
    (x >= 8224 && x <= 8226) ||
    (x >= 8228 && x <= 8231) ||
    x === 8240 ||
    x === 8242 ||
    x === 8243 ||
    x === 8245 ||
    x === 8251 ||
    x === 8254 ||
    x === 8308 ||
    x === 8319 ||
    (x >= 8321 && x <= 8324) ||
    x === 8364 ||
    x === 8451 ||
    x === 8453 ||
    x === 8457 ||
    x === 8467 ||
    x === 8470 ||
    x === 8481 ||
    x === 8482 ||
    x === 8486 ||
    x === 8491 ||
    x === 8531 ||
    x === 8532 ||
    (x >= 8539 && x <= 8542) ||
    (x >= 8544 && x <= 8555) ||
    (x >= 8560 && x <= 8569) ||
    x === 8585 ||
    (x >= 8592 && x <= 8601) ||
    x === 8632 ||
    x === 8633 ||
    x === 8658 ||
    x === 8660 ||
    x === 8679 ||
    x === 8704 ||
    x === 8706 ||
    x === 8707 ||
    x === 8711 ||
    x === 8712 ||
    x === 8715 ||
    x === 8719 ||
    x === 8721 ||
    x === 8725 ||
    x === 8730 ||
    (x >= 8733 && x <= 8736) ||
    x === 8739 ||
    x === 8741 ||
    (x >= 8743 && x <= 8748) ||
    x === 8750 ||
    (x >= 8756 && x <= 8759) ||
    x === 8764 ||
    x === 8765 ||
    x === 8776 ||
    x === 8780 ||
    x === 8786 ||
    x === 8800 ||
    x === 8801 ||
    (x >= 8804 && x <= 8807) ||
    x === 8810 ||
    x === 8811 ||
    x === 8814 ||
    x === 8815 ||
    x === 8834 ||
    x === 8835 ||
    x === 8838 ||
    x === 8839 ||
    x === 8853 ||
    x === 8857 ||
    x === 8869 ||
    x === 8895 ||
    x === 8978 ||
    (x >= 9312 && x <= 9449) ||
    (x >= 9451 && x <= 9547) ||
    (x >= 9552 && x <= 9587) ||
    (x >= 9600 && x <= 9615) ||
    (x >= 9618 && x <= 9621) ||
    x === 9632 ||
    x === 9633 ||
    (x >= 9635 && x <= 9641) ||
    x === 9650 ||
    x === 9651 ||
    x === 9654 ||
    x === 9655 ||
    x === 9660 ||
    x === 9661 ||
    x === 9664 ||
    x === 9665 ||
    (x >= 9670 && x <= 9672) ||
    x === 9675 ||
    (x >= 9678 && x <= 9681) ||
    (x >= 9698 && x <= 9701) ||
    x === 9711 ||
    x === 9733 ||
    x === 9734 ||
    x === 9737 ||
    x === 9742 ||
    x === 9743 ||
    x === 9756 ||
    x === 9758 ||
    x === 9792 ||
    x === 9794 ||
    x === 9824 ||
    x === 9825 ||
    (x >= 9827 && x <= 9829) ||
    (x >= 9831 && x <= 9834) ||
    x === 9836 ||
    x === 9837 ||
    x === 9839 ||
    x === 9886 ||
    x === 9887 ||
    x === 9919 ||
    (x >= 9926 && x <= 9933) ||
    (x >= 9935 && x <= 9939) ||
    (x >= 9941 && x <= 9953) ||
    x === 9955 ||
    x === 9960 ||
    x === 9961 ||
    (x >= 9963 && x <= 9969) ||
    x === 9972 ||
    (x >= 9974 && x <= 9977) ||
    x === 9979 ||
    x === 9980 ||
    x === 9982 ||
    x === 9983 ||
    x === 10045 ||
    (x >= 10102 && x <= 10111) ||
    (x >= 11094 && x <= 11097) ||
    (x >= 12872 && x <= 12879) ||
    (x >= 57344 && x <= 63743) ||
    (x >= 65024 && x <= 65039) ||
    x === 65533 ||
    (x >= 127232 && x <= 127242) ||
    (x >= 127248 && x <= 127277) ||
    (x >= 127280 && x <= 127337) ||
    (x >= 127344 && x <= 127373) ||
    x === 127375 ||
    x === 127376 ||
    (x >= 127387 && x <= 127404) ||
    (x >= 917760 && x <= 917999) ||
    (x >= 983040 && x <= 1048573) ||
    (x >= 1048576 && x <= 1114109)
  );
}
function isFullWidth(x) {
  return x === 12288 || (x >= 65281 && x <= 65376) || (x >= 65504 && x <= 65510);
}
function isWide(x) {
  return (
    (x >= 4352 && x <= 4447) ||
    x === 8986 ||
    x === 8987 ||
    x === 9001 ||
    x === 9002 ||
    (x >= 9193 && x <= 9196) ||
    x === 9200 ||
    x === 9203 ||
    x === 9725 ||
    x === 9726 ||
    x === 9748 ||
    x === 9749 ||
    (x >= 9776 && x <= 9783) ||
    (x >= 9800 && x <= 9811) ||
    x === 9855 ||
    (x >= 9866 && x <= 9871) ||
    x === 9875 ||
    x === 9889 ||
    x === 9898 ||
    x === 9899 ||
    x === 9917 ||
    x === 9918 ||
    x === 9924 ||
    x === 9925 ||
    x === 9934 ||
    x === 9940 ||
    x === 9962 ||
    x === 9970 ||
    x === 9971 ||
    x === 9973 ||
    x === 9978 ||
    x === 9981 ||
    x === 9989 ||
    x === 9994 ||
    x === 9995 ||
    x === 10024 ||
    x === 10060 ||
    x === 10062 ||
    (x >= 10067 && x <= 10069) ||
    x === 10071 ||
    (x >= 10133 && x <= 10135) ||
    x === 10160 ||
    x === 10175 ||
    x === 11035 ||
    x === 11036 ||
    x === 11088 ||
    x === 11093 ||
    (x >= 11904 && x <= 11929) ||
    (x >= 11931 && x <= 12019) ||
    (x >= 12032 && x <= 12245) ||
    (x >= 12272 && x <= 12287) ||
    (x >= 12289 && x <= 12350) ||
    (x >= 12353 && x <= 12438) ||
    (x >= 12441 && x <= 12543) ||
    (x >= 12549 && x <= 12591) ||
    (x >= 12593 && x <= 12686) ||
    (x >= 12688 && x <= 12773) ||
    (x >= 12783 && x <= 12830) ||
    (x >= 12832 && x <= 12871) ||
    (x >= 12880 && x <= 42124) ||
    (x >= 42128 && x <= 42182) ||
    (x >= 43360 && x <= 43388) ||
    (x >= 44032 && x <= 55203) ||
    (x >= 63744 && x <= 64255) ||
    (x >= 65040 && x <= 65049) ||
    (x >= 65072 && x <= 65106) ||
    (x >= 65108 && x <= 65126) ||
    (x >= 65128 && x <= 65131) ||
    (x >= 94176 && x <= 94180) ||
    x === 94192 ||
    x === 94193 ||
    (x >= 94208 && x <= 100343) ||
    (x >= 100352 && x <= 101589) ||
    (x >= 101631 && x <= 101640) ||
    (x >= 110576 && x <= 110579) ||
    (x >= 110581 && x <= 110587) ||
    x === 110589 ||
    x === 110590 ||
    (x >= 110592 && x <= 110882) ||
    x === 110898 ||
    (x >= 110928 && x <= 110930) ||
    x === 110933 ||
    (x >= 110948 && x <= 110951) ||
    (x >= 110960 && x <= 111355) ||
    (x >= 119552 && x <= 119638) ||
    (x >= 119648 && x <= 119670) ||
    x === 126980 ||
    x === 127183 ||
    x === 127374 ||
    (x >= 127377 && x <= 127386) ||
    (x >= 127488 && x <= 127490) ||
    (x >= 127504 && x <= 127547) ||
    (x >= 127552 && x <= 127560) ||
    x === 127568 ||
    x === 127569 ||
    (x >= 127584 && x <= 127589) ||
    (x >= 127744 && x <= 127776) ||
    (x >= 127789 && x <= 127797) ||
    (x >= 127799 && x <= 127868) ||
    (x >= 127870 && x <= 127891) ||
    (x >= 127904 && x <= 127946) ||
    (x >= 127951 && x <= 127955) ||
    (x >= 127968 && x <= 127984) ||
    x === 127988 ||
    (x >= 127992 && x <= 128062) ||
    x === 128064 ||
    (x >= 128066 && x <= 128252) ||
    (x >= 128255 && x <= 128317) ||
    (x >= 128331 && x <= 128334) ||
    (x >= 128336 && x <= 128359) ||
    x === 128378 ||
    x === 128405 ||
    x === 128406 ||
    x === 128420 ||
    (x >= 128507 && x <= 128591) ||
    (x >= 128640 && x <= 128709) ||
    x === 128716 ||
    (x >= 128720 && x <= 128722) ||
    (x >= 128725 && x <= 128727) ||
    (x >= 128732 && x <= 128735) ||
    x === 128747 ||
    x === 128748 ||
    (x >= 128756 && x <= 128764) ||
    (x >= 128992 && x <= 129003) ||
    x === 129008 ||
    (x >= 129292 && x <= 129338) ||
    (x >= 129340 && x <= 129349) ||
    (x >= 129351 && x <= 129535) ||
    (x >= 129648 && x <= 129660) ||
    (x >= 129664 && x <= 129673) ||
    (x >= 129679 && x <= 129734) ||
    (x >= 129742 && x <= 129756) ||
    (x >= 129759 && x <= 129769) ||
    (x >= 129776 && x <= 129784) ||
    (x >= 131072 && x <= 196605) ||
    (x >= 196608 && x <= 262141)
  );
}

// node_modules/get-east-asian-width/index.js
function validate2(codePoint) {
  if (!Number.isSafeInteger(codePoint)) {
    throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
  }
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
  validate2(codePoint);
  if (isFullWidth(codePoint) || isWide(codePoint) || (ambiguousAsWide && isAmbiguous(codePoint))) {
    return 2;
  }
  return 1;
}

// node_modules/ora/node_modules/string-width/index.js
var import_emoji_regex = __toESM(require_emoji_regex(), 1);
var segmenter = new Intl.Segmenter();
var defaultIgnorableCodePointRegex = /^\p{Default_Ignorable_Code_Point}$/u;
function stringWidth(string, options2 = {}) {
  if (typeof string !== 'string' || string.length === 0) {
    return 0;
  }
  const { ambiguousIsNarrow = true, countAnsiEscapeCodes = false } = options2;
  if (!countAnsiEscapeCodes) {
    string = stripAnsi(string);
  }
  if (string.length === 0) {
    return 0;
  }
  let width = 0;
  const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
  for (const { segment: character } of segmenter.segment(string)) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 31 || (codePoint >= 127 && codePoint <= 159)) {
      continue;
    }
    if ((codePoint >= 8203 && codePoint <= 8207) || codePoint === 65279) {
      continue;
    }
    if (
      (codePoint >= 768 && codePoint <= 879) ||
      (codePoint >= 6832 && codePoint <= 6911) ||
      (codePoint >= 7616 && codePoint <= 7679) ||
      (codePoint >= 8400 && codePoint <= 8447) ||
      (codePoint >= 65056 && codePoint <= 65071)
    ) {
      continue;
    }
    if (codePoint >= 55296 && codePoint <= 57343) {
      continue;
    }
    if (codePoint >= 65024 && codePoint <= 65039) {
      continue;
    }
    if (defaultIgnorableCodePointRegex.test(character)) {
      continue;
    }
    if ((0, import_emoji_regex.default)().test(character)) {
      width += 2;
      continue;
    }
    width += eastAsianWidth(codePoint, eastAsianWidthOptions);
  }
  return width;
}

// node_modules/is-interactive/index.js
function isInteractive({ stream = process.stdout } = {}) {
  return Boolean(stream && stream.isTTY && process.env.TERM !== 'dumb' && !('CI' in process.env));
}

// node_modules/is-unicode-supported/index.js
var import_node_process5 = __toESM(require('node:process'), 1);
function isUnicodeSupported2() {
  const { env: env2 } = import_node_process5.default;
  const { TERM, TERM_PROGRAM } = env2;
  if (import_node_process5.default.platform !== 'win32') {
    return TERM !== 'linux';
  }
  return (
    Boolean(env2.WT_SESSION) ||
    Boolean(env2.TERMINUS_SUBLIME) ||
    env2.ConEmuTask === '{cmd::Cmder}' ||
    TERM_PROGRAM === 'Terminus-Sublime' ||
    TERM_PROGRAM === 'vscode' ||
    TERM === 'xterm-256color' ||
    TERM === 'alacritty' ||
    TERM === 'rxvt-unicode' ||
    TERM === 'rxvt-unicode-256color' ||
    env2.TERMINAL_EMULATOR === 'JetBrains-JediTerm'
  );
}

// node_modules/stdin-discarder/index.js
var import_node_process6 = __toESM(require('node:process'), 1);
var ASCII_ETX_CODE = 3;
var StdinDiscarder = class {
  #activeCount = 0;
  start() {
    this.#activeCount++;
    if (this.#activeCount === 1) {
      this.#realStart();
    }
  }
  stop() {
    if (this.#activeCount <= 0) {
      throw new Error('`stop` called more times than `start`');
    }
    this.#activeCount--;
    if (this.#activeCount === 0) {
      this.#realStop();
    }
  }
  #realStart() {
    if (import_node_process6.default.platform === 'win32' || !import_node_process6.default.stdin.isTTY) {
      return;
    }
    import_node_process6.default.stdin.setRawMode(true);
    import_node_process6.default.stdin.on('data', this.#handleInput);
    import_node_process6.default.stdin.resume();
  }
  #realStop() {
    if (!import_node_process6.default.stdin.isTTY) {
      return;
    }
    import_node_process6.default.stdin.off('data', this.#handleInput);
    import_node_process6.default.stdin.pause();
    import_node_process6.default.stdin.setRawMode(false);
  }
  #handleInput(chunk) {
    if (chunk[0] === ASCII_ETX_CODE) {
      import_node_process6.default.emit('SIGINT');
    }
  }
};
var stdinDiscarder = new StdinDiscarder();
var stdin_discarder_default = stdinDiscarder;

// node_modules/ora/index.js
var import_cli_spinners2 = __toESM(require_cli_spinners(), 1);
var Ora = class {
  #linesToClear = 0;
  #isDiscardingStdin = false;
  #lineCount = 0;
  #frameIndex = -1;
  #lastSpinnerFrameTime = 0;
  #options;
  #spinner;
  #stream;
  #id;
  #initialInterval;
  #isEnabled;
  #isSilent;
  #indent;
  #text;
  #prefixText;
  #suffixText;
  color;
  constructor(options2) {
    if (typeof options2 === 'string') {
      options2 = {
        text: options2,
      };
    }
    this.#options = {
      color: 'cyan',
      stream: import_node_process7.default.stderr,
      discardStdin: true,
      hideCursor: true,
      ...options2,
    };
    this.color = this.#options.color;
    this.spinner = this.#options.spinner;
    this.#initialInterval = this.#options.interval;
    this.#stream = this.#options.stream;
    this.#isEnabled =
      typeof this.#options.isEnabled === 'boolean' ? this.#options.isEnabled : isInteractive({ stream: this.#stream });
    this.#isSilent = typeof this.#options.isSilent === 'boolean' ? this.#options.isSilent : false;
    this.text = this.#options.text;
    this.prefixText = this.#options.prefixText;
    this.suffixText = this.#options.suffixText;
    this.indent = this.#options.indent;
    if (import_node_process7.default.env.NODE_ENV === 'test') {
      this._stream = this.#stream;
      this._isEnabled = this.#isEnabled;
      Object.defineProperty(this, '_linesToClear', {
        get() {
          return this.#linesToClear;
        },
        set(newValue) {
          this.#linesToClear = newValue;
        },
      });
      Object.defineProperty(this, '_frameIndex', {
        get() {
          return this.#frameIndex;
        },
      });
      Object.defineProperty(this, '_lineCount', {
        get() {
          return this.#lineCount;
        },
      });
    }
  }
  get indent() {
    return this.#indent;
  }
  set indent(indent = 0) {
    if (!(indent >= 0 && Number.isInteger(indent))) {
      throw new Error('The `indent` option must be an integer from 0 and up');
    }
    this.#indent = indent;
    this.#updateLineCount();
  }
  get interval() {
    return this.#initialInterval ?? this.#spinner.interval ?? 100;
  }
  get spinner() {
    return this.#spinner;
  }
  set spinner(spinner) {
    this.#frameIndex = -1;
    this.#initialInterval = void 0;
    if (typeof spinner === 'object') {
      if (spinner.frames === void 0) {
        throw new Error('The given spinner must have a `frames` property');
      }
      this.#spinner = spinner;
    } else if (!isUnicodeSupported2()) {
      this.#spinner = import_cli_spinners.default.line;
    } else if (spinner === void 0) {
      this.#spinner = import_cli_spinners.default.dots;
    } else if (spinner !== 'default' && import_cli_spinners.default[spinner]) {
      this.#spinner = import_cli_spinners.default[spinner];
    } else {
      throw new Error(
        `There is no built-in spinner named '${spinner}'. See https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json for a full list.`,
      );
    }
  }
  get text() {
    return this.#text;
  }
  set text(value = '') {
    this.#text = value;
    this.#updateLineCount();
  }
  get prefixText() {
    return this.#prefixText;
  }
  set prefixText(value = '') {
    this.#prefixText = value;
    this.#updateLineCount();
  }
  get suffixText() {
    return this.#suffixText;
  }
  set suffixText(value = '') {
    this.#suffixText = value;
    this.#updateLineCount();
  }
  get isSpinning() {
    return this.#id !== void 0;
  }
  #getFullPrefixText(prefixText = this.#prefixText, postfix = ' ') {
    if (typeof prefixText === 'string' && prefixText !== '') {
      return prefixText + postfix;
    }
    if (typeof prefixText === 'function') {
      return prefixText() + postfix;
    }
    return '';
  }
  #getFullSuffixText(suffixText = this.#suffixText, prefix = ' ') {
    if (typeof suffixText === 'string' && suffixText !== '') {
      return prefix + suffixText;
    }
    if (typeof suffixText === 'function') {
      return prefix + suffixText();
    }
    return '';
  }
  #updateLineCount() {
    const columns = this.#stream.columns ?? 80;
    const fullPrefixText = this.#getFullPrefixText(this.#prefixText, '-');
    const fullSuffixText = this.#getFullSuffixText(this.#suffixText, '-');
    const fullText = ' '.repeat(this.#indent) + fullPrefixText + '--' + this.#text + '--' + fullSuffixText;
    this.#lineCount = 0;
    for (const line of stripAnsi(fullText).split('\n')) {
      this.#lineCount += Math.max(1, Math.ceil(stringWidth(line, { countAnsiEscapeCodes: true }) / columns));
    }
  }
  get isEnabled() {
    return this.#isEnabled && !this.#isSilent;
  }
  set isEnabled(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('The `isEnabled` option must be a boolean');
    }
    this.#isEnabled = value;
  }
  get isSilent() {
    return this.#isSilent;
  }
  set isSilent(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('The `isSilent` option must be a boolean');
    }
    this.#isSilent = value;
  }
  frame() {
    const now = Date.now();
    if (this.#frameIndex === -1 || now - this.#lastSpinnerFrameTime >= this.interval) {
      this.#frameIndex = ++this.#frameIndex % this.#spinner.frames.length;
      this.#lastSpinnerFrameTime = now;
    }
    const { frames } = this.#spinner;
    let frame = frames[this.#frameIndex];
    if (this.color) {
      frame = source_default[this.color](frame);
    }
    const fullPrefixText =
      typeof this.#prefixText === 'string' && this.#prefixText !== '' ? this.#prefixText + ' ' : '';
    const fullText = typeof this.text === 'string' ? ' ' + this.text : '';
    const fullSuffixText =
      typeof this.#suffixText === 'string' && this.#suffixText !== '' ? ' ' + this.#suffixText : '';
    return fullPrefixText + frame + fullText + fullSuffixText;
  }
  clear() {
    if (!this.#isEnabled || !this.#stream.isTTY) {
      return this;
    }
    this.#stream.cursorTo(0);
    for (let index = 0; index < this.#linesToClear; index++) {
      if (index > 0) {
        this.#stream.moveCursor(0, -1);
      }
      this.#stream.clearLine(1);
    }
    if (this.#indent || this.lastIndent !== this.#indent) {
      this.#stream.cursorTo(this.#indent);
    }
    this.lastIndent = this.#indent;
    this.#linesToClear = 0;
    return this;
  }
  render() {
    if (this.#isSilent) {
      return this;
    }
    this.clear();
    this.#stream.write(this.frame());
    this.#linesToClear = this.#lineCount;
    return this;
  }
  start(text) {
    if (text) {
      this.text = text;
    }
    if (this.#isSilent) {
      return this;
    }
    if (!this.#isEnabled) {
      if (this.text) {
        this.#stream.write(`- ${this.text}
`);
      }
      return this;
    }
    if (this.isSpinning) {
      return this;
    }
    if (this.#options.hideCursor) {
      cli_cursor_default.hide(this.#stream);
    }
    if (this.#options.discardStdin && import_node_process7.default.stdin.isTTY) {
      this.#isDiscardingStdin = true;
      stdin_discarder_default.start();
    }
    this.render();
    this.#id = setInterval(this.render.bind(this), this.interval);
    return this;
  }
  stop() {
    if (!this.#isEnabled) {
      return this;
    }
    clearInterval(this.#id);
    this.#id = void 0;
    this.#frameIndex = 0;
    this.clear();
    if (this.#options.hideCursor) {
      cli_cursor_default.show(this.#stream);
    }
    if (this.#options.discardStdin && import_node_process7.default.stdin.isTTY && this.#isDiscardingStdin) {
      stdin_discarder_default.stop();
      this.#isDiscardingStdin = false;
    }
    return this;
  }
  succeed(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.success, text });
  }
  fail(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.error, text });
  }
  warn(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.warning, text });
  }
  info(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.info, text });
  }
  stopAndPersist(options2 = {}) {
    if (this.#isSilent) {
      return this;
    }
    const prefixText = options2.prefixText ?? this.#prefixText;
    const fullPrefixText = this.#getFullPrefixText(prefixText, ' ');
    const symbolText = options2.symbol ?? ' ';
    const text = options2.text ?? this.text;
    const separatorText = symbolText ? ' ' : '';
    const fullText = typeof text === 'string' ? separatorText + text : '';
    const suffixText = options2.suffixText ?? this.#suffixText;
    const fullSuffixText = this.#getFullSuffixText(suffixText, ' ');
    const textToWrite = fullPrefixText + symbolText + fullText + fullSuffixText + '\n';
    this.stop();
    this.#stream.write(textToWrite);
    return this;
  }
};
function ora(options2) {
  return new Ora(options2);
}

// scripts/update-changelog/update-changelog.mjs
program.option('--all', 'Process all dependency bumps (not only in the latest release entry)').parse(process.argv);
var options = program.opts();
var updateAll = options.all || false;
var changelogPath = './CHANGELOG.md';
var GITHUB_TOKEN = process.env.SVC_CLI_BOT_GITHUB_TOKEN || null;
var CHANGELOG_REPO = { owner: 'jayree', repo: 'sfdx-plugin-manifest' };
var octokit = new Octokit2({
  auth: GITHUB_TOKEN,
  userAgent: 'release-injector',
});
function normalizeVersion(version) {
  return import_semver2.default.valid(version) || (import_semver2.default.coerce(version) || {}).version || null;
}
async function logApiLimits() {
  try {
    const {
      data: { rate },
    } = await octokit.rest.rateLimit.get();
    console.log(
      source_default.yellow(
        `\u26A0\uFE0F  API Rate Limits: Total: ${rate.limit}, Remaining: ${rate.remaining}, Resets at: ${new Date(
          rate.reset * 1e3,
        ).toLocaleString()}`,
      ),
    );
  } catch (error) {
    console.warn(source_default.red(`\u26A0\uFE0F  Error fetching API limits: ${error.message}`));
  }
}
function extractPRNumber(line) {
  const match = line.match(/\[#(\d+)\]/);
  return match ? match[1] : null;
}
async function getPullRequestTitle(owner, repo, prNumber) {
  try {
    const { data } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    return data.title;
  } catch (error) {
    throw new Error(`Failed to fetch PR #${prNumber}: ${error.message}`);
  }
}
async function getRepoInfo(packageName) {
  const pkg = await packageJson(packageName, { fullMetadata: true });
  const repoUrl = pkg.repository?.url;
  if (!repoUrl) throw new Error(`No repository URL for ${packageName}`);
  const parsedUrl = new import_url.URL(repoUrl);
  const allowedHosts = ['github.com', 'www.github.com'];
  if (!allowedHosts.includes(parsedUrl.host)) throw new Error(`No GitHub repository for ${packageName}`);
  const match = parsedUrl.pathname.match(/^\/(.+?)\/(.+?)(\.git)?$/);
  if (!match) throw new Error(`Invalid repository URL: ${repoUrl}`);
  return { owner: match[1], repo: match[2] };
}
async function getAllTags(owner, repo) {
  try {
    const tags = await octokit.paginate(octokit.rest.repos.listTags, {
      owner,
      repo,
      per_page: 100,
    });
    return tags.map((t) => t.name);
  } catch (error) {
    throw new Error(`Failed to fetch tags for ${repo}: ${error.message}`);
  }
}
function parseReleaseSections(text = '') {
  const sections = { features: [], fixes: [], other: [] };
  let current = 'other';
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (/^#{1,3} \[?\d+\.\d+\.\d+\]?.*?\(.*?\)/.test(trimmed)) continue;
    const lower = trimmed.toLowerCase();
    if (lower.includes('### features')) {
      current = 'features';
      continue;
    }
    if (lower.includes('### bug') || lower.includes('### fix')) {
      current = 'fixes';
      continue;
    }
    if (trimmed) sections[current].push(trimmed);
  }
  return sections;
}
async function getGroupedReleaseNotes(owner, repo, from, to) {
  const rawTags = await getAllTags(owner, repo);
  const tagObjects = rawTags
    .map((tag) => {
      const versionStr = tag.startsWith('v') ? tag.slice(1) : tag;
      const normalized = import_semver2.default.coerce(versionStr);
      return { original: tag, version: normalized ? normalized.version : null };
    })
    .filter((t) => t.version !== null);
  tagObjects.sort((a, b) => import_semver2.default.compare(a.version, b.version));
  const rangeTags = tagObjects.filter(
    (t) => import_semver2.default.gt(t.version, from) && import_semver2.default.lte(t.version, to),
  );
  const grouped = { features: [], fixes: [], other: [] };
  await Promise.all(
    rangeTags.map(async (t) => {
      try {
        const { data: release } = await octokit.rest.repos.getReleaseByTag({
          owner,
          repo,
          tag: t.original,
        });
        const parsed = parseReleaseSections(release.body || '');
        grouped.features.push(...parsed.features);
        grouped.fixes.push(...parsed.fixes);
        grouped.other.push(...parsed.other);
      } catch (error) {}
    }),
  );
  return grouped;
}
function formatGroupedAsMarkdown(grouped) {
  const format = (title, list) => (list.length ? `${list.map((l) => `  ${l}`).join('\n')}` : '');
  return (
    format('\u{1F680} Features', grouped.features) +
    (grouped.features.length && grouped.fixes.length ? '\n' : '') +
    format('\u{1F41B} Bug Fixes', grouped.fixes) +
    (grouped.fixes.length && grouped.other.length ? '\n' : '') +
    format('\u{1F4C4} Other Changes', grouped.other)
  );
}
async function processDependencyBump(line) {
  const depsPatternFull = /^\* \*\*deps:\*\* bump ([\w@/.\-]+) from ([^\s]+) to ([^\s]+).*$/;
  const depsPatternPartial = /^\* \*\*deps:\*\* bump ([\w@/.\-]+).*$/;
  const matchFull = line.match(depsPatternFull);
  if (matchFull) {
    if (matchFull.length < 4) {
      console.warn(source_default.red(`\u26A0\uFE0F Full pattern match did not capture all groups: ${matchFull}`));
      return null;
    }
    const [, pkg, fromVersion, toVersion] = matchFull;
    return { pkg, fromVersion, toVersion };
  }
  const matchPartial = line.match(depsPatternPartial);
  if (matchPartial) {
    if (matchPartial.length < 2) {
      console.warn(source_default.red(`\u26A0\uFE0F Partial pattern match did not capture package: ${matchPartial}`));
      return null;
    }
    const pkg = matchPartial[1];
    console.warn(source_default.yellow(`\u{1F50D} Partial match for ${pkg}`));
    const prNumber = extractPRNumber(line);
    if (!prNumber) {
      console.warn(source_default.red(`\u26A0\uFE0F No PR number for ${pkg}`));
      return null;
    }
    const { owner: prOwner, repo: prRepo } = CHANGELOG_REPO;
    const prTitle = await getPullRequestTitle(prOwner, prRepo, prNumber);
    const versionMatch = prTitle.match(/bump .* from ([^\s]+) to ([^\s]+)/i);
    if (!versionMatch || versionMatch.length < 3) {
      console.warn(source_default.red(`\u26A0\uFE0F No version info in PR title for ${pkg}`));
      return null;
    }
    const [, fromVersion, toVersion] = versionMatch;
    return { pkg, fromVersion, toVersion };
  }
  return null;
}
function getLatestEntryIndices(lines) {
  const releaseHeaderRegex = /^#{1,3} \[?\d+\.\d+\.\d+\]?.*?\(.*?\)/;
  let start = -1,
    end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (releaseHeaderRegex.test(lines[i])) {
      if (start === -1) start = i;
      else {
        end = i;
        break;
      }
    }
  }
  return { start: start === -1 ? 0 : start, end };
}
async function preCommit(props) {
  const rateSpinner = ora('Fetching API rate limits...').start();
  await logApiLimits();
  rateSpinner.succeed('API rate limits fetched.');
  if (GITHUB_TOKEN) console.log(source_default.yellow('Using GitHub token for API requests'));
  const { SVC_CLI_BOT_GITHUB_TOKEN } = process.env;
  if (SVC_CLI_BOT_GITHUB_TOKEN)
    console.log(source_default.yellow('Using SVC_CLI_BOT_GITHUB_TOKEN token for API requests'));
  const content = import_fs.default.readFileSync(changelogPath, 'utf-8');
  const lines = content.split('\n');
  const { start: latestStart, end: latestEnd } = getLatestEntryIndices(lines);
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);
    if (!updateAll && (i < latestStart || i >= latestEnd)) continue;
    const bump = await processDependencyBump(line);
    if (!bump) continue;
    const { pkg, fromVersion, toVersion } = bump;
    const normalizedFrom = normalizeVersion(fromVersion);
    const normalizedTo = normalizeVersion(toVersion);
    if (!normalizedFrom || !normalizedTo) {
      console.warn(source_default.red(`Invalid versions for ${pkg}: ${fromVersion} \u2192 ${toVersion}`));
      continue;
    }
    const depSpinner = ora(`Processing dependency bump for ${pkg}...`).start();
    try {
      const { owner, repo } = await getRepoInfo(pkg);
      const grouped = await getGroupedReleaseNotes(owner, repo, normalizedFrom, normalizedTo);
      const markdown = formatGroupedAsMarkdown(grouped);
      if (markdown.trim()) {
        newLines.push(markdown);
        depSpinner.succeed(source_default.green(`Inserted notes for ${pkg}: ${normalizedFrom} \u2192 ${normalizedTo}`));
      } else {
        depSpinner.info(source_default.blue(`No notes found for ${pkg}: ${normalizedFrom} \u2192 ${normalizedTo}`));
      }
    } catch (err) {
      depSpinner.fail(source_default.red(`Skipped ${pkg}: ${err.message}`));
    }
  }
  import_fs.default.writeFileSync(changelogPath, newLines.join('\n'), 'utf-8');
  console.log(source_default.green('CHANGELOG.md updated'));
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    preCommit,
  });
/*! Bundled license information:

deep-extend/lib/deep-extend.js:
  (*!
   * @description Recursive object extending
   * @author Viacheslav Lotsmanov <lotsmanov89@gmail.com>
   * @license MIT
   *
   * The MIT License (MIT)
   *
   * Copyright (c) 2013-2018 Viacheslav Lotsmanov
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy of
   * this software and associated documentation files (the "Software"), to deal in
   * the Software without restriction, including without limitation the rights to
   * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
   * the Software, and to permit persons to whom the Software is furnished to do so,
   * subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
   * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
   * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
   * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
   * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
   *)

ky/distribution/index.js:
  (*! MIT License © Sindre Sorhus *)
*/
