sap.ui.define([
    "sap/ui/core/UIComponent"
], function (UIComponent) {
    "use strict";

    return UIComponent.extend("ferias1000.Component", {
        metadata: {
            manifest: "json"
        },
        init: function () {
            // Chama a função init padrão do framework
            UIComponent.prototype.init.apply(this, arguments);
        }
    });
});
