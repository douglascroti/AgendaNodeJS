const conexao = require("./conexao");

async function login(dados)
{
	console.log('USUARIO.login()');
	sql = 'select * from acesso where login = ? and senha = ?';
	return await conexao.selectDados(sql, dados);
}

async function lista_todos_usuarios()
{
	console.log('USUARIO.lista_todos_usuarios()');
	return await conexao.selectUsuarios();
}

async function alterar_senha_usuario(usuario, senha)
{
	console.log('USUARIO.alterar_senha_usuario()');
	let sql = 'update acesso set senha = ? where codigo = ?';
	let param = [senha, usuario];
	return await conexao.updateSenhaAcesso(sql, param);
}

async function cadastra_acesso(dados)
{
	console.log('USUARIO.cadastra_acesso()');
	let str_cabecalho = 'insert into acesso';
	let str_titulo = '';
	let str_dados = '';
	let str_param = [];

	Object.keys(dados).forEach(key => {
		str_titulo += ((str_titulo !== '') ? ','+key : key);
		str_dados += ((str_dados !== '') ? ',?' : '?');
		str_param.push(dados[key]);
	});
	let sql = str_cabecalho+' ('+str_titulo+') values ('+str_dados+')';

	return await conexao.insertAcesso(sql, str_param);
}

async function altera_acesso(dados)
{
	console.log('USUARIO.altera_acesso()');
	let str_cabecalho = 'update acesso set ';
	let str_dados = '';
	let str_param = [];

	Object.keys(dados).forEach(key => {
		str_dados += ((str_dados !== '') ? ','+key+'= ? ' : key+'= ? ' );
		str_param.push(dados[key]);
	});

	let sql = str_cabecalho+''+str_dados+' where codigo = ? ';
	str_param.push(dados['codigo']);

	return await conexao.updateAcesso(sql, str_param);
}

async function remover_acesso(codigo)
{
	console.log('USUARIO.remover_acesso()');
	return await conexao.deleteAcesso(codigo);
}

module.exports = {login, lista_todos_usuarios, alterar_senha_usuario, cadastra_acesso, altera_acesso, remover_acesso}