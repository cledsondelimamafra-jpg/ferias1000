onInit: function () {
            // Cria e injeta o JSONModel dinamicamente no escopo da View
            var oModel = new JSONModel({
                local: { cidade: "Aguardando destino...", coordenadas: "--, --" },
                clima: { temp: "--" },
                lugares: [],
                documentos: [],
                reservas: [],
                passagens: []
            });
            this.getView().setModel(oModel, "view");

            // Restaura dados do localStorage de forma segura
            try {
                oModel.setProperty("/documentos", JSON.parse(localStorage.getItem("ferias1000_documentos")) || []);
                oModel.setProperty("/reservas", JSON.parse(localStorage.getItem("ferias1000_reservas")) || []);
                oModel.setProperty("/passagens", JSON.parse(localStorage.getItem("ferias1000_passagens")) || []);
            } catch (e) {
                console.error("Erro ao ler localStorage", e);
            }

            this._sCurrentFileBase64 = "";
            this._oMapaInstance = null;
            this._oMarcadorInstance = null;
        },

        // Cledson, esse método roda automaticamente assim que a tela estiver 100% pronta e visível!
        onAfterRendering: function () {
            // Inicializa o mapa Leaflet com segurança
            this._inicializarMapaLeaflet();
        },

        _inicializarMapaLeaflet: function () {
