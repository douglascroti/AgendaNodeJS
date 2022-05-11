const conexao = require("./conexao");
const url_request = require("request");

async function lista_todos_contatos(codigo='', pesquisa = '')
{
	console.log('CONTATO.lista_todos_usuarios()');
	return await conexao.selectContato(codigo, pesquisa);
}

async function cadastra_contato(dados)
{
	console.log('CONTATO.cadastra_contato()');
	let str_cabecalho = 'insert into contato';
	let str_titulo = '';
	let str_dados = '';
	let str_param = [];

	Object.keys(dados).forEach(key => {
		str_titulo += ((str_titulo !== '') ? ','+key : key);
		str_dados += ((str_dados !== '') ? ',?' : '?');
		str_param.push(dados[key]);
	});

	let sql = str_cabecalho+' ('+str_titulo+') values ('+str_dados+')';
	return await conexao.insertContato(sql, str_param);
}

async function altera_contato(dados)
{
	console.log('CONTATO.altera_contato()');
	let str_cabecalho = 'update contato set ';
	let str_dados = '';
	let str_param = [];

	Object.keys(dados).forEach(key => {
		str_dados += ((str_dados !== '') ? ','+key+'= ? ' : key+'= ? ' );
		str_param.push(dados[key]);
	});

	let sql = str_cabecalho+''+str_dados+' where codigo = ? ';
	str_param.push(dados['codigo']);

	return await conexao.updateContato(sql, str_param);
}

async function remover_contato(codigo)
{
	console.log('CONTATO.remover_contato()');
	return await conexao.deleteContato(codigo);
}

async function do_request(url) 
{
	console.log('CONTATO.do_request()');
	return new Promise(function (resolve, reject) {
		url_request.get(url, function (error, res, body) {
			if (!error && res.statusCode == 200) {
				resolve(body);
			} else {
				reject(error);
			}
		});
	});
}

module.exports = {lista_todos_contatos, cadastra_contato, altera_contato, remover_contato, do_request}