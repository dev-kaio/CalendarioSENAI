import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyCSeMOU0AlJ5at6Z7-QThouzBrDWc_kFyI",
    authDomain: "calendariosenai-4154b.firebaseapp.com",
    databaseURL: "https://calendariosenai-4154b-default-rtdb.firebaseio.com",
    projectId: "calendariosenai-4154b",
    storageBucket: "calendariosenai-4154b.firebasestorage.app",
    messagingSenderId: "403222129935",
    appId: "1:403222129935:web:3f8d19daaeaebb554aa27a",
    measurementId: "G-12MCX2RYPY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("loginForm").addEventListener("submit", function logar(e) {
    e.preventDefault();

    const login = document.getElementById("user").value;
    const senha = document.getElementById("senha").value;
    const texto = document.getElementById("resultado");
    texto.innerHTML = "Verificando...";

    signInWithEmailAndPassword(auth, login, senha)
        .then((userCredential) => {
            // Gerando o token de autenticação do Firebase
            return userCredential.user.getIdToken();
        })
        .then((idToken) => {
            // Enviando o token de autenticação para o backend para verificação
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken: idToken }), 
            })
                .then(response => response.json())
                .then((data) => {
                    if (data.success) {
                        texto.innerHTML = "Login bem-sucedido!";
                        setTimeout(() => {
                            window.location.href = "/views/admin.html";
                        }, 1000);
                    } else {
                        texto.innerHTML = data.message;
                    }
                })
                .catch((error) => {
                    console.error("Erro ao fazer login:", error);
                    texto.innerHTML = "Erro ao conectar com o servidor!";
                });
        })
        .catch((error) => {
            console.error("Erro ao fazer login:", error);
            texto.innerHTML = "Usuário ou senha inválido!";
        });

    document.getElementById("loginForm").reset();

    setTimeout(() => {
        texto.innerHTML = "";
    }, 3000);
});
