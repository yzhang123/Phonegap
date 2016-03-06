// for debugging errors on phone
window.onerror = function (errorMsg, url, lineNumber) {
    window.alert("ERROR" +
        "\n Message: " + errorMsg +
        "\n URL: " + url +
        "\n Line#: " + lineNumber);
    return false;
};

// enqueue event handler IN FRONT of existing handlers
$.fn.preBind = function (type, data, fn) {
    this.each(function () {
        var $this = $(this);

        $this.bind(type, data, fn);

        var currentBindings = $._data(this, 'events')[type];
        if ($.isArray(currentBindings)) {
            currentBindings.unshift(currentBindings.pop());
        }
    });
    return this;
};