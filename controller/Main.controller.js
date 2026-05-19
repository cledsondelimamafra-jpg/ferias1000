sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        /**
         * Ciclo de vida: Inicialização
         */
        onInit: function () {
            console.log("Main Controller totalmente acoplado à View.");
            
            // Instancia o reconhecimento de voz (Web Speech API) se disponível no navegador
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this._oRecognition = new SpeechRecognition();
                this._oRecognition.lang = 'pt-BR';
                this._oRecognition.interimResults = false;
                this._oRecognition.maxAlternatives = 1;

                // Evento disparado quando o usuário termina de falar com sucesso
                this._oRecognition.onresult = this._onSpeechResult.bind(this);
                
                // Trata possíveis erros do microfone
                this._oRecognition.onerror = function (oEvent) {
                    console.error("Erro no reconhecimento de voz: ", oEvent.error);
                    MessageToast.show("Erro no microfone: " + oEvent.error);
                };
            } else {
                console.warn("Este navegador não suporta a Web Speech API (Comandos de Voz).");
            }
        },

        /**
         * Ciclo de vida: Disparado AUTOMATICAMENTE assim que o SAPUI5 injeta o HTML na tela.
         * Fundamental para o Leaflet achar o container e desenhar as linhas do mapa.
         */
        onAfterRendering: function () {
            this.initMap();
        },

        /**
         * Inicialização dinâmica do Mapa Leaflet
         */
        initMap: function () {
            // 1. Tenta capturar o container do mapa criado na sua View XML
            // O SAPUI5 costuma gerar IDs dinâmicos na árvore do DOM. Vamos varrer as opções mais seguras:
            var oMapDomRef = null;
            
            if (this.getView().byId("map")) {
                oMapDomRef = this.getView().byId("map").getDomRef();
            }
            
            // Fallback caso o componente XML use um ID estático nativo do HTML ou container alternativo
            if (!oMapDomRef) {
                oMapDomRef = document.getElementById("map") || 
                             document.querySelector("[id*='--map']") || 
                             document.getElementById("container-ferias1000---Main--map");
            }

            // 2. Se encontrar o elemento HTML na tela, renderiza o mapa
            if (oMapDomRef) {
                // Previne reinicialização caso o método seja chamado mais de uma vez acidentalmente
                if (this._oMap) {
                    this._oMap.remove();
                }

                // Cria o mapa focando no Rio de Janeiro (conforme o estado atual do seu print) ou visão geral
                this._oMap = L.map(oMapDomRef).setView([-22.9068, -43.1729], 11);

                // Aplica a camada visual de mapas públicos do OpenStreetMap
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(this._oMap);

                // Insere um marcador inicial elegante no mapa
                L.marker([-22.9068, -43.1729])
                    .addTo(this._oMap)
                    .bindPopup("<b>Rio de Janeiro</b><br>Destino Selecionado.")
                    .openPopup();

                console.log("Mapa Leaflet renderizado e acoplado com sucesso!");
                
                // Força o Leaflet a recalcular o tamanho físico do container (resolve falha de mapa cinza ou cortado)
                setTimeout(function() {
                    this._oMap.invalidateSize();
                }.bind(this), 400);

            } else {
                console.error("ERRO: Não encontramos nenhuma tag com id='map' no seu arquivo Main.view.xml.");
                MessageToast.show("Não foi possível renderizar o mapa. ID 'map' não localizado.");
            }
        },

        /**
         * Evento disparado ao clicar no botão "Falar Destino" (press="onFalarDestino")
         */
        onFalarDestino: function () {
            if (this._oRecognition) {
                this._oRecognition.start();
                MessageToast.show("Pode falar... Ouvindo seu destino!");
                console.log("Microfone ativado via Web Speech API.");
            } else {
                MessageToast.show("Comando de voz não suportado ou bloqueado neste navegador.");
            }
        },

        /**
         * Processamento interno do texto capturado pelo Microfone
         */
        _onSpeechResult: function (oEvent) {
            var sResultadoVoz = oEvent.results[0][0].transcript;
            console.log("Texto reconhecido pelo microfone: ", sResultadoVoz);

            // Obtém o modelo "view" carregado no Component.js
            var oModel = this.getView().getModel("view");
            
            if (oModel) {
                // Atualiza a propriedade local dinamicamente na tela (Data Binding)
                oModel.setProperty("/local/cidade", sResultadoVoz);
                MessageToast.show("Buscando por: " + sResultadoVoz);
                
                // Aqui você pode expandir chamando sua API de clima ou geocodificação baseada no nome falado!
                this._atualizarMapaParaCidade(sResultadoVoz);
            }
        },

        /**
         * Move o mapa e adiciona um pino dinâmico com base na busca por voz
         */
        _atualizarMapaParaCidade: function (sCidade) {
            if (!this._oMap) { return; }

            // Lógica simples de Mock/Demonstração baseada no seu print padrão do Rio de Janeiro
            if (sCidade.toLowerCase().includes("rio") || sCidade.toLowerCase().includes("janeiro")) {
                var oCoordenadasRio = [-22.9068, -43.1729];
                this._oMap.setView(oCoordenadasRio, 11);
                
                L.marker(oCoordenadasRio)
                    .addTo(this._oMap)
                    .bindPopup("<b>" + sCidade + "</b><br>Atualizado via Comando de Voz!")
                    .openPopup();
            } else {
                // Caso fale outro lugar, mantém a flexibilidade de adicionar pinos centrais para demonstração
                // No futuro, pode acoplar uma requisição fetch() para um serviço de mapas para converter nome em Lat/Long
                console.log("Cidade reconhecida para futura geocodificação: " + sCidade);
            }
        }
    });
});
