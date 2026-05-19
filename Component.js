sap.ui.define([
    "sap/ui/core/UIComponent"
], function (UIComponent) {
    "use strict";

    return UIComponent.extend("ferias1000.Component", {
        metadata: {
            interfaces: ["sap.ui.core.IAsyncContentCreation"],
            manifest: "json"
        },

        init: function () {
            // Apenas inicializa o componente base
            UIComponent.prototype.init.apply(this, arguments);
        }
    });
});
