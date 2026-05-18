sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {
        onInit: function () {
            // Inicializa o modelo dinâmico da aplicação
            var oModel = new JSONModel({
                local: {
                    cidade: "Diamantina, MG", // Um ponto inicial padrão de exemplo
                    coordenadas: "-18.2443, -43.6011"
                },
                clima: {
                    temp: "22 °C"
                },
                lugares: [
                    { nome: "Centro Histórico", categoria: "Cultura & Passeio" },
                    { nome: "Cachoeira dos Cristais", categoria: "Ecoturismo" }
                ]
            });
            this.getView().setModel(oModel, "view");
        },

        onAfterRendering: function () {
            // Esse método roda AUTOMATICAMENTE quando a tela termina de desenhar.
            // É o momento exato para injetar o Leaflet de forma segura.
            try {
                if (typeof L !== 'undefined') {
                    // Inicializa o mapa focando em Diamantina por padrão
                    var map = L.map('mapaDestino').setView([-18.2443, -43.6011], 13);

                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap contributors'
                    }).addTo(map);

                    L.marker([-18.2443, -43.6011]).addTo(map)
                        .bindPopup('Ponto Inicial: Diamantina')
                        .openPopup();
                    
                    // Força o mapa a recalcular o tamanho físico do container
                    setTimeout(function() {
                        map.invalidateSize();
                    }, 400);
                }
            } catch (oError) {
                console.error("Erro ao carregar o mapa Leaflet: ", oError);
            }
        },

        onIniciarComandoVoz: function () {
            // Evento de clique do botão
            MessageToast.show("Microfone ativado! O motor de voz está respondendo.");
        }
    });
});
