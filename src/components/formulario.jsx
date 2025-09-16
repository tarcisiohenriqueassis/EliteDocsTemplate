

import React, { useState, useEffect } from 'react';
import { IMaskInput } from 'react-imask';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import brasao from '../assets/brasao.png';
import styles from './formulario.module.css';

export default function Formulario() {

  const [todosMarcados, setTodosMarcados] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: '', cpf: '', rg: '', cep: '', cidade: '', bairro: '', rua: '', numero: '',
    complemento: '', telefone: '', estadoCivil: '', sexo: '', profissao: '', pretensao: '', fatos: '', anotacoes: '',
    acao: '', retorno: '', assinatura: '',
    dataNascimento: '',
    dataAtendimento: '',
    uf: '',
    dataExtenso: '',
    docRgCpf: '',
    docComprovatorios: '',
    docComprovResidencia: '',
    fichaAtendimento: '',
    gerarFichaAtendimento: false,
    gerarProcuracao: false,
    gerarContrato30: false,
    gerarContratoEntrada: false,
    gerarContratoPlanejamento: false,
    gerarContratoRMI: false,
    gerarProcuracaoInssEfigenia: false,
    gerarProcuracaoInssMarta: false,
    gerarRecibo: false,
    gerarTermoOabInss: false,
    gerarDeclaracaoInss: false,
    gerarRequerimento: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validarCPF = (cpf) => (cpf || '').replace(/\D/g, '').length === 11;
  const validarCEP = (cep) => cep.replace(/\D/g, '').length === 8;
  const validarTelefone = (tel) => tel.replace(/\D/g, '').length >= 10;

  // CEP auto-preencher
  useEffect(() => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              cidade: data.localidade || '',
              bairro: data.bairro || '',
              rua: data.logradouro || '',
            }));
            setErrors(prev => ({ ...prev, cep: null }));
          }
        })
        .catch(() => setErrors(prev => ({ ...prev, cep: 'Erro ao consultar CEP' })));
    }
  }, [formData.cep]);

  // Datas automáticas
 // Datas automáticas
