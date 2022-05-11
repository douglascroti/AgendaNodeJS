/* BIBLIOTECAS IMPORTADAS */
const express = require("express");
const session = require('express-session');
const md5 = require('md5');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const xml_convert = require('xml-js');
/* BIBLIOTECAS IMPORTADAS */


/* INICIALIZAÇÃO DAS VARIAVEIS - CONSTANTES */
const app = express();
/* INICIALIZAÇÃO DAS VARIAVEIS - CONSTANTES */

/* IMPORTAÇÃO DAS CLASSES DO PROJETO */
const conexao = require("./conexao");
const contato = require("./contato");
const usuario = require("./usuario");
/* IMPORTAÇÃO DAS CLASSES DO PROJETO */


/* CONFIGURAÇÃO DE INICIALIZAÇÃO DO 'EJS' */
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

/* CONFIGURAÇÃO DE INICIALIZAÇÃO DA SESSÃO */
app.use(session({secret: 'agendaNodeJs', resave: false, saveUninitialized: false, maxAge: 3600000}));

/* CONFIGURAÇÃO DE INICIALIZAÇÃO - LEITURA DOS PARAMETROS ENVIADOS DO FORMULARIO */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

/* CONFIGURAÇÃO DE INICIALIZAÇÃO - LEITURA DE JSON */
app.use(express.json());

/* CONFIGURAÇÃO DE INICIALIZAÇÃO - PASTAS PADRÃO DA APLICAÇÃO */
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/static'));


/* CONFIGURAÇÃO DE INICIALIZAÇÃO - CAPTURA DO FILE ENVIADO VIA POST E ALTERAÇÃO DO NOME DO ARQUIVO */
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'static/imagens/')
    },
    filename: function (req, file, cb) {
        const extensaoArquivo = file.originalname.split('.')[1];        
        const novoNomeArquivo = 'avatar_'+require('crypto')
            .randomBytes(16)
            .toString('hex');
        cb(null, `${novoNomeArquivo}.${extensaoArquivo}`)
    }
});
const upload = multer({ storage });

/* ------------------ */
/* ROTAS DA APLICAÇÃO */
/* ------------------ */

app.get("/", (request, response) => {
	if (request.session.logado)
	{
		response.redirect('/principal');
	} else {
		response.render('login', {'message':'', 'session':request.session});
	}
});

app.post("/", async (request, response) => {	
	let erro = false;
	let message = false;

	const body = request.body;
	if (body['form-name'] == 'login')
	{
		let dados = {'login':body['login'], 'senha':md5(body['senha'])}
		retornoLogin = await usuario.login(dados);

		if (!retornoLogin['erro'])
		{
			/* não encontrou erro, segue para a tela inicial */
			request.session.logado = true;
			request.session.codigo = retornoLogin['data']['codigo'];
			request.session.usuario = retornoLogin['data']['login'];
			request.session.pesquisa_contato = '';
			request.session.message_tela = retornoLogin['message'];

			response.redirect('/principal');
		} else {
			/* encontrou erro, apresenta o erro e permanece na tela de login */
			request.session.message_tela = retornoLogin['message'];
			response.render('login', {'error':true, 'message':retornoLogin['message'], 'session':request.session});
		}
	} else {
		request.session.message_tela = 'Formulario não mapeado';
		response.render('login', {'error':true, 'message':'Formulario não mapeado', 'session': request.session});
	}
});

