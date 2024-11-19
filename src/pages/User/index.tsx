import { useState, useEffect } from "react";
import { Input, Button, message } from "antd";
import Popup from "../../components/Popup";

const VALID_CODES: { [key: string]: string } = {
  "12345": "Wanderson",
};

export default function User() {
  const [authCode, setAuthCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verifica autenticação ao carregar
  useEffect(() => {
    const auth = localStorage.getItem("zapContactAuth");
    if (auth) {
      try {
        const authData = JSON.parse(auth);
        if (authData.code && VALID_CODES[authData.code]) {
          setIsAuthenticated(true);
        }
      } catch {
        localStorage.removeItem("zapContactAuth");
      }
    }
  }, []);

  const handleAuth = () => {
    const userName = VALID_CODES[authCode];
    if (userName) {
      setIsAuthenticated(true);
      message.success(`Bem-vindo, ${userName}!`);
      localStorage.setItem(
        "zapContactAuth",
        JSON.stringify({
          code: authCode,
          name: userName,
          timestamp: new Date().getTime(),
        })
      );
    } else {
      message.error("Código inválido!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("zapContactAuth");
    setIsAuthenticated(false);
    setAuthCode("");
    message.success("Logout realizado com sucesso!");
  };

  return (
    <Popup>
      <div className="flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Login</h1>

        {!isAuthenticated ? (
          <div className="w-full max-w-xs">
            <Input
              placeholder="Digite seu código de acesso"
              type="password"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              className="mb-4"
              onPressEnter={handleAuth}
            />
            <Button type="primary" onClick={handleAuth} className="w-full">
              Acessar
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl">Bem-vindo ao ZapContact!</p>
            <p className="mb-4">Você tem acesso completo à extensão.</p>
            <Button type="primary" danger onClick={handleLogout}>
              Sair
            </Button>
          </div>
        )}
      </div>
    </Popup>
  );
}
