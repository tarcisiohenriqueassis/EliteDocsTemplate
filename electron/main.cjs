const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const JSZip = require("jszip");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173"); // Dev
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    win.loadFile(indexPath); // Produção
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/**
 * Função recursiva para localizar templates em subpastas
 */
function localizarTemplateRecursivo(baseDir, relativePath) {
  const caminhoInicial = path.join(baseDir, relativePath);
  if (fs.existsSync(caminhoInicial)) return caminhoInicial;

  const subdirs = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => path.join(baseDir, dirent.name));

  for (const subdir of subdirs) {
    const resultado = localizarTemplateRecursivo(subdir, relativePath);
    if (resultado) return resultado;
  }

  return null; // não encontrou
}

function getDataExtenso() {
  const meses = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro'
  ];
  const hoje = new Date();
  return `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
}

/**
 * Handler para gerar documentos
 */
ipcMain.handle("gerar-docs", async (event, documentos, formData) => {
  try {
    const arquivosGerados = [];

    function formataDataBR(data) {
      if (!data) return "";
      const d = new Date(data);
      if (isNaN(d)) return "";
      return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    }

    for (const docInfo of documentos) {
      const { nomeArquivo, templateRelativePath } = docInfo;

      // Base de templates no dev e build
      const baseTemplates = app.isPackaged
        ? path.join(process.resourcesPath, "templates", "modelos")
        : path.join(__dirname, "..", "templates", "modelos");

      const templatePath = localizarTemplateRecursivo(baseTemplates, templateRelativePath);

      console.log("Tentando abrir template:", templatePath || templateRelativePath);
      if (!templatePath) {
        console.error("Template não encontrado:", templateRelativePath);
        continue;
      }

      const content = fs.readFileSync(templatePath);
      const doc = new Docxtemplater(new PizZip(content), {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{{", end: "}}" } // reconhece {{PLACEHOLDER}}
      });

      const enderecoCompleto = `${formData.rua || ""}${formData.numero ? ", " + formData.numero : ""}${formData.complemento ? " - " + formData.complemento : ""}, ${formData.bairro || ""}, ${formData.cidade || ""}, ${formData.cep || ""}`;

      doc.setData({
        NOME: formData.nomeCompleto?.toUpperCase() || "",
        DATA_ATENDIMENTO: formataDataBR(formData.dataAtendimento) || "",
        RUA: formData.rua || "",
        NUMERO: formData.numero || "",
        BAIRRO: formData.bairro || "",
        CIDADE: formData.cidade || "",
        CEP: formData.cep || "",
        TELEFONE: formData.telefone || "",
        RG: formData.rg || "",
        CPF: formData.cpf || "",
        ESTADO_CIVIL: formData.estadoCivil || "",
        SEXO: formData.sexo || "",
        UF: formData.uf || "",
        DATA_NASC: formataDataBR(formData.dataNascimento) || "",
        PROFISSAO: formData.profissao || "",
        PRETENSAO: formData.pretensao || "",
        FATOS: formData.fatos || "",
        DOC_RG_CPF: formData.docRgCpf || "",
        DOC_COMPROVATORIOS: formData.docComprovatorios || "",
        DOC_COMPROV_RESIDENCIA: formData.docComprovResidencia || "",
        ACAO: formData.acao || "",
        RETORNO: formData.retorno ? formataDataBR(formData.retorno) : "",
        ENDERECO_COMPLETO: enderecoCompleto,
        DATA_EXTENSO: getDataExtenso(), 
      });

      doc.render();
      const buffer = doc.getZip().generate({ type: "nodebuffer" });
      arquivosGerados.push({ buffer, nome: `${nomeArquivo}.docx` });
    }

    if (arquivosGerados.length === 0) return { erro: "Nenhum documento gerado" };

    const zip = new JSZip();
    arquivosGerados.forEach((a) => zip.file(a.nome, a.buffer));
    const conteudoZip = await zip.generateAsync({ type: "nodebuffer" });

    const { filePath } = await dialog.showSaveDialog({
      title: "Salvar documentos",
      defaultPath: "documentos.zip",
      filters: [{ name: "ZIP", extensions: ["zip"] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, conteudoZip);
      return { sucesso: true, path: filePath };
    } else {
      return { cancelado: true };
    }
  } catch (err) {
    console.error(err);
    return { erro: err.message };
  }
});