app.get("/principal", async (request, response) => {
	if (request.session.logado)
	{
		param = request.query;
		if (param)
		{
			retornoContatos = await contato.lista_todos_contatos('', param['parametro']);
			request.session.pesquisa_contato = param['parametro'];
		} else {
			retornoContatos = await contato.lista_todos_contatos('', '');
			request.session.pesquisa_contato = '';
		}
			
		response.render('principal', {'message':'', 'session':request.session, 'contatos':retornoContatos});	
	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.post("/principal/detalhe", async (request, response) => {
	if (request.session.logado)
	{
		const body = request.body;
		retornoContatos = await contato.lista_todos_contatos(body['codigo'], '');

		response.json(retornoContatos);
	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.get("/contato", async (request, response) => {
	if (request.session.logado)
	{
		retornoContatos = [];
		param = request.query;
		if (param['codigo'])
		{
			retornoContatos = await contato.lista_todos_contatos(param['codigo'], '');
		}			
		response.render('contato', {'message':'', 'session':request.session, 'contato':retornoContatos});	
	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.post("/contato/salvar", upload.single('avatar'), async (request, response) => {
	if (request.session.logado)
	{
		const body = request.body;

		let tem_novo_avatar = false;
		let novo_avatar = '';
		if (request.file) {
			tem_novo_avatar = true;
			novo_avatar = request.file['filename'];
			body['nome_img'] = novo_avatar;
			body['dir_img'] = '/imagens/';
		}

		let tem_antigo_avatar = false;
		let avatar_delete = '';
		if (body['diretorio_atual_avatar'] !== '') {
			tem_antigo_avatar = true;
			avatar_delete = body['diretorio_atual_avatar'];
		}

		// limpo o body para encaminhar os dados para insert/update
		delete body['diretorio_atual_avatar'];
		delete body['form-name'];

		let retorno;

		if (body['codigo'] !== '')
		{
			// tem código então é update
			retorno = await contato.altera_contato(body);

			// se update OK, se existe avatar novo + avatar antigo, deleto o antigo
			if (!retorno['error'])
			{
				if (tem_novo_avatar && tem_antigo_avatar)
				{
					fs.unlink(__dirname+'\\static'+avatar_delete, function (err) {
						if (err) {
							console.error(err);
						}
					});
				}
			}
		} else {
			// não tem código é insert
			delete body['codigo'];
			retorno = await contato.cadastra_contato(body);
		}

		request.session.message_tela = retorno['message'];
		response.redirect('/principal');
	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.get("/contato/remover", async (request, response) => {
	if (request.session.logado)
	{
		const body = request.query;
		retorno = await contato.remover_contato(body['codigo']);

		request.session.message_tela = retorno['message'];
		response.redirect('/principal');

	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.post("/contato/api_json", async (request, response) => {
	if (request.session.logado)
	{
		let erro = false;
		let message = '';
		let retorno = [];

		const body = request.body;
		let retUrl = await contato.do_request('https://viacep.com.br/ws/'+body['cep']+'/json/');
		response.json({'erro': erro, 'message': message, 'data': retUrl});
	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.post("/contato/api_xml", async (request, response) => {
	if (request.session.logado)
	{
		let erro = false;
		let message = '';
		let retorno = {};

		const body = request.body;
		let retUrl = await contato.do_request('https://viacep.com.br/ws/'+body['cep']+'/xml/');

		if (retUrl)
		{
			let xml_json = await xml_convert.xml2js(retUrl, {compact: true, spaces: 4});

			Object.keys(xml_json.xmlcep).forEach(key => {
				retorno[key] = xml_json.xmlcep[key]._text;
			});
		}	

		response.json({'erro': erro, 'message': message, 'data': retorno});
	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.post("/usuario/alteraSenha", async (request, response) => {
	if (request.session.logado)
	{
		let retorno = {};

		const body = request.body;
		let senha = md5(body['senha']);
		let usuario = request.session.codigo;		

		retorno = await alterar_senha_usuario(usuario, senha);
		response.json(retorno);

	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.get("/usuario/admin", async (request, response) => {
	if (request.session.logado)
	{
		retornoUsuarios = [];
		retornoUsuarios = await usuario.lista_todos_usuarios();
			
		response.render('usuario_admin', {'message':'', 'session':request.session, 'usuarios':retornoUsuarios});	
	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.post("/usuario/admin/salvar", async (request, response) => {
	if (request.session.logado)
	{
		const body = request.body;

		if (body['form-name'] === 'cadastro_usuario_admin')
		{
			delete body['form-name'];
			let retorno;
			body['senha'] = md5(body['senha']);

			if (body['codigo'] !== '')
			{
				// tem código então é update

				retorno = await usuario.altera_acesso(body);
			} else {
				// não tem código é insert
				delete body['codigo'];
				retorno = await usuario.cadastra_acesso(body);
			}

			request.session.message_tela = retorno['message'];
			response.redirect('/usuario/admin');
		} else {
			request.session.message_tela = 'Formulario não mapeado';
			response.redirect('/usuario/admin');
		}
	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.get("/usuario/admin/remover", async (request, response) => {
	if (request.session.logado)
	{
		const body = request.query;

		if (request.session.codigo != body['codigo'])
		{
			retorno = await usuario.remover_acesso(body['codigo']);
			request.session.message_tela = retorno['message'];
		} else {
			request.session.message_tela = 'Você não pode deletar o seu proprio Usuário';
		}

		response.redirect('/usuario/admin');

	} else {
		request.session.message_tela = 'Usuário não autenticado';
		response.redirect('/');
	}
});

app.get("/usuario", async (request, response) => {
	if (!request.session)
	{
		response.render('usuario', {});
	} else {
		if (request.session.logado)
		{
			response.redirect('/usuario/admin');
		} else {
			response.render('usuario', {'message':'', 'session':{}});	
		}	
	}	
});

app.post("/usuario/salvar", async (request, response) => {

	const body = request.body;

	if (body['form-name'] === 'cadastro_usuario')
	{
		delete body['form-name'];
		let retorno;

		if (body['senha'] !== body['senha_confirma'])
		{
			request.session.message_tela = 'As senhas não conferem, verifique';
		} else {
			delete body['senha_confirma'];

			body['senha'] = md5(body['senha']);
			retorno = await usuario.cadastra_acesso(body);
			request.session.message_tela = retorno['message'];
		}
	} else {
		request.session.message_tela = 'Formulario não mapeado';
	}
	response.redirect('/');
});

app.get("/logout", (request, response) => {
	if (request.session) {
	  request.session.destroy();
	}
	response.redirect('/');
});

/* ------------------ */
/* ROTAS DA APLICAÇÃO */
/* ------------------ */

app.listen(9000, () => console.log('Servidor online http://127.0.0.1:9000'));