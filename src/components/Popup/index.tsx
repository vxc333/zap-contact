import { useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { message } from "antd";

const { Header, Sider, Content } = Layout;

type PopupProps = {
  children?: React.ReactNode;
};

export default function Popup({ children }: PopupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Verifica autenticação ao carregar
  useEffect(() => {
    const auth = localStorage.getItem('zapContactAuth');
    if (!auth && location.pathname !== '/') {
      message.error('Faça login primeiro!');
      navigate('/');
    }
  }, [location.pathname, navigate]);

  const getSelectedKey = () => {
    switch (location.pathname) {
      case '/': return '1';
      case '/extractor': return '2';
      default: return '1';
    }
  };

  const handleMenuClick = (e: { key: string }) => {
    switch (e.key) {
      case '1':
        navigate('/');
        break;
      case '2': {
        const auth = localStorage.getItem('zapContactAuth');
        if (auth) {
          navigate('/extractor');
        } else {
          message.error('Faça login primeiro!');
          navigate('/');
        }
        break;
      }
    }
  };

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <div className="w-[600px] h-max-[600px] text-xl flex flex-col text-gray-200 bg-green-700 bg-opacity-70 ">
      <Layout>
        <Sider trigger={null} collapsible collapsed={collapsed}>
          {collapsed ? (
            <h1 className="font-bold text-center text-2xl py-3">Zap</h1>
          ) : (
            <h1 className="text-center font-bold py-3 text-2xl">ZapContacts</h1>
          )}
          <Menu
            onClick={handleMenuClick}
            theme="dark"
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={[
              {
                key: "1",
                icon: <UserOutlined />,
                label: "Usuário",
              },
              {
                key: "2",
                icon: <UploadOutlined />,
                label: "Extrator",
              },
            ]}
          />
        </Sider>
        <Layout>
          <Header style={{ padding: 0, background: colorBgContainer }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 64,
                height: 64,
              }}
            />
          </Header>
          <Content
            className="flex flex-col"
            style={{
              margin: "24px 16px",
              padding: 24,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </div>
  );
}
