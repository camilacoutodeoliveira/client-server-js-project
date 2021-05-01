class UserController {

    constructor(formIdCreate, formIdUpdate, tableId) {
        this.formEl = document.getElementById(formIdCreate);
        this.formUpdateEl = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);
        this.onSubmit();
        this.onEditCancel();
        this.selectAll();
    }

    onEditCancel() {
        document.querySelector('#box-user-update .btn-cancel').addEventListener('click', e => {
            this.showPanelCreate();
        });
        this.formUpdateEl.addEventListener('submit', event => {
            event.preventDefault();
            let btn = this.formUpdateEl.querySelector("[type=submit]");
            btn.disabled = true;
            let values = this.getValues(this.formUpdateEl);
            let index = this.formUpdateEl.dataset.trIndex;
            let tr = this.tableEl.rows[index];
            let userOld = JSON.parse(tr.dataset.user);
            //Object.assign -> Copia o valor de atributos de um objeto. CRia um objeto destino, retornando este objeto
            //objto da direita sobrescreve o da esquerda
            let result = Object.assign({}, userOld, values);

            this.getPhoto(this.formUpdateEl).then(content => {
                if (!values.photo) {
                    result._photo = userOld._photo;
                } else {
                    result._photo = content;
                }
                let user = new User();
                user.loadFromJSON(result);
                user.save().then(user => {
                    this.getTR(user, tr);
                    this.updateCount();
                    //Limpa formulário
                    this.formUpdateEl.reset();
                    btn.disabled = false;
                    this.showPanelCreate();
                });

            }, (e) => {
                console.log(e);
            });
        });
    }

    showPanelCreate() {
        document.querySelector('#box-user-create').style.display = "block";
        document.querySelector('#box-user-update').style.display = "none";
    }

    showPanelUpdate() {
        document.querySelector('#box-user-create').style.display = "none";
        document.querySelector('#box-user-update').style.display = "block";
    }

    onSubmit() {

        this.formEl.addEventListener("submit", event => {
            //Cancela o comando padrão que o evento teria
            event.preventDefault();

            let btnSubmit = this.formEl.querySelector("[type=submit]");
            btnSubmit.disabled = true;
            let values = this.getValues(this.formEl);

            if (!values) return false;

            this.getPhoto(this.formEl).then(content => {
                //recebe conteudo do arquivo
                values.photo = content;
                values.save().then(user => {
                    this.addLine(user);
                    //Limpa formulário
                    this.formEl.reset();
                    btnSubmit.disabled = false;
                });

            }, (e) => {
                console.log(e);
            });
        });
    }

    getPhoto(formEl) {
        //(Promisse) É uma intenção, uma promessa, executa uma ação assíncrona
        return new Promise((resolve, reject) => {
            // FileReader => Útil para ler e manipular arquivos e pastas
            let fileReader = new FileReader

            let elements = [...formEl.elements].filter(item => {
                if (item.name === 'photo') {
                    return item;
                }
            });

            let file = elements[0].files[0]

            //callBack, função usada como retorno após a execução de uma rotina
            //ocorre depois do readAsDataURL, não se sabe quando
            fileReader.onload = () => {
                resolve(fileReader.result);
            };

            fileReader.onerror = () => {
                reject(e);
            };

            file ? fileReader.readAsDataURL(file) : resolve('dist/img/boxed-bg.jpg');
        });
    }

    getValues(formEl) {

        let user = {};

        let isValid = true;

        //Spread expressão esperando múltiplos parâmetros
        // o uso das reticências significa que eu não preciso informar quantos indices existem
        [...formEl.elements].forEach(function (field, index) {
            if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {
                field.parentElement.classList.add('has-error');
                isValid = false;
            }
            if (field.name == "gender") {
                if (field.checked) {
                    user[field.name] = field.value;
                }
            } else if (field.name == "admin") {
                user[field.name] = field.checked;
            } else {
                user[field.name] = field.value;
            }
        });

        if (!isValid) {
            return false;
        }
        return new User(
            user.name,
            user.gender,
            user.birth,
            user.country,
            user.email,
            user.password,
            user.photo,
            user.admin
        );

    }

    selectAll() {
        User.getUserStorage().then(data => {
            data.users.forEach(dataUser => {
                let user = new User();
                user.loadFromJSON(dataUser);
                this.addLine(user);
            });
        })
    }

    addLine(dataUser) {
        let tr = this.getTR(dataUser);
        this.tableEl.appendChild(tr);
        this.updateCount();
    }

    //Valor Padrão. O comando = é utilizado para torna-lo opcional
    getTR(dataUser, tr = null) {
        if (tr === null) tr = document.createElement('tr');
        //Serialização - Transformar um objeto em texto
        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = `
        <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
        <td>${dataUser.name}</td>
        <td>${dataUser.email}</td>
        <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
        <td>${dataUser.register.toLocaleDateString()}</td>
        <td>
        <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
        <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
        </td>
    `;
        this.addEventsTR(tr);
        return tr;
    }

    addEventsTR(tr) {
        tr.querySelector(".btn-delete").addEventListener('click', e => {
            if (confirm('Are you sure you want to delete?')) {
                let user = new User();
                user.loadFromJSON(JSON.parse(tr.dataset.user));
                user.delete().then(data => {
                    tr.remove();
                    this.updateCount();
                });
            }
        });

        tr.querySelector(".btn-edit").addEventListener('click', e => {
            let json = JSON.parse(tr.dataset.user);
            this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json) {
                let field = this.formUpdateEl.querySelector("[name= " + name.replace("_", "") + "]");

                if (field) {
                    switch (field.type) {
                        case 'file':
                            continue;
                            break;
                        case 'radio':
                            field = this.formUpdateEl.querySelector("[name= " + name.replace("_", "") + "][value=" + json[name] + "]");
                            field.checked = true;
                            break;
                        case 'checkbox':
                            field.checked = json[name];
                            break;
                        default:
                            field.value = json[name];
                    }
                }
            }
            this.formUpdateEl.querySelector(".photo").src = json._photo;
            this.showPanelUpdate();
        });
    }

    updateCount() {
        //DataSet - faz parte da API Web permite leitura e escrita em elementos com data-
        let numberUsers = 0;
        let numberAdmins = 0;
        [...this.tableEl.children].forEach(tr => {
            numberUsers++;
            // Interpreta a string e formata para o formato real
            let user = JSON.parse(tr.dataset.user);
            if (user._admin) numberAdmins++;
        });
        document.querySelector('#number-users').innerHTML = numberUsers;
        document.querySelector('#number-users-admin').innerHTML = numberAdmins;
    }

}

//(Síncrono)Toda ação entre site e usuário ocorre em sincronia 

//(Assíncrono)Atividades e recursos do site não dependem da ação do usuário 

//Unix TimesStamp conta a quantd de segundos desde //01-01-1970
//Bug 2038

//Outra forma de fazer
//<td>${Utils.dateFormat(dataUser.register)}</td>