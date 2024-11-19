import { useState, useEffect } from "react";
import { Input, Button, message } from "antd";
import Popup from "../../components/Popup";

const VALID_CODES: { [key: string]: { name: string, daysValid: number } } = {
  "12345": { name: "Wanderson", daysValid: 30 },
  "67890": { name: "Vitor Xavier", daysValid: 7 },
};

export default function User() {
  const [authCode, setAuthCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [daysLeft, setDaysLeft] = useState<number>(0);

  // Verifica autenticação ao carregar
  useEffect(() => {
    const auth = localStorage.getItem("zapContactAuth");
    if (auth) {
      try {
        const authData = JSON.parse(auth);
        if (authData.code && VALID_CODES[authData.code]) {
          const now = new Date().getTime();
          const expirationDate = authData.expirationDate;
          const timeLeft = expirationDate - now;
          const daysRemaining = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

          if (daysRemaining > 0) {
            setIsAuthenticated(true);
            setUserName(authData.name);
            setDaysLeft(daysRemaining);
          } else {
            localStorage.removeItem("zapContactAuth");
            message.error("Sua licença expirou!");
          }
        }
      } catch {
        localStorage.removeItem("zapContactAuth");
      }
    }
  }, []);

  const handleAuth = () => {
    const userData = VALID_CODES[authCode];
    if (userData) {
      const now = new Date().getTime();
      const expirationDate = now + (userData.daysValid * 24 * 60 * 60 * 1000);
      
      setIsAuthenticated(true);
      setUserName(userData.name);
      setDaysLeft(userData.daysValid);
      
      message.success(`Bem-vindo, ${userData.name}!`);
      localStorage.setItem(
        "zapContactAuth",
        JSON.stringify({
          code: authCode,
          name: userData.name,
          timestamp: now,
          expirationDate: expirationDate,
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
            <p className="text-xl mb-2">Bem-vindo ao ZapContact, {userName}!</p>
            <p className="mb-2">Você tem acesso completo à extensão.</p>
            <p className="text-sm text-gray-500 mb-4">
              Sua licença expira em {daysLeft} dias
            </p>
            <Button type="primary" danger onClick={handleLogout}>
              Sair
            </Button>
          </div>
        )}
      </div>
    </Popup>
  );
}
