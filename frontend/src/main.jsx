/*
  main.jsx
  -----------------------------------------------------------------------------
  Este é o primeiro arquivo executado pelo front-end React.

  Ele coloca o componente App dentro da div id="root" que existe no index.html.
*/

import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  /*
    BrowserRouter permite usar rotas no navegador:
    /, /login, /register e /dashboard.
  */
  <BrowserRouter>
    {/* AuthProvider deixa login, usuário e logout disponíveis para toda a aplicação. */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
