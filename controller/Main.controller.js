onIniciarComandoVoz: function () {
            var oView = this.getView();
            var oModel = oView.getModel("view");
            var that = this;

            // VERIFICAÇÃO CORRIGIDA: SpeechRecognition (com "ch")
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                MessageToast.show("Reconhecimento de voz não suportado neste navegador.");
                return;
            }

            var recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = function () {
                MessageToast.show("Microfone ativado! Fale a cidade de destino...");
            };

            recognition.onerror = function (event) {
                MessageToast.show("Erro no microfone: " + event.error);
            };

            recognition.onresult = function (event) {
                var sResult = event.results[0][0].transcript;
                sResult = sResult.replace(/\.$/, ""); 
                
                MessageToast.show("Buscando: " + sResult);
                
                that._buscarCidadeAPI(sResult);
            };

            recognition.start();
        },
