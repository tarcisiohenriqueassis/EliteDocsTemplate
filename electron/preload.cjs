const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  gerarDocs: (documentos, formData) => ipcRenderer.invoke("gerar-docs", documentos, formData)
});
