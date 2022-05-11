const mysql = require('mysql2/promise');

async function connect(){
    console.log('CONEXAO.connect()');    
    const db = mysql.createPool({
        host: 'localhost',
        user: 'root',
        database: 'db_estudo_py',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    return db;
}

async function selectDados(str_sql, dados)
{
    console.log('CONEXAO.selectDados()');
    const conn = await connect();
    const result = await conn.query(str_sql, [dados['login'], dados['senha']]);
    if (result[0].length < 1) {
        return {'erro':true, 'message':'Nenhum resultado encontrado'}
    }
    conn.end();
    return {'erro':false, 'message':'Conexão OK', 'data':result[0][0]};
}

async function selectContato(codigo, pesquisa)
{
    console.log('CONEXAO.selectContato()');
    let sql = '';
    let param = [];
    if (codigo !== '')
    {
        sql = 'select * from contato where codigo = ?';
        param = [codigo];
    } else if (pesquisa !== '') {
        sql = 'select * from contato where nome like ? or email like ?';
        param = ['%'+pesquisa+'%', '%'+pesquisa+'%'];
    } else {
        sql = 'select * from contato';    
    }

    const conn = await connect();
    const result = await conn.query(sql, param);

    if (result[0].length < 1) {
        return {'erro':true, 'message':'Nenhum resultado encontrado'}
    }
    conn.end();
    return {'erro':false, 'message':'Conexão OK', 'data':result[0]};
}

async function selectUsuarios()
{
    console.log('CONEXAO.selectUsuarios()');
    let sql = '';

    sql = 'select * from acesso';
    
    const conn = await connect();
    const result = await conn.query(sql, param);

    if (result[0].length < 1) {
        return {'erro':true, 'message':'Nenhum resultado encontrado'}
    }
    conn.end();
    return {'erro':false, 'message':'Conexão OK', 'data':result[0]};
}

async function updateContato(sql, dados)
{
    console.log('CONEXAO.updateContato()');
    let erro = false;
    let message = '';

    const conn = await connect();
    const result = await conn.query(sql, dados);

    if (result[0].changedRows <= 0) {
        erro = true;
        message = 'Não alterou o contato';
    } else {
        erro = false;
        message = 'Contato alterado com sucesso';
    }
    conn.end();

    return {'erro':erro, 'message':message};
}

async function insertContato(sql, dados)
{
    console.log('CONEXAO.insertContato()');
    let erro = false;
    let message = '';

    const conn = await connect();
    const result = await conn.query(sql, dados);

    if (result[0].affectedRows <= 0) {
        erro = true;
        message = 'Falha ao incluiu contato';
    } else {
        erro = false;
        message = 'Contato cadastrado com sucesso';
    }
    conn.end();

    return {'erro':erro, 'message':message};
}

async function deleteContato(codigo)
{
    console.log('CONEXAO.deleteContato()');
    let erro = false;
    let message = '';

    let sql = 'delete from contato where codigo = ?';
    let dados = [codigo];

    const conn = await connect();
    const result = await conn.query(sql, dados);

    if (result[0].affectedRows <= 0) {
        erro = true;
        message = 'Falha ao remover contato';
    } else {
        erro = false;
        message = 'Contato removido com sucesso';
    }
    conn.end();

    return {'erro':erro, 'message':message};
}

async function updateSenhaAcesso(sql, dados)
{
    console.log('CONEXAO.updateSenhaAcesso()');
    let erro = false;
    let message = '';

    const conn = await connect();
    const result = await conn.query(sql, dados);

    if (result[0].changedRows <= 0) {
        erro = true;
        message = 'Não alterou o usuário';
    } else {
        erro = false;
        message = 'Usuário alterado com sucesso';
    }
    conn.end();

    return {'erro':erro, 'message':message};
}

async function updateAcesso(sql, dados)
{
    console.log('CONEXAO.updateAcesso()');
    let erro = false;
    let message = '';

    const conn = await connect();
    const result = await conn.query(sql, dados);

    if (result[0].changedRows <= 0) {
        erro = true;
        message = 'Não alterou o Usuário';
    } else {
        erro = false;
        message = 'Usuário alterado com sucesso';
    }
    conn.end();

    return {'erro':erro, 'message':message};
}

async function insertAcesso(sql, dados)
{
    console.log('CONEXAO.insertAcesso()');
    let erro = false;
    let message = '';

    const conn = await connect();
    const result = await conn.query(sql, dados);

    if (result[0].affectedRows <= 0) {
        erro = true;
        message = 'Falha ao incluiu usuário';
    } else {
        erro = false;
        message = 'Usuário cadastrado com sucesso';
    }
    conn.end();

    return {'erro':erro, 'message':message};
}

async function deleteAcesso(codigo)
{
    console.log('CONEXAO.deleteAcesso()');
    let erro = false;
    let message = '';

    let sql = 'delete from acesso where codigo = ?';
    let dados = [codigo];

    const conn = await connect();
    const result = await conn.query(sql, dados);

    if (result[0].affectedRows <= 0) {
        erro = true;
        message = 'Falha ao remover acesso';
    } else {
        erro = false;
        message = 'Acesso removido com sucesso';
    }
    conn.end();

    return {'erro':erro, 'message':message};
}

module.exports = {selectDados, selectContato, selectUsuarios, updateContato, insertContato, deleteContato, updateSenhaAcesso, updateAcesso, insertAcesso, deleteAcesso}