sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        /**
         * Ciclo de vida: Inicialização do Controlador
         */
        onInit: function () {
            console.log("Main Controller inicializado com sucesso.");
            
            // O modelo "view" já foi instanciado no Component.js, 
            // então aqui apenas garantimos que o mapa será renderizado após a visualização estar pronta.
            this.oMapView = this.getView();
        },

        /**
         * Ciclo de vida: Executado após a renderização da View na tela.
         * Ideal para inicializar elementos que dependem do DOM, como o Leaflet.
         */
        onAfterRendering: function () {
            this.initMap();
        },

        /**
         * Inicializa o mapa do Leaflet centralizado no Brasil ou coordenada padrão
         */
        initMap: function () {
            // Obtém o ID interno do container onde o mapa vai renderizar (ex: um div ou FlexBox com id="map")
            // Certifique-se de que na sua Main.view.xml exista um elemento com id="map" ou ajuste aqui.
            var oMapDomRef = this.getView().byId("map") ? this.getView().byId("map").getDomRef() : null;
            
            // Se não achar pelo ID do UI5, tenta buscar pelo ID nativo do HTML se aplicável
            if (!oMapDomRef) {
                oMapDomRef = document.getElementById("map") || document.getElementById("container---Main--map");
            }

            if (oMapDomRef) {
                // Instancia o mapa Leaflet
                this._oMap = L.map(oMapDomRef).setView([-15.7801, -47.9292], 4); // Coordenadas padrão (Brasília)

                // Adiciona a camada de mapa do OpenStreetMap
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(this._oMap);

                console.log("Mapa Leaflet inicializado com sucesso.");
                this._carregarPontosNoMapa();
            } else {
                console.warn("Container do mapa não encontrado no DOM. Verifique o ID na View.");
            }
        },

        /**
         * Exemplo de função para ler os dados do modelo e plotar marcadores
         */
        _carregarPontosNoMapa: function () {
            var oModel = this.getView().getModel("view");
            if (!oModel) { return; }

            var aLugares = oModel.getProperty("/lugares") || [];
            
            aLugares.forEach(function (oLugar) {
                if (oLugar.latitude && oLugar.longitude) {
                    L.marker([oLugar.latitude, oLugar.longitude])
                        .addTo(this._oMap)
                        .bindPopup(oLugar.nome || "Local de Interesse");
                }
            }.bind(this));
        },

        /**
         * Salva um novo documento no LocalStorage e atualiza o modelo
         */
        onSalvarDocumento: function (oEvent) {
            var oModel = this.getView().getModel("view");
            var aDocumentos = oModel.getProperty("/documentos") || [];

            // Exemplo de estrutura de novo documento (pode ser alimentado por inputs da tela)
            var oNovoDocumento = {
                id: new Date().getTime(),
                tipo: "Passaporte",
                status: "Válido"
            };

            aDocumentos.push(oNovoDocumento);
            oModel.setProperty("/documentos", aDocumentos);

            // Persiste no LocalStorage
            localStorage.setItem("ferias1000_documentos", JSON.stringify(aDocumentos));
            console.log("Documento salvo com sucesso.");
        }
    });
});
