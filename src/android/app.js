/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 */

/**
 * Constructor
 * @constructor
 */
PG.app = {

    /**
     * Clear the resource cache.
     */
    clearCache: function() {
        PG.exec(null, null, "App", "clearCache", []);
    },

    /**
     * Load the url into the webview.
     *
     * @param url           The URL to load
     * @param props         Properties that can be passed in to the activity:
     *      wait: int                           => wait msec before loading URL
     *      loadingDialog: "Title,Message"      => display a native loading dialog
     *      hideLoadingDialogOnPage: boolean    => hide loadingDialog when page loaded instead of when deviceready event occurs.
     *      loadInWebView: boolean              => cause all links on web page to be loaded into existing web view, instead of being loaded into new browser.
     *      loadUrlTimeoutValue: int            => time in msec to wait before triggering a timeout error
     *      errorUrl: URL                       => URL to load if there's an error loading specified URL with loadUrl().  Should be a local URL such as file:///android_asset/www/error.html");
     *      keepRunning: boolean                => enable app to keep running in background
     *
     * Example:
     *      App app = new App();
     *      app.loadUrl("http://server/myapp/index.html", {wait:2000, loadingDialog:"Wait,Loading App", loadUrlTimeoutValue: 60000});
     */
    loadUrl: function(url, props) {
        PG.exec(null, null, "App", "loadUrl", [url, props]);
    },

    /**
     * Cancel loadUrl that is waiting to be loaded.
     */
    cancelLoadUrl: function() {
        PG.exec(null, null, "App", "cancelLoadUrl", []);
    },

    /**
     * Clear web history in this web view.
     * Instead of BACK button loading the previous web page, it will exit the app.
     */
    clearHistory: function() {
        PG.exec(null, null, "App", "clearHistory", []);
    },

    /**
     * Override the default behavior of the Android back button.
     * If overridden, when the back button is pressed, the "backKeyDown" JavaScript event will be fired.
     *
     * Note: The user should not have to call this method.  Instead, when the user
     *       registers for the "backbutton" event, this is automatically done.
     *
     * @param override		T=override, F=cancel override
     */
    overrideBackbutton: function(override) {
        PG.exec(null, null, "App", "overrideBackbutton", [override]);
    },

    /**
     * Exit and terminate the application.
     */
    exitApp: function() {
    	return PG.exec(null, null, "App", "exitApp", []);
    }
};