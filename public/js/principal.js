function excluir(Id, Curso, DataInicio) {
    if (!confirm("Tem certeza que deseja excluir este curso?")) return;

    fetch(`/api/excluir/${Id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({curso: Curso, dataInicio: DataInicio})
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao excluir item.");
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert("Item excluído com sucesso.");
                location.reload();
            } else {
                alert("Erro ao excluir: " + data.message);
            }
        })
        .catch(error => {
            console.error("Erro: ", error);
            alert("Erro na exclusão.");
        });
}

document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.pathname;

    if (currentPage.includes("admin.html")) {
        loadTabelaAndamento();
        document.getElementById("sair").addEventListener("click", function () {
            fetch('/logout', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then((response) => {
                if (response.ok) {
                    alert("Logout bem-sucedido.");
                    window.location.href = '/'
                } else {
                    console.log("Erro");
                }
            })
                .catch((error) => {
                    console.error("Erro ao tentar fazer logout:", error);
                    alert("Erro de comunicação com o servidor.");
                });
        });
    }
    else if (currentPage.includes("home.html")) {
        loadTabelaAndamento();
    }
    else if (currentPage.includes("novocurso.html")) {
        setupFormSubmission();
    }
});

function loadTabelaAndamento() {
    fetch('/api/obterItens')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tabela = document.getElementById("tabelaAndamento");
                const tbody = tabela.getElementsByTagName('tbody')[0];
                tbody.innerHTML = "";

                for (const [key, value] of Object.entries(data.data)) {
                    inserirTabelaAndamento(value);
                }
            } else {
                console.log('Erro ao obter os dados:', data.message);
            }
        })
        .catch((error) => {
            console.error("Erro ao buscar os dados:", error);
        });
}

function inserirTabelaAndamento({ Id, Curso, DataInicio, DataFim, Professor, Sala }) {
    let tabela;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    function formatarDataBrasileira(data) {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }
    const [ano, mes, dia] = DataInicio.split('-');
    const dataInicio = new Date(Number(ano), Number(mes) - 1, Number(dia));
    dataInicio.setHours(0, 0, 0, 0);

    console.log(formatarDataBrasileira(dataInicio));

    if (dataInicio < hoje) {
        tabela = document.getElementById("tabelaAndamento");
        if (window.location.pathname.includes("home.html")) {
            const tbody = tabela.getElementsByTagName('tbody')[0];
            const novaLinha = tbody.insertRow();

            const cel_curso = novaLinha.insertCell(0);
            const cel_dataInicio = novaLinha.insertCell(1);
            const cel_dataFim = novaLinha.insertCell(2);
            const cel_professor = novaLinha.insertCell(3);
            const cel_sala = novaLinha.insertCell(4);

            cel_curso.textContent = Curso;
            cel_dataInicio.textContent = DataInicio;
            cel_dataFim.textContent = DataFim;
            cel_professor.textContent = Professor;
            cel_sala.textContent = Sala;
        }
        else if (window.location.pathname.includes("admin.html")) {
            const tbody = tabela.getElementsByTagName('tbody')[0];
            const novaLinha = tbody.insertRow();

            const cel_curso = novaLinha.insertCell(0);
            const cel_dataInicio = novaLinha.insertCell(1);
            const cel_dataFim = novaLinha.insertCell(2);
            const cel_professor = novaLinha.insertCell(3);
            const cel_sala = novaLinha.insertCell(4);
            const celulaBtn = novaLinha.insertCell(5);

            cel_curso.textContent = Curso;
            cel_dataInicio.textContent = DataInicio;
            cel_dataFim.textContent = DataFim;
            cel_professor.textContent = Professor;
            cel_sala.textContent = Sala;
            celulaBtn.innerHTML = `
            <ul style="list-style-type: none;">
                <li><button onclick="editar('${Id}', '${Curso}', '${DataInicio}')">Editar</button></li>
                <li><button onclick="excluir('${Id}', '${Curso}', '${DataInicio}')">Excluir</button></li>
            </ul>`;
        }
    }
    else {
        tabela = document.getElementById("tabelaIniciar");
        if (window.location.pathname.includes("home.html")) {
            const tbody = tabela.getElementsByTagName('tbody')[0];
            const novaLinha = tbody.insertRow();

            const cel_curso = novaLinha.insertCell(0);
            const cel_dataInicio = novaLinha.insertCell(1);

            cel_curso.textContent = Curso;
            cel_dataInicio.textContent = DataInicio;
        }
        else if (window.location.pathname.includes("admin.html")) {
            const tbody = tabela.getElementsByTagName('tbody')[0];
            const novaLinha = tbody.insertRow();

            const cel_curso = novaLinha.insertCell(0);
            const cel_dataInicio = novaLinha.insertCell(1);
            const celulaBtn = novaLinha.insertCell(2);

            cel_curso.textContent = Curso;
            cel_dataInicio.textContent = DataInicio;
            celulaBtn.innerHTML = `
            <ul style="list-style-type: none;">
                <li><button onclick="editar('${Id}', '${Curso}', '${DataInicio}')">Editar</button></li>
                <li><button onclick="excluir('${Id}', '${Curso}', '${DataInicio}')">Excluir</button></li >
            </ul > `;
        }
    }
}

function setupFormSubmission() {
    document.getElementById("formItem").addEventListener("submit", function (e) {
        e.preventDefault();

        const curso = document.getElementById("curso").value;
        const dataInicio = document.getElementById("dataInicio").value;
        const dataFim = document.getElementById("dataFim").value;
        const professor = document.getElementById("professor").value;
        const sala = document.getElementById("sala").value;
        const id = self.crypto.randomUUID();

        fetch('/api/adicionarItem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id,
                curso,
                dataInicio,
                dataFim,
                professor,
                sala
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Falha ao adicionar item');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log("Inserção bem-sucedida");

                    window.location.href = "/views/admin.html";
                } else {
                    console.log("Erro ao inserir:", data.message);
                }
            })
            .catch((error) => {
                console.error("Erro ao enviar os dados:", error);
            });
    });
}
