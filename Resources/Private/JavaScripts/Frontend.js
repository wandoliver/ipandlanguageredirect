/**
 * Ipandlanguageredirect functions
 *
 * @class IpandlanguageredirectFrontend
 */
function IpandlanguageredirectFrontend() {
	'use strict';

	/**
	 * @type {IpandlanguageredirectFrontend}
	 */
	var that = this;

	/**
	 * Container id
	 *
	 * @type {string}
	 */
	var containerId = 'ipandlanguageredirect_container';

	/**
	 * @type {string}
	 */
	var showSuggestClassname = 'fadein';

	/**
	 * @type {{r: number}}
	 */
	var alreadyRedirectedParameter = {r: 1};

	/**
	 * If cookieMode is different to "permanent", cookie will be deleted with browserclose.
	 * "permanent" will add a cookie with 1 year livetime.
	 * And because of the fast moving internet world, 1 year is rather permanent :)
	 *
	 * @type {string}
	 */
	var cookieMode = 'permanent';

	/**
	 * Show redirect URI instead of redirecting
	 *
	 * @type {boolean}
	 */
	var debugMode = false;

	/**
	 * Initialize
	 *
	 * @returns {void}
	 */
	this.initialize = function() {
		setDebug();
		addHideMessageListener();
		if (isActivated()) {
			ajaxConnection(getAjaxUri(), getParametersForAjaxCall());
		}
	};

	/**
	 * Set debug value if &formselectiondebug=1
	 *
	 * @returns {void}
	 */
	var setDebug = function() {
		if (window.location.search.indexOf('ipandlanguagedebug=1') !== -1) {
			debugMode = true;
			console.log('ipandlanguageredirect debug activated');
		}
	};

	/**
	 * Add listener to hide message function
	 */
	var addHideMessageListener = function() {
		var element = getFirstContainerByDataAttribute('data-ipandlanguageredirect-action', 'hideMessage');
		element.onclick = function() {
			setHideMessageCookie();
			hideSuggestContainer();
		}
	};

	/**
	 * @params {string} uri
	 * @params {object} parameters
	 * @returns void
	 */
	var ajaxConnection = function(uri, parameters) {
		if (uri) {
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState === 4 && this.status === 200) {
					var jsonObject = JSON.parse(this.responseText);
					doAction(jsonObject);
				}
			};
			xhttp.open('POST', mergeUriWithParameters(uri, parameters), true);
			xhttp.send();
		} else {
			console.log('No ajax URI given!');
		}
	};

	/**
	 * Decide what to do after AJAX received JSON object
	 *
	 * @param jsonObject
	 */
	var doAction = function(jsonObject) {
		if (jsonObject.activated &&  Array.isArray(jsonObject.events)) {
			// iterate through events
			for (var key in jsonObject.events) {
				if (jsonObject.events.hasOwnProperty(key)) {
					that[jsonObject.events[key] + 'Event'](jsonObject);
				}
			}
		}
	};

	/**
	 * This function is triggered when AJAX says the browser should be redirected
	 *
	 * @param jsonObject
	 */
	this.redirectEvent = function(jsonObject) {
		var uri = buildRedirectUri(jsonObject.redirectUri);
		if (debugMode) {
			console.log('Redirect to following URI:');
			console.log(uri);
		} else {
			window.location = uri;
		}
	};

	/**
	 * This function is triggered when AJAX says something should be suggested
	 *
	 * @param jsonObject
	 */
	this.suggestEvent = function(jsonObject) {
		if (!isHideMessageCookieSet()) {
			var uri = buildRedirectUri(jsonObject.redirectUri);
			if (debugMode) {
				console.log('Suggest the following URI:');
				console.log(uri);
			} else {
				updateRedirectUriInSuggestContainer(jsonObject);
				showSuggestContainer();
			}
		}
	};

	/**
	 * @param jsonObject
	 */
	var updateRedirectUriInSuggestContainer = function(jsonObject) {
		var linkContainer = getFirstContainerByDataAttribute('data-ipandlanguageredirect-container', 'link');
		linkContainer.setAttribute('href', jsonObject.redirectUri);
	};

	/**
	 * Show suggest container
	 *
	 * @returns {void}
	 */
	var showSuggestContainer = function() {
		var suggestContainer = getFirstContainerByDataAttribute('data-ipandlanguageredirect-container', 'suggest');
		suggestContainer.classList.add(showSuggestClassname);
	};

	/**
	 * Hide suggest container
	 *
	 * @returns {void}
	 */
	var hideSuggestContainer = function() {
		var suggestContainer = getFirstContainerByDataAttribute('data-ipandlanguageredirect-container', 'suggest');
		suggestContainer.classList.remove(showSuggestClassname);
	};

	/**
	 * Build redirect URI with parameter that indicates, that
	 * @param {string} basicUri
	 * @returns {string}
	 */
	var buildRedirectUri = function(basicUri) {
		return mergeUriWithParameters(basicUri, alreadyRedirectedParameter);
	};

	/**
	 * @returns {string}
	 */
	var getAjaxUri = function() {
		var container = getContainer();
		if (container !== null) {
			return container.getAttribute('data-ajax-uri');
		}
		return '';
	};

	/**
	 * @returns {object}
	 */
	var getContainer = function() {
		return document.getElementById(containerId);
	};

	/**
	 * Get the first container by its data-attribute name
	 * 		"suggest" delivers element with data-ipandlanguageredirect-container="suggest"
	 *
	 * @param {string} dataKey
	 * @param {string} value
	 * @returns {object|null}
	 */
	var getFirstContainerByDataAttribute = function(dataKey, value) {
		var elements = document.querySelectorAll('[' + dataKey + ']');
		for (var key in elements) {
			if (elements.hasOwnProperty(key)) {
				if (elements[key].getAttribute(dataKey) === value) {
					return elements[key];
				}
			}
		}
		return null;
	};

	/**
	 * Get parameters for ajax call
	 *
	 * @returns {object}
	 */
	var getParametersForAjaxCall = function() {
		return {
			'tx_ipandlanguageredirect_pi1[browserLanguage]': getBrowserLanguage(),
			'tx_ipandlanguageredirect_pi1[ipAddress]': '',
			'tx_ipandlanguageredirect_pi1[referrer]': getReferrer(),
			'tx_ipandlanguageredirect_pi1[languageUid]': getLanguageUid(),
			'tx_ipandlanguageredirect_pi1[rootpageUid]': getRootpageUid()
		};
	};

	/**
	 * Get Browserlanguage (get "de" from "de" or from "de-DE")
	 *
	 * @returns {string}
	 */
	var getBrowserLanguage = function() {
		var userLang = navigator.language || navigator.userLanguage;
		var parts = userLang.split('-');
		return parts[0];
	};

	/**
	 * @returns {string}
	 */
	var getReferrer = function() {
		return document.referrer;
	};

	/**
	 * @returns {string}
	 */
	var getLanguageUid = function() {
		var container = getContainer();
		if (container !== null) {
			return container.getAttribute('data-language-uid');
		}
		return 0;
	};

	/**
	 * @returns {string}
	 */
	var getRootpageUid = function() {
		var container = getContainer();
		if (container !== null) {
			return container.getAttribute('data-rootpage-uid');
		}
		return 1;
	};

	/**
	 * Check if we should send an AJAX request
	 * 		- only if already redirected parameter is not set
	 * 		- only if container is in DOM
	 *
	 * @returns {boolean}
	 */
	var isActivated = function() {
		var container = getContainer();
		return container !== null
			&& window.location.href.indexOf('?r=1') === -1 && window.location.href.indexOf('&r=1') === -1;
	};

	/**
	 * Build an uri string for an ajax call together with params from an object
	 * 		{
	 * 			'x': 123,
	 * 			'y': 'abc'
	 * 		}
	 *
	 * 		=>
	 *
	 * 		"?x=123&y=abc"
	 *
	 * @params {string} uri
	 * @params {object} parameters
	 * @returns {string} e.g. "index.php?id=123&type=123&x=123&y=abc"
	 */
	var mergeUriWithParameters = function(uri, parameters) {
		for (var key in parameters) {
			if (parameters.hasOwnProperty(key)) {
				if (uri.indexOf('?') !== -1) {
					uri += '&';
				} else {
					uri += '?';
				}
				uri += key + '=' + parameters[key];
			}
		}
		return uri;
	};

	/**
	 * @returns {boolean}
	 */
	var isHideMessageCookieSet = function() {
		return getCookieByName('ipandlanguageredirect_hidemessage') === '1';
	};

	/**
	 * Set hide message cookie
	 *
	 * @returns {void}
	 */
	var setHideMessageCookie = function() {
		if (cookieMode === 'permanent') {
			var now = new Date();
			var time = now.getTime();
			time += 3600 * 24 * 365 * 1000; // 1 year from now
			now.setTime(time);
			document.cookie = 'ipandlanguageredirect_hidemessage=1; expires=' + now.toUTCString() + '; path=/';
			console.log(document.cookie);
		} else {
			document.cookie = 'ipandlanguageredirect_hidemessage=1; path=/';
		}
	};

	/**
	 * Get cookie value by its name
	 *
	 * @param cookieName
	 * @returns {string}
	 */
	var getCookieByName = function(cookieName) {
		var name = cookieName + '=';
		var ca = document.cookie.split(';');
		for(var i=0; i<ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) === ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) === 0) {
				return c.substring(name.length, c.length);
			}
		}
		return '';
	};
}

var Ipandlanguageredirect = new window.IpandlanguageredirectFrontend();
Ipandlanguageredirect.initialize();
