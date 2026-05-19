sap.ui.define([
    "sap/ui/core/UIComponent"
], function (UIComponent) {
    "use strict";

    return UIComponent.extend("ferias1000.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            // Chama a função init da classe pai
            UIComponent.prototype.init.apply(this, arguments);
        }
    });
});
