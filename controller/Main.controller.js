sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("ferias1000.controller.Main", {

        onInit: function () {
            console.log("Main Controller operacional - Armazenamento Local e Leitor de Arquivos ativos.");
            this._aMapMarkers = [];

            // Tenta recuperar dados previamente salvos pelo usuário no LocalStorage
            var sDocumentosSalvos = localStorage.getItem("ferias1000_documentos");
            var sReservasSalvas = localStorage.getItem("ferias1000_reservas");
            var sPassagensSalvas = localStorage.getItem("ferias1000_passagens");

            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.setProperty("/documentos", sDocumentosSalvos ? JSON.parse(sDocumentosSalvos) : [
                    { tipo: "Passaporte Nacional", status: "Válido até 2031", arquivoNome: "", arquivoBase64: "" }
                ]);
                oModel.setProperty("/reservas", sReservasSalvas ? JSON.parse(sReservasSalvas) : [
                    { hotel: "Hospedagem Inicial", periodo: "A definir", arquivoNome: "", arquivoBase64: "" }
                ]);
                oModel.setProperty("/passagens", sPassagensSalvas ? JSON.parse(sPassagensSalvas) : [
                    { voo: "Voo de Ida", info: "A definir", arquivoNome: "", arquivoBase64: "" }
                ]);
                oModel.setProperty("/lugares", []);
            }

            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this._oRecognition = new SpeechRecognition();
                this._oRecognition.lang = 'pt-BR';
                this._oRecognition.interimResults = false;
                this._oRecognition.maxAlternatives = 1;
                this._oRecognition.onresult = this._onSpeechResult.bind(this);
            }
        },

        onAfterRendering: function () {
            this.initMap();
        },

        initMap: function () {
            var oMapDomRef = null;
            if (this.getView().byId("map")) { oMapDomRef = this.getView().byId("map").getDomRef(); }
            if (!oMapDomRef) { oMapDomRef = document.getElementById("map") || document.querySelector("[id*='--map']"); }

            if (oMapDomRef && !this._oMap) {
                this._oMap = L.map(oMapDomRef).setView([-14.2350, -51.9253], 4);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(this._oMap);
                
                setTimeout(function() { this._oMap.invalidateSize(); }.bind(this), 400);
            }
        },

        onTabSelect: function (oEvent) {
            var sSelectedKey = oEvent.getParameter("key");
            this.getView().byId("panelExplorar").setVisible(sSelectedKey === "explorar");
            this.getView().byId("panelDocumentos").setVisible(sSelectedKey === "documentos");
            this.getView().byId("panelReservas").setVisible(sSelectedKey === "reservas");
            this.getView().byId("panelPassagens").setVisible(sSelectedKey === "passagens");
            this.getView().byId("panelManual").setVisible(sSelectedKey === "manual");

            if (sSelectedKey === "explorar" && this._oMap) {
                setTimeout(function() { this._oMap.invalidateSize(); }.bind(this), 200);
            }
        },

        onFalarDestino: function () {
            if (this._oRecognition) {
                this._oRecognition.start();
                MessageToast.show("Ouvindo... Fale qualquer cidade!");
            }
        },

        _onSpeechResult: function (oEvent) {
            var sCidade = oEvent.results[0][0].transcript.trim();
            if (sCidade.endsWith('.')) { sCidade = sCidade.slice(0, -1); }

            var oModel = this.getView().getModel("view");
            if (oModel) {
                oModel.setProperty("/local/cidade", sCidade);
                this._buscarGeocodificacao(sCidade);
            }
        },

        _buscarGeocodificacao: function (sCidade) {
            var sUrl = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(sCidade) + "&limit=1";
            
            fetch(sUrl)
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data && data.length > 0) {
                        var lat = parseFloat(data[0].lat);
                        var lon = parseFloat(data[0].lon);

                        this._oMap.setView([lat, lon], 13);
                        this._limparMarcadores();

                        var oMainMarker = L.marker([lat, lon]).addTo(this._oMap)
                            .bindPopup("<b>" + sCidade + "</b><br>Destino Ativo.").openPopup();
                        this._aMapMarkers.push(oMainMarker);

                        this._buscarClimaReal(lat, lon);
                        this._buscarPontosTuristicosAPI(lat, lon);
                    } else {
                        MessageToast.show("Cidade não localizada.");
                    }
                }.bind(this));
        },

        _buscarClimaReal: function (lat, lon) {
            var sWeatherUrl = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current_weather=true";
            var oModel = this.getView().getModel("view");

            fetch(sWeatherUrl)
                .then(function (res) { return res.json(); })
                .then(function (weatherData) {
                    if (weatherData && weatherData.current_weather) {
                        oModel.setProperty("/clima/temp", weatherData.current_weather.temperature + " °C");
                    }
                }.bind(this));
        },

        _buscarPontosTuristicosAPI: function (lat, lon) {
            var oModel = this.getView().getModel("view");
            var sOverpassUrl = "https://overpass-api.de/api/interpreter?data=[out:json];node(around:8000," + lat + "," + lon + ")[tourism];out 15;";

            fetch(sOverpassUrl)
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    var aLugaresMapeados = [];

                    if (data && data.elements && data.elements.length > 0) {
                        data.elements.forEach(function (elemento) {
                            if (elemento.tags && elemento.tags.name) {
                                var sCategoria = elemento.tags.tourism || "Atração Cultural";
                                if (sCategoria === "attraction") { sCategoria = "Ponto Turístico"; }
                                else if (sCategoria === "museum") { sCategoria = "Museu Histórico"; }
                                else if (sCategoria === "viewpoint") { sCategoria = "Mirante / Vista"; }

                                aLugaresMapeados.push({
                                    nome: elemento.tags.name,
                                    lat: elemento.lat,
                                    lng: elemento.lon,
                                    desc: sCategoria.toUpperCase()
                                });
                            }
                        });
                    }

                    if (aLugaresMapeados.length < 7) {
                        var iFaltantes = 7 - aLugaresMapeados.length;
                        var nomesPadrao = ["Praça Central Histórica", "Monumento Histórico Local", "Igreja Matriz Antiga", "Mercado Municipal Regional", "Parque Ecológico", "Centro de Atendimento", "Mirante"];
                        for (var i = 0; i < iFaltantes; i++) {
                            aLugaresMapeados.push({
                                nome: nomesPadrao[i] || "Ponto de Interesse " + (i + 1),
                                lat: lat + (Math.sin(i) * 0.005),
                                lng: lon + (Math.cos(i) * 0.005),
                                desc: "ATRAÇÃO LOCAL"
                            });
                        }
                    }

                    var aSeteMelhores = aLugaresMapeados.slice(0, 7);
                    oModel.setProperty("/lugares", aSeteMelhores);

                    aSeteMelhores.forEach(function (ponto) {
                        var oPino = L.marker([ponto.lat, ponto.lng]).addTo(this._oMap)
                            .bindPopup("<b>" + ponto.nome + "</b><br>" + ponto.desc);
                        this._aMapMarkers.push(oPino);
                    }.bind(this));

                }.bind(this))
                .catch(function (err) {
                    var aFallback = [];
                    for (var i = 1; i <= 7; i++) {
                        aFallback.push({ nome: "Ponto Turístico Relevante " + i, lat: lat + (i * 0.002), lng: lon - (i * 0.002), desc: "PONTO HISTÓRICO" });
                    }
                    oModel.setProperty("/lugares", aFallback);
                }.bind(this));
        },

        _limparMarcadores: function () {
            this._aMapMarkers.forEach(function (m) { this._oMap.removeLayer(m); }.bind(this));
            this._aMapMarkers = [];
        },

        /**
         * CAPTURA E CONVERSÃO DO ARQUIVO PARA BASE64
         */
        onUploadArquivo: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var oFile = oEvent.getParameter("files")[0];
            var oBindingContext = oFileUploader.getBindingContext("view");

            if (!oFile) { return; }

            var oReader = new FileReader();
            oReader.onload = function (e) {
                var sBase64Result = e.target.result;
                // Salva a string Base64 diretamente no item correspondente do JSON Model
                oBindingContext.getModel().setProperty(oBindingContext.getPath() + "/arquivoBase64", sBase64Result);
                MessageToast.show("Arquivo processado e pronto para salvar!");
            };
            oReader.readAsDataURL(oFile);
        },

        /**
         * VISUALIZADOR DE DOCUMENTOS EM NOVA JANELA
         */
        onVisualizarArquivo: function (oEvent) {
            var oItem = oEvent.getSource().getBindingContext("view").getObject();
            var sDataUrl = oItem.arquivoBase64;

            if (sDataUrl) {
                var newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write("<title>" + (oItem.tipo || oItem.hotel || oItem.voo || "Documento") + "</title>");
                    if (sDataUrl.startsWith("data:application/pdf")) {
                        newWindow.document.write("<iframe width='100%' height='100%' style='border:none;' src='" + sDataUrl + "'></iframe>");
                    } else {
                        newWindow.document.write("<body style='margin:0; display:flex; justify-content:center; align-items:center; background:#333;'><img style='max-width:100%; max-height:100vh; object-fit:contain;' src='" + sDataUrl + "'/></body>");
                    }
                    newWindow.document.close();
                } else {
                    MessageToast.show("Permita os pop-ups para visualizar o arquivo.");
                }
            } else {
                MessageToast.show("Nenhum arquivo anexado ou carregado.");
            }
        },

        /**
         * BOTÃO SALVAR - Grava o estado atual no LocalStorage do navegador
         */
        onSalvarDados: function () {
            var oModel = this.getView().getModel("view");
            if (oModel) {
                localStorage.setItem("ferias1000_documentos", JSON.stringify(oModel.getProperty("/documentos")));
                localStorage.setItem("ferias1000_reservas", JSON.stringify(oModel.getProperty("/reservas")));
                localStorage.setItem("ferias1000_passagens", JSON.stringify(oModel.getProperty("/passagens")));
                MessageToast.show("Alterações e anexos salvos com sucesso no navegador!");
            }
        },

        /* GESTÃO DE LINHAS DAS TABELAS */
        onAdicionarDocumento: function () {
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/documentos") || [];
            aLista.push({ tipo: "", status: "", arquivoNome: "", arquivoBase64: "" });
            oModel.setProperty("/documentos", aLista);
        },

        onExcluirDocumento: function () {
            var oTable = this.getView().byId("tableDocumentos");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/documentos");
            for (var i = aSelectedItems.length - 1; i >= 0; i--) {
                var sPath = aSelectedItems[i].getBindingContextPath();
                var iIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1));
                aLista.splice(iIndex, 1);
            }
            oTable.removeSelections();
            oModel.setProperty("/documentos", aLista);
        },

        onAdicionarReserva: function () {
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/reservas") || [];
            aLista.push({ hotel: "", periodo: "", arquivoNome: "", arquivoBase64: "" });
            oModel.setProperty("/reservas", aLista);
        },

        onExcluirReserva: function () {
            var oTable = this.getView().byId("tableReservas");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/reservas");
            for (var i = aSelectedItems.length - 1; i >= 0; i--) {
                var sPath = aSelectedItems[i].getBindingContextPath();
                var iIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1));
                aLista.splice(iIndex, 1);
            }
            oTable.removeSelections();
            oModel.setProperty("/reservas", aLista);
        },

        onAdicionarPassagem: function () {
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/passagens") || [];
            aLista.push({ voo: "", info: "", arquivoNome: "", arquivoBase64: "" });
            oModel.setProperty("/passagens", aLista);
        },

        onExcluirPassagem: function () {
            var oTable = this.getView().byId("tablePassagens");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("view");
            var aLista = oModel.getProperty("/passagens");
            for (var i = aSelectedItems.length - 1; i >= 0; i--) {
                var sPath = aSelectedItems[i].getBindingContextPath();
                var iIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1));
                aLista.splice(iIndex, 1);
            }
            oTable.removeSelections();
            oModel.setProperty("/passagens", aLista);
        }
    });
});
