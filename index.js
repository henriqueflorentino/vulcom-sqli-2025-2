// Inseri no campo do usuario: 'or 1=1; drop table users;--, metodo que foi mostrado nas aulas anteriores -- Henrique A.Florentino 5ºDSM


// CTF - SQL Injection no Login
// Tecnologias: Node.js, Express, SQLite



const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database(':memory:');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Criar tabela e inserir dados vulneráveis
db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
    db.run("INSERT INTO users (username, password) VALUES ('admin', 'admin123')");
    db.run("INSERT INTO users (username, password) VALUES ('user', 'user123')");
    db.run("CREATE TABLE flags (id INTEGER PRIMARY KEY, flag TEXT)");
    db.run("INSERT INTO flags (flag) VALUES ('VULCOM{SQLi_Exploit_Success}')");
});

// Rota de login com SQL Injection
app.get('/', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // // CONSULTA SQL VULNERÁVEL 🚨
    // const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

    /* 
    Consulta SQL segura, Usando Parametros 
    ? marca o lugar onde os parametros serão vinculados (binding)
    No caso do SQlite, o caractere ? é usado para marcar o lugar 
    dos parametros. Outros bancos de dados podem utilizar convenções diferentes,
    como $0, $1, etc 
    */
    const query = `SELECT * FROM users WHERE username = ? AND password = ?`;

    const query2 = `SELECT * FROM flags`;
    
    //db.all(query, [], (err, rows) => {
    /*
        Os valores dos parametros são passados em db.all no segundo argumento,
        como um vetor. Tais valores são sanitizados antes de serem incorporados
        na consulta.
    */
    db.all(query, [username, password], (err, rows) => {
        if (err) {
            return res.send('Erro no servidor');
        }
        if (rows.length > 0) {
            console.log('CONSULTA: ', query);
            console.log('RESULTADO:', rows);
            db.get(query2, [], (err, row) => {
                if (err) return res.send('ERRO: ${err}')
                    let ret = 'Bem vindo, ${username}! <br> '
                    ret += 'Flag: ${row.flag}';
                    return res.send(ret);
            });

            return res.send(`Bem-vindo, ${username}! <br> Flag: VULCOM{SQLi_Exploit_Success}`);
        } else {
            return res.send('Login falhou!');
        }
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');