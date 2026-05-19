sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            var oModel = new JSONModel({
                documentos: JSON.parse(localStorage.getItem("ferias1000_docs") || "[]"),
                reservas: JSON.parse(localStorage.getItem("ferias1000_res") || "[]"),
                passagens: JSON.parse(localStorage.getItem("ferias1000_pass") || "[]"),
                novo: { tipo: "", hotel: "", voo: "" },
                cidade: "Aguardando..."
            });
            this.getView().setModel(oModel, "view");
        },

        onSalvar: function (sProp, sKey, sMsg) {
            var oModel = this.getView().getModel("view");
            var aList = oModel.getProperty("/" + sProp);
            var oNovo = oModel.getProperty("/novo");
            aList.push({ ...oNovo });
            localStorage.setItem(sKey, JSON.stringify(aList));
            oModel.setProperty("/" + sProp, aList);
            oModel.setProperty("/novo", { tipo: "", hotel: "", voo: "" });
            MessageToast.show(sMsg);
        },

        onSalvarDocs: function () { this.onSalvar("documentos", "ferias1000_docs", "Documento salvo!"); },
        onSalvarRes: function () { this.onSalvar("reservas", "ferias1000_res", "Reserva salva!"); },
        onSalvarPass: function () { this.onSalvar("passagens", "ferias1000_pass", "Passagem salva!"); }
    });
});
