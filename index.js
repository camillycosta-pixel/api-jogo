const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
app.use(express.json());

let db;

// Conecta ao banco de dados e cria as tabelas
async function iniciarBanco() {
  db = await open({
    filename: './banco.sqlite',
    driver: sqlite3.Database
  });

  await db.exec('PRAGMA foreign_keys = ON;');

  // Tabela Generos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS generos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT
    );
  `);

  // Tabela Jogos com FK
  await db.exec(`
    CREATE TABLE IF NOT EXISTS jogos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      desenvolvedora TEXT NOT NULL,
      sinopse TEXT,
      genero_id INTEGER NOT NULL,
      FOREIGN KEY (genero_id) REFERENCES generos (id)
    );
  `);
}

iniciarBanco();

// ================= ROTAS DE GÊNEROS =================

// Cadastrar gênero
app.post('/generos', async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ erro: 'O nome é obrigatório.' });

  const result = await db.run('INSERT INTO generos (nome, descricao) VALUES (?, ?)', [nome, descricao]);
  res.status(201).json({ id: result.lastID, nome, descricao });
});

// Listar gêneros
app.get('/generos', async (req, res) => {
  const generos = await db.all('SELECT * FROM generos');
  res.status(200).json(generos);
});

// ================= ROTAS DE JOGOS =================

// Cadastrar jogo
app.post('/jogos', async (req, res) => {
  const { nome, desenvolvedora, sinopse, genero_id } = req.body;

  if (!nome || !desenvolvedora || !genero_id) {
    return res.status(400).json({ erro: 'nome, desenvolvedora e genero_id são obrigatórios.' });
  }

  const genero = await db.get('SELECT id FROM generos WHERE id = ?', [genero_id]);
  if (!genero) return res.status(400).json({ erro: 'Gênero informado não existe.' });

  const result = await db.run(
    'INSERT INTO jogos (nome, desenvolvedora, sinopse, genero_id) VALUES (?, ?, ?, ?)',
    [nome, desenvolvedora, sinopse, genero_id]
  );

  res.status(201).json({ id: result.lastID, nome, desenvolvedora, sinopse, genero_id });
});

// Listar todos os jogos
app.get('/jogos', async (req, res) => {
  const jogos = await db.all('SELECT * FROM jogos');
  res.status(200).json(jogos);
});

// Buscar jogo por ID
app.get('/jogos/:id', async (req, res) => {
  const jogo = await db.get('SELECT * FROM jogos WHERE id = ?', [req.params.id]);
  if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado.' });
  res.status(200).json(jogo);
});

// Atualizar jogo
app.put('/jogos/:id', async (req, res) => {
  const { nome, desenvolvedora, sinopse, genero_id } = req.body;

  if (!nome || !desenvolvedora || !genero_id) {
    return res.status(400).json({ erro: 'nome, desenvolvedora e genero_id são obrigatórios.' });
  }

  const jogo = await db.get('SELECT id FROM jogos WHERE id = ?', [req.params.id]);
  if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado.' });

  const genero = await db.get('SELECT id FROM generos WHERE id = ?', [genero_id]);
  if (!genero) return res.status(400).json({ erro: 'Gênero informado não existe.' });

  await db.run(
    'UPDATE jogos SET nome = ?, desenvolvedora = ?, sinopse = ?, genero_id = ? WHERE id = ?',
    [nome, desenvolvedora, sinopse, genero_id, req.params.id]
  );

  res.status(200).json({ id: Number(req.params.id), nome, desenvolvedora, sinopse, genero_id });
});

// Excluir jogo
app.delete('/jogos/:id', async (req, res) => {
  const jogo = await db.get('SELECT id FROM jogos WHERE id = ?', [req.params.id]);
  if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado.' });

  await db.run('DELETE FROM jogos WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

// Inicia o servidor
app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));