useEffect(() => {
  const meses = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro'
  ];

  const hoje = new Date();

  // data por extenso
  const extenso = `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;

  

  // atualiza o formData para mandar ao main.js
  setFormData(prev => ({
    ...prev,
    dataAtendimento: hoje.toISOString().split('T')[0], // formato ISO: 2025-09-15
    dataExtenso: extenso
  }));
}, []);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleIMaskChange = (name) => (value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelecionarTodos = () => {
  const novoValor = !todosMarcados;
  setTodosMarcados(novoValor);

  // Atualiza todos os checkboxes de geração de documentos
  setFormData(prev => ({
    ...prev,
    gerarFichaAtendimento: novoValor,
    gerarProcuracao: novoValor,
    gerarProcuracaoInssEfigenia: novoValor,
    gerarProcuracaoInssMarta: novoValor,
    gerarContratoEntrada: novoValor,
    gerarContratoPlanejamento: novoValor,
    gerarContrato30: novoValor,
    gerarContratoRMI: novoValor,
    gerarTermoOabInss: novoValor,
    gerarDeclaracaoInss: novoValor,
    gerarRequerimento: novoValor,
    gerarRecibo: novoValor,
  }));
};

const todosSelecionados = () => {
  return formData.gerarFichaAtendimento &&
    formData.gerarProcuracao &&
    formData.gerarProcuracaoInssEfigenia &&
    formData.gerarProcuracaoInssMarta &&
    formData.gerarContratoEntrada &&
    formData.gerarContratoPlanejamento &&
    formData.gerarContrato30 &&
    formData.gerarContratoRMI &&
    formData.gerarTermoOabInss &&
    formData.gerarDeclaracaoInss &&
    formData.gerarRequerimento &&
    formData.gerarRecibo;
};

  const validarFormulario = () => {
    const novosErros = {};
    if (!formData.nomeCompleto.trim()) novosErros.nomeCompleto = 'Nome obrigatório';
    if (!validarCPF(formData.cpf)) novosErros.cpf = 'CPF inválido';
    if (!validarCEP(formData.cep)) novosErros.cep = 'CEP inválido';
    if (!validarTelefone(formData.telefone)) novosErros.telefone = 'Telefone inválido';
    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const peloMenosUmMarcado = () =>
    formData.gerarFichaAtendimento || formData.gerarProcuracao || formData.gerarProcuracaoInssEfigenia ||
    formData.gerarProcuracaoInssMarta || formData.gerarContratoEntrada || formData.gerarContratoPlanejamento ||
    formData.gerarContrato30 || formData.gerarContratoRMI || formData.gerarTermoOabInss ||
    formData.gerarDeclaracaoInss || formData.gerarRequerimento || formData.gerarRecibo;

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!peloMenosUmMarcado()) {
    toast.error("Selecione pelo menos um tipo de documento para gerar.");
    return;
  }
  if (!validarFormulario()) {
    toast.error("Por favor, corrija os erros no formulário.");
    return;
  }

  setLoading(true);
  try {
    const documentosSelecionados = [];

    if (formData.gerarFichaAtendimento)
      documentosSelecionados.push({ nomeArquivo: 'Ficha_Atendimento', templateRelativePath: 'ficha-modelo.docx' });
    if (formData.gerarProcuracao)
      documentosSelecionados.push({ nomeArquivo: 'Procuração', templateRelativePath: 'procuracao-modelo.docx' });
    if (formData.gerarProcuracaoInssEfigenia)
      documentosSelecionados.push({ nomeArquivo: 'Procuração_INSS_Efigenia_Camilo', templateRelativePath: 'procuracao_inss/PROCURACAO_INSS_EFIGENIA.docx' });
    if (formData.gerarProcuracaoInssMarta)
      documentosSelecionados.push({ nomeArquivo: 'Procuração_INSS_Marta_Silva', templateRelativePath: 'procuracao_inss/PROCURACAO_INSS_MARTA_SILVA.docx' });
    if(formData.gerarContratoEntrada)
      documentosSelecionados.push({ nomeArquivo: 'Contrato_Entrada_INSS', templateRelativePath: 'contrato_inss/CONTRATO_INSS_JUDICIAL_Entrada_modelo.docx' });
    if(formData.gerarContratoPlanejamento)
      documentosSelecionados.push({ nomeArquivo: 'Contrato_Planejamento_INSS', templateRelativePath: 'contrato_inss/CONTRATO_INSS_JUDICIAL_Planejamento_modelo.docx' });
    if(formData.gerarContrato30)
      documentosSelecionados.push({ nomeArquivo: 'Contrato_30%_INSS', templateRelativePath: 'contrato_inss/CONTRATO_INSS_JUDICIAL_30_modelo.docx' });
    if(formData.gerarContratoRMI)
      documentosSelecionados.push({ nomeArquivo: 'Contrato_RMI_INSS', templateRelativePath: 'contrato_inss/CONTRATO_INSS_JUDICIAL_RMIs_modelo.docx' });
    if(formData.gerarTermoOabInss)
      documentosSelecionados.push({ nomeArquivo: 'Termo_OAB_INSS', templateRelativePath: 'termo_oab_inss/TERMO_OAB_INSS.docx' });
    if(formData.gerarDeclaracaoInss)
      documentosSelecionados.push({ nomeArquivo: 'Declaração_INSS', templateRelativePath: 'declaracao_inss/DECLARACAO_INSS.docx' });
    if(formData.gerarRequerimento)
      documentosSelecionados.push({ nomeArquivo: 'Requerimento', templateRelativePath: 'requerimento_inss/REQUERIMENTO_INSS_TEMPLATE.docx' });
    if(formData.gerarRecibo)
      documentosSelecionados.push({ nomeArquivo: 'Recibo', templateRelativePath: 'recibo/RECIBO.docx' });

    const resultado = await window.electronAPI.gerarDocs(documentosSelecionados, formData);

    if (resultado.sucesso) {
      toast.success("Documentos gerados com sucesso!");
    } else if (resultado.cancelado) {
      toast.info("Operação cancelada pelo usuário.");
    } else if (resultado.erro) {
      toast.error("Erro: " + resultado.erro);
    }

  } catch (err) {
    console.error(err);
    toast.error("Erro ao gerar documentos.");
  } finally {
    setLoading(false);
  }
};

  return (

    <div className={styles.container}> 
      <div className={styles.logoContainer}>
        <img src={brasao} alt='brasão' className={styles.brasao} />
      </div>
      <ToastContainer position="top-center" autoClose={1000} />

      <form className={styles.form} onSubmit={handleSubmit}>
       <div className={styles.row}>
          <label className={styles.inputGroup}>
            Nome Completo:
            <input
              name="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={handleChange}
              required
              className={styles.input}
            />
            {errors.nomeCompleto && <span className={styles.error}>{errors.nomeCompleto}</span>}
          </label>

          <label className={styles.inputGroup}>
            CPF:
            <IMaskInput
              mask="000.000.000-00" placeholder='000.000.000-00'
              name="cpf"
              value={formData.cpf}
              onAccept={handleIMaskChange('cpf')}
              overwrite
              className={styles.input}
              required
            />
            {errors.cpf && <span className={styles.error}>{errors.cpf}</span>}
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.inputGroup}>
            RG:
            <input name="rg" placeholder='MG 12.345.678 PC'  required value={formData.rg} onChange={handleChange} className={styles.input} />
          </label>

          <label className={styles.inputGroup}>
            CEP:
            <IMaskInput
              mask="00000-000"
              name="cep"
              value={formData.cep}
              onAccept={handleIMaskChange('cep')}
              overwrite
              className={styles.input}
              placeholder="12345-678"
              required
              maxLength={10}
            />
            {errors.cep && <span className={styles.error}>{errors.cep}</span>}
          </label>

          <label className={styles.inputGroup}>
            Rua:
            <input name="rua" placeholder='Avenida Getúlio Vargas' required value={formData.rua} onChange={handleChange} className={styles.input} />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.inputGroup}>
            Número:
            <input name="numero" placeholder='123' required value={formData.numero} onChange={handleChange} className={styles.input} />
          </label>

           <label className={styles.inputGroup}>
          Complemento:
         <input name="complemento" placeholder='Casa / Apartamento' required value={formData.complemento} onChange={handleChange} className={styles.input} />
          </label>

        </div>

        <div className={styles.row}>

          <label className={styles.inputGroup}>
            Bairro:
            <input name="bairro"  required value={formData.bairro} onChange={handleChange} className={styles.input} />
          </label>

          <label className={styles.inputGroup}>
            Cidade:
            <input name="cidade" required value={formData.cidade} onChange={handleChange} className={styles.input} />
          </label>
        
          <label className={styles.inputGroup}>
            Telefone:
            <IMaskInput
              mask="(00) 00000-0000"
              name="telefone"
              value={formData.telefone}
              onAccept={(value) => {
                handleIMaskChange('telefone')(value);
                validarTelefoneTempoReal(value);
              }}
              overwrite
              className={styles.input}
              required
              placeholder='(00) 00000-0000'
            />
            {errors.telefone && <span className={styles.error}>{errors.telefone}</span>}
          </label>

          <label className={styles.inputGroup}>
            Estado Civil:
            <input name="estadoCivil" placeholder='Solteiro(a) / Casado(a) / Divorciado(a)' required value={formData.estadoCivil} onChange={handleChange} className={styles.input} />
          </label>

          <label className={styles.inputGroup}>
            Profissão:
            <input name="profissao" placeholder='Sua profissão' required value={formData.profissao} onChange={handleChange} className={styles.input} />
          </label>

          <label className={styles.inputGroup}>
            Objeto / Pretensão:
            <input name="pretensao" placeholder='Descreva o objeto ou pretensão' value={formData.pretensao} onChange={handleChange} className={styles.input} />
          </label>

           <label className={styles.inputGroup}>
            Ação:
            <input name="acao" placeholder='Descreva a ação' value={formData.acao} onChange={handleChange} className={styles.input} />
          </label>

        </div>

        <label className={styles.textareaGroup}>
          Fatos:
          <textarea
            name="fatos"
            value={formData.fatos}
            onChange={handleChange}
            rows={4}
            placeholder='Descreva os fatos relevantes'
            className={styles.textarea}
          />
        </label>

        <label className={styles.textareaGroup}>
          Anotações:
          <textarea
            name="anotacoes"
            value={formData.anotacoes}
            onChange={handleChange}
            rows={4}
            placeholder='Anotações adicionais'
            className={styles.textarea}
          />
        </label>

        <div className={styles.row}>
         
          <label className={styles.inputGroup}>
            Retorno:
            <input
              name="retorno"
              type='date'
              value={formData.retorno}
              onChange={handleChange}
              className={styles.input}
            />
          </label>
        </div>

        
        <label className={styles.checkboxGroup}>
          <input
            type="checkbox"
            onChange={handleSelecionarTodos}
            checked={todosSelecionados()}
          />

          <strong className={styles.checkboxGroup}>{todosMarcados ? "Demarcar todos" : "Selecionar todos"}</strong>
        </label>

        {/* Checkboxes individuais */}

        <label className={styles.checkboxGroup}>
          <input
            type="checkbox"
            name="gerarFichaAtendimento"
            checked={formData.gerarFichaAtendimento}
            onChange={handleChange}
          />
          FICHA DE ATENDIMENTO
        </label>

        <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarProcuracao" checked={formData.gerarProcuracao} onChange={handleChange} />
          PROCURAÇÃO
        </label>

        <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarProcuracaoInssEfigenia" checked={formData.gerarProcuracaoInssEfigenia} onChange={handleChange} />
          PROCURAÇÃO INSS - Efigenia Camilo
        </label>

        <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarProcuracaoInssMarta" checked={formData.gerarProcuracaoInssMarta} onChange={handleChange} />
           PROCURAÇÃO INSS - Marta Silva
        </label>

        <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarContratoEntrada" checked={formData.gerarContratoEntrada} onChange={handleChange} />
          CONTRATO INSS JUDICIAL - Entrada
        </label>

        <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarContratoPlanejamento" checked={formData.gerarContratoPlanejamento} onChange={handleChange} />
          CONTRATO INSS JUDICIAL - Planejamento
        </label>

        <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarContrato30" checked={formData.gerarContrato30} onChange={handleChange} />
          CONTRATO INSS JUDICIAL 30%
        </label>

        <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarContratoRMI" checked={formData.gerarContratoRMI} onChange={handleChange} />
          CONTRATO INSS JUDICIAL - RMI´s
        </label>

         <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarTermoOabInss" checked={formData.gerarTermoOabInss} onChange={handleChange} />
          TERMO OAB INSS
        </label>

        <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarDeclaracaoInss" checked={!!formData.gerarDeclaracaoInss} onChange={handleChange} />
          DECLARAÇÃO INSS
        </label>

        <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarRequerimento" checked={!!formData.gerarRequerimento} onChange={handleChange} />
          REQUERIMENTO
        </label>

        <label className={styles.checkboxGroup}>
          <input type="checkbox" name="gerarRecibo" checked={!!formData.gerarRecibo} onChange={handleChange} />
          RECIBO
        </label>
       

      <button
          type="submit"
          disabled={loading || !peloMenosUmMarcado()}
          className={styles.submitButton}
        >
          {loading ? 'Gerando...' : 'Salvar'}
      </button>

  </form>

<div className={styles.direitosReservados}>
  © 2025 Elite Support TI. Todos os direitos reservados.
</div>
</div>
  );
}

