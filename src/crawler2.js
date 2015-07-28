var Url = require('url'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    BrokenLinkChecker = require('broken-link-checker'),
    BrokenLinks = require('./broken');

module.exports = inherit({
    _initialUrl: undefined,  // initial url

    _logger: undefined, // logger instance
    _options: undefined, // application options

    _rules: undefined, // rules (settings) for parsing

    _brokenUrls: undefined, // broken links(urls) model instance
    _processed: undefined, // hash of already processed urls for preventing infinite loops

    _checker: undefined,

    __constructor: function (options) {
        options = options || {};

        var loggerOptions = options['logger'] || { level: 'debug' };
        this._logger = Logger.setOptions(loggerOptions).createLogger(module);

        this
            .setOption(options, 'acceptedSchemes', this.__self.DEFAULT.acceptedSchemes)
            .setOption(options, 'excludedSchemes', this.__self.DEFAULT.excludedSchemes)
            .setOption(options, 'excludeExternalLinks', this.__self.DEFAULT.excludeExtrnalLinks)
            .setOption(options, 'excludeInternalLinks', this.__self.DEFAULT.excludeInternalLinks)
            .setOption(options, 'filterLevel', this.__self.DEFAULT.filterLevel)
            .setOption(options, 'maxSocketsPerHost', this.__self.DEFAULT.maxSocketsPerHost);

        this.setRule(options, 'excludeLinkPatterns', []);

        this._checker = new BrokenLinkChecker['HtmlUrlChecker'](this._options, {
            link: this.onLink.bind(this),
            item: this.onItem.bind(this),
            end: this.onDone.bind(this)
        });

        this._processed = {};
    },

    /**
     * Sets value to options model for given option field name
     * @param {Object} options      — configuration object
     * @param {String} name         - name of option field
     * @param {*}      defaultValue - option default value
     * @returns {exports}
     */
    setOption: function (options, name, defaultValue) {
        this._options = this._options || {};
        this._options[name] = options[name] || defaultValue;
        if (options[name] === false) {
            this._options[name] = options[name];
        }

        if (!this.__self.isFunction(this._options[name])) {
            this._logger.debug('Set option [%s] => %s', name,
                this.__self.isObject(this._options[name]) ? JSON.stringify(this._options[name]) : this._options[name]);
        }
        return this;
    },

    /**
     * Returns option value by given option name
     * @param {String} name — option name
     * @returns {*}
     */
    getOption: function (name) {
        return this._options[name];
    },

    /**
     * Sets value to rules model for given rule field name
     * @param {Object} rules        — rules object
     * @param {String} name         - name of rule field
     * @param {*}      defaultValue - rule default value
     * @returns {exports}
     */
    setRule: function (rules, name, defaultValue) {
        this._rules = this._rules || {};
        this._rules[name] = rules[name] || defaultValue;
        if (!this.__self.isFunction(this._rules[name])) {
            this._logger.debug('Set rule [%s] => %s', name, this._rules[name]);
        }
        return this;
    },

    /**
     * Returns rule value by given rule name
     * @param {String} name — rule name
     * @returns {*}
     */
    getRule: function (name) {
        return this._rules[name];
    },

    onLink: function (result) {
        if (result.error) {
            var originalUrl = result.url['original'],
                statusCode = result.http.statusCode;
            this._logger.error('Broken: [%s] url: => %s', statusCode, originalUrl);
            this._brokenUrls.add(originalUrl, statusCode);
        }

        var resolvedUrl = result.url['resolved'].replace(/\/$/, '');
        if (this._processed[resolvedUrl]) {
            return;
        }

        this._logger.verbose('processLink: => %s', resolvedUrl);
        this._processed[resolvedUrl] = true;
        this._checker['enqueue'](resolvedUrl);
    },

    onItem: function (error, htmlUrl) {
        if (error) {
            this._logger.error('Error: %s for url: => %s', error, htmlUrl);
        }
        this._logger.debug('Complete for: => %s', htmlUrl);
    },

    onDone: function () {
        this._logger.info('DONE');
    },

    /**
     * Start to crawl pages for given url
     * @param {String} url - initial site url for start crawl
     */
    start: function (url) {
        if (!url) {
            throw new Error('Url was not set');
        }

        if (!url.match(this.__self.CONSTANTS.URL_REGEXP)) {
            throw new Error('Urls is not valid');
        }

        this._brokenUrls = BrokenLinks.create();

        this._initialUrl = Url.parse(url);
        this._logger
            .info('START to crawl pages')
            .info('It can be take a long time. Please wait ...');

        this._checker['enqueue'](url);
    }
}, {
    /**
     * Checks if given object is instance of Object
     * @param {Object|*} obj
     * @returns {boolean} true if obj is instance of Object class
     */
    isObject: function (obj) {
        return !!obj && typeof obj === 'object';
    },

    /**
     * Checks if given object is instance of Function
     * @param {Object|*} obj
     * @returns {boolean} true if obj is Function
     */
    isFunction: function (obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    },

    /**
     * Checks if given object is instance of String
     * @param {Object|*} obj
     * @returns {boolean} true if obj is String
     */
    isString: function (obj) {
        return typeof obj === 'string' || obj instanceof String;
    },
    DEFAULT: {
        acceptedSchemes: ['http', 'https'],
        excludedSchemes: ['data', 'geo', 'javascript', 'mailto', 'sms', 'tel'],
        excludeExtrnalLinks: true,
        excludeInternalLinks: false,
        filterLevel: 1,
        maxSocketsPerHost: 10
    },
    CONSTANTS: {
        URL_REGEXP: /https?\:\/\/\w+((\:\d+)?\/\S*)?/
    }
});

