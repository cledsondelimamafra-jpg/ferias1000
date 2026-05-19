// Dentro do seu controller...

onSalvarDocumentos: function () {
    this._persistirDados("ferias1000_documentos", "/documentos");
},

onSalvarReservas: function () {
    this._persistirDados("ferias1000_reservas", "/reservas");
},

onSalvarPassagens: function () {
    this._persistirDados("ferias1000_passagens", "/passagens");
},

// Função centralizada para evitar erros de escrita
_persistirDados: function (sKey, sPath) {
    var oModel = this.getView().getModel("view");
    if (!oModel) {
        sap.m.MessageToast.show("Erro: Modelo não encontrado.");
        return;
    }

    // 1. Força a sincronização do que foi digitado na interface com o modelo JSON
    oModel.updateBindings(true);

    // 2. Extrai os dados atuais daquele caminho específico
    var aDados = oModel.getProperty(sPath) || [];

    // 3. Persiste no LocalStorage
    localStorage.setItem(sKey, JSON.stringify(aDados));
    
    sap.m.MessageToast.show("Dados de " + sPath.replace("/", "") + " salvos com sucesso!");
    console.log("Persistido em " + sKey + ":", aDados);
}
