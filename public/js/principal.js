function excluir(Id, Curso, DataInicio) {
    if (!confirm("Tem certeza que deseja excluir este curso?")) return;
    try {
        excluirConfirmado(Id, Curso, DataInicio)
        alert("Item excluído com sucesso.");
        location.reload();
    }
    catch (error) {
        console.error("Erro: ", error);
        alert("Erro na exclusão.");
    }
}

function excluirConfirmado(Id, Curso, DataInicio) {
    fetch(`/api/excluir/${Id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ curso: Curso, dataInicio: DataInicio })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro ao excluir item.");
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                return;
            } else {
                alert("Erro ao excluir: " + data.message);
            }
        })
        .catch(error => {
            console.error("Erro: ", error);
            alert("Erro na exclusão.");
        });
}

function editar(Id) {
    fetch(`/api/obterItem/${Id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const item = data.data;
                document.getElementById("editId").value = item.Id;
                document.getElementById("editCurso").value = item.Curso;
                document.getElementById("editDataInicio").value = item.DataInicio;
                document.getElementById("editDataFim").value = item.DataFim;
                document.getElementById("editProfessor").value = item.Professor;
                document.getElementById("editSala").value = item.Sala;
                itemCurso = item.Curso;
                itemData = item.DataInicio;

                document.getElementById("modalEditar").style.display = "flex";

                document.getElementById("formEditar").addEventListener("submit", function (event) {
                    event.preventDefault();

                    const id = document.getElementById("editId").value;
                    const curso = document.getElementById("editCurso").value;
                    const dataInicio = document.getElementById("editDataInicio").value;
                    const dataFim = document.getElementById("editDataFim").value;
                    const professor = document.getElementById("editProfessor").value;
                    const sala = document.getElementById("editSala").value;

                    fetch(`/api/editar/${id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ curso, dataInicio, dataFim, professor, sala, itemCurso, itemData })
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert("Item atualizado com sucesso!");
                                document.getElementById("modalEditar").style.display = "none";
                                window.location.reload();
                                loadTabelaAndamento();
                            } else {
                                alert("Erro ao atualizar item.");
                            }
                        })
                        .catch(error => console.error("Erro ao atualizar item:", error));
                });
            } else {
                alert("Item não encontrado.");
            }
        })
        .catch(error => console.error("Erro ao buscar item:", error));
}

function fecharModal() {
    document.getElementById("modalEditar").style.display = "none";
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
        let intervalId;
        let rodando = true;

        function alterarTabelas() {
            const tAndamento = document.getElementById("t-andamento");
            const tIniciar = document.getElementById("t-iniciar");

            if (tAndamento.style.display === "none") {
                tAndamento.style.display = "flex";
                tIniciar.style.display = "none";
            } else {
                tAndamento.style.display = "none";
                tIniciar.style.display = "flex";
            }
        }

        intervalId = setInterval(alterarTabelas, 3000);

        document.getElementById("alterar-btn").addEventListener("click", () => {
            if (rodando) {
                clearInterval(intervalId);
                document.getElementById("alterar-btn").textContent = "Retomar";
            } else {
                intervalId = setInterval(alterarTabelas, 3000);
                document.getElementById("alterar-btn").textContent = "Pausar";
            }
            rodando = !rodando;
        });
    }
    else if (currentPage.includes("iniciar.html")) {
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
                const tabelaAndamento = document.getElementById("tabelaAndamento");
                const tbodyAndamento = tabelaAndamento.getElementsByTagName('tbody')[0];
                tbodyAndamento.innerHTML = "";

                const tabelaIniciar = document.getElementById("tabelaIniciar");
                const tbodyIniciar = tabelaIniciar.getElementsByTagName('tbody')[0];
                tbodyIniciar.innerHTML = "";

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

    const [ano, mes, dia] = DataInicio.split('-');
    const dataInicio = new Date(Number(ano), Number(mes) - 1, Number(dia));
    dataInicio.setHours(0, 0, 0, 0);

    const [anof, mesf, diaf] = DataFim.split('-');
    const dataFim = new Date(Number(anof), Number(mesf) - 1, Number(diaf));
    dataFim.setHours(0, 0, 0, 0);

    if (dataInicio > dataFim || dataFim < hoje) {
        try {
            excluirConfirmado(Id, Curso, DataInicio);
        }
        catch (error) {
            console.error("Erro: ", error);
        }

        return;
    }

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
                <li><button onclick="editar('${Id}')">Editar</button></li>
                <li><button onclick="excluir('${Id}', '${Curso}', '${DataInicio}')">Excluir</button></li>
            </ul>`;
        }
    }
    else if (dataInicio >= hoje) {
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
                <li><button onclick="editar('${Id}')">Editar</button></li>
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

function exportarExcel(tabelaId) {
    const tabela = document.getElementById(tabelaId);
    if (!tabela || tabela.tagName !== "TABLE") {
        console.error("Tabela não encontrada ou elemento inválido.");
        return;
    }

    const tabelaClone = tabela.cloneNode(true);

    // Remove a última célula de cada linha (a coluna OPÇÕES)
    Array.from(tabelaClone.rows).forEach(row => {
        row.deleteCell(-1);
    });

    const workbook = XLSX.utils.table_to_book(tabelaClone, { sheet: `${tabelaId}` }); //convertendo a tabela para planilha
    XLSX.writeFile(workbook, `${tabelaId}.xlsx`);
}

function exportarTabelas() {
    const tabelaAndamento = document.getElementById('tabelaAndamento');
    const tabelaIniciar = document.getElementById('tabelaIniciar');

    if (!tabelaAndamento || !tabelaIniciar) {
        console.error("Uma ou ambas as tabelas não foram encontradas.");
        return;
    }

    const andamentoClone = tabelaAndamento.cloneNode(true);
    const iniciarClone = tabelaIniciar.cloneNode(true);

    Array.from(andamentoClone.rows).forEach(row => {
        row.deleteCell(-1);
    });
    Array.from(iniciarClone.rows).forEach(row => {
        row.deleteCell(-1);
    });

    const wsAndamento = XLSX.utils.table_to_sheet(andamentoClone);
    const wsIniciar = XLSX.utils.table_to_sheet(iniciarClone);

    const wb = XLSX.utils.book_new();

    // Adicionar as planilhas ao workbook
    XLSX.utils.book_append_sheet(wb, wsAndamento, "Cursos em Andamento");
    XLSX.utils.book_append_sheet(wb, wsIniciar, "Cursos para Iniciar");

    XLSX.writeFile(wb, "CursosSENAI.xlsx");
}
