sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/core/mvc/XMLView"
], function (UIComponent, XMLView) {
    "use strict";

    return UIComponent.extend("ferias1000.Component", {
        metadata: {
            interfaces: ["sap.ui.core.IAsyncContentCreation"],
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
        },

        createContent: function () {
            return XMLView.create({
                viewName: "ferias1000.Main"
            });
        }
    });
});
