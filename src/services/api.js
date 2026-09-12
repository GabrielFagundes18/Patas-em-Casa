// O quê: importa o cliente HTTP usado para acessar o backend.
// Como: axios fornece uma instância configurável com métodos baseados em Promise.
// Para quê: centraliza a comunicação remota utilizada pelos serviços de animais.
import axios from 'axios';


// O quê: cria um cliente Axios com endereço e cabeçalho padrão da API.
// Como: axios.create encapsula baseURL e Content-Type para todas as requisições dessa instância.
// Para quê: evita repetir configurações de transporte nos módulos consumidores.
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// O quê: exporta o cliente configurado.
// Como: o export default permite importação direta nos serviços.
// Para quê: mantém o acesso ao backend desacoplado dos componentes visuais.
export default api;