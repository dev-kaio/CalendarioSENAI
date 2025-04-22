const express = require('express');
const session = require('express-session');
const path = require('path');
const admin = require('firebase-admin');
const bodyParser = require('body-parser'); // Para processar JSON no corpo das requisições
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

//---------------------
//CONTROLE DE SESSION
//---------------------
app.use(express.urlencoded({ extended: true }));

const secret = process.env.CHAVE_SECRETA;

// Configuração da Sessão
app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: true
}));

function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/index');  // Se não estiver autenticado, redireciona para o login
  }
  next();  // Se estiver autenticado, prossegue para a próxima função
}

app.use('/views', checkAuth, (req, res, next) => {
  if (req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use('/views', express.static(path.join(__dirname, 'views')));

// Middleware para verificar se o usuário está autenticado
app.get('/views/admin.html', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'views', 'admin.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao destruir a sessão:", err);
      return res.status(500).json({ success: false, message: 'Erro ao fazer logout' });
    }
    console.log("Sessão finalizada");
    res.clearCookie('connect.sid');
    res.status(200).json({ success: true, message: 'Logout bem-sucedido' });
  });
});

//----------------------------
//FIM DO CONTROLE DE SESSION
//----------------------------

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/favicon.ico', (req, res) => res.sendFile(path.join(__dirname, 'public', 'favicon.ico')));

//---------------------
//FIREBASE
//---------------------
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
const auth = admin.auth();

// Rota para login (endpoint da API)
app.post('/api/login', (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Token de autenticação é obrigatório!' });
  }

  auth.verifyIdToken(idToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      req.session.user = { uid }; //Salvando UID na session
      console.log('Usuário autenticado:', uid);
      return res.json({ success: true, message: 'Login bem-sucedido!' });
    })
    .catch((error) => {
      console.error('Erro ao verificar token:', error);
      return res.status(401).json({ success: false, message: 'Token inválido!' });
    });
});


//Registro de dados no Firebase (Realtime Database)
app.post('/api/adicionarItem', (req, res) => {
  const { id, curso, dataInicio, dataFim, professor, sala } = req.body;

  if (!id || !curso || !dataInicio || !dataFim || !professor || !sala) {
    return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios!' });
  }

  const cursos = {
    Id: id,
    Curso: curso,
    DataInicio: dataInicio,
    DataFim: dataFim,
    Professor: professor,
    Sala: sala
  };

  const referencia = db.ref("CalendarioSENAI").child(curso + " (" + dataInicio + ") " + id);
  referencia.set(cursos)
    .then(() => {
      return res.status(200).json({ success: true, message: 'Item adicionado com sucesso!' });
    })
    .catch((error) => {
      console.error("Erro ao adicionar item no Firebase:", error);
      return res.status(500).json({ success: false, message: 'Erro ao adicionar item!' });
    });
});


//Consulta de dados do Firebase
app.get('/api/obterItens', (req, res) => {
  const referencia = db.ref('CalendarioSENAI');

  referencia.once('value')
    .then(snapshot => {
      const data = snapshot.val();
      if (data) {
        return res.json({ success: true, data });
      } else {
        return res.json({ success: false, message: 'Nenhum item encontrado' });
      }
    })
    .catch((error) => {
      console.error('Erro ao obter itens:', error);
      return res.status(500).json({ success: false, message: 'Erro ao obter itens' });
    });
});

app.delete('/api/excluir/:id', (req, res) => {
  const id = req.params.id;
  const { curso, dataInicio } = req.body;

  if (!id || !curso || !dataInicio) {
    return res.status(400).json({ success: false, message: "ID é obrigatório!" })
  }

  const referencia = db.ref("CalendarioSENAI").child(curso + " (" + dataInicio + ") " + id);
  referencia.remove()
    .then(() => {
      return res.status(200).json({ success: true, message: "Remoção bem sucedida!" });
    })
    .catch((error) => {
      console.error("Erro ao excluir item do Firebase: ", error);
      return res.status(500).json({ success: false, message: "Erro ao excluir." });
    })
})

app.get('/api/obterItem/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const snapshot = await db.ref("CalendarioSENAI").once("value");
    const data = snapshot.val();

    if (!data) {
      return res.status(404).json({ success: false, message: "Nenhum item encontrado." });
    }

    const itemEncontrado = Object.values(data).find(item => item.Id === id);

    if (itemEncontrado) {
      return res.status(200).json({ success: true, data: itemEncontrado });
    } else {
      return res.status(404).json({ success: false, message: "Item não encontrado." });
    }
  } catch (error) {
    console.error("Erro ao buscar item:", error);
    return res.status(500).json({ success: false, message: "Erro ao buscar item." });
  }
});

app.put('/api/editar/:id', async (req, res) => {
  const { id } = req.params;
  const { curso, dataInicio, dataFim, professor, sala, itemCurso, itemData } = req.body;

  if (!curso || !dataInicio) {
    return res.status(400).json({ success: false, message: "Campos obrigatórios faltando." });
  }

  const caminhoAntigo = `CalendarioSENAI/${itemCurso} (${itemData}) ${id}`;
  await db.ref(caminhoAntigo).remove();

  const referencia = db.ref("CalendarioSENAI").child(curso + " (" + dataInicio + ") " + id);

  try {
    await referencia.set({
      Id: id,
      Curso: curso,
      DataInicio: dataInicio,
      DataFim: dataFim,
      Professor: professor,
      Sala: sala
    });
    res.status(200).json({ success: true, message: "Item atualizado com sucesso!" });
  }
  catch (error) {
    console.error("Erro ao editar item: ", error);
    res.status(500).json({ success: false, message: "Erro ao editar item." });
  }
})


app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
