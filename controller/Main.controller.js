sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        _map: null,
        _marker: null,

        onInit: function () {
            var oModel = new JSONModel({
                local: { cidade: "Diamantina, MG", coordenadas: "-18.2443, -43.6011", clima: "22 °C" },
                lugares: [
                    { nome: "Centro Histórico", categoria: "Cultura & Passeio" },
                    { nome: "Cachoeira dos Cristais", categoria: "Ecoturismo" }
                ]
            });
            this.getView().setModel(oModel, "view");
        },

        onAfterRendering: function () {
            if (typeof L !== 'undefined' && !this._map) {
                this._map = L.map('mapaDestino').setView([-18.2443, -43.6011], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this._map);
                this._marker = L.marker([-18.2443, -43.6011]).addTo(this._map).bindPopup('Diamantina').openPopup();
                
                var oMap = this._map;
                setTimeout(function() { oMap.invalidateSize(); }, 500);
            }
        },

        onIniciarComandoVoz: function () {
            var that = this;
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                MessageToast.show("Microfone não suportado neste navegador.");
                return;
            }

            var recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            
            recognition.onstart = function () {
                MessageToast.show("Microfone ativo! Pode falar...");
            };

            recognition.onerror = function (event) {
                MessageToast.show("Erro no microfone: " + event.error);
            };

            recognition.onresult = function (event) {
                var sResult = event.results[0][0].transcript.replace(/\.$/, "");
                MessageToast.show("Buscando: " + sResult);
                that._buscarCidadeAPI(sResult);
            };

            recognition.start();
        },

        _buscarCidadeAPI: function (sCidade) {
            var oModel = this.getView().getModel("view");
            var that = this;
            var sUrl = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(sCidade);

            fetch(sUrl, { headers: { 'Accept': 'application/json' } })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data && data.length > 0) {
                        var lat = parseFloat(data[0].lat);
                        var lon = parseFloat(data[0].lon);

                        oModel.setProperty("/local/cidade", data[0].display_name);
                        oModel.setProperty("/local/coordenadas", lat.toFixed(4) + ", " + lon.toFixed(4));
                        oModel.setProperty("/local/clima", (18 + Math.floor(Math.random() * 10)) + " °C");

                        if (that._map && that._marker) {
                            that._map.setView([lat, lon], 12);
                            that._marker.setLatLng([lat, lon]).setPopupContent("Destino: " + sCidade).openPopup();
                        }
                    } else {
                        MessageToast.show("Destino não encontrado.");
                    }
                });
        }
    });
});
