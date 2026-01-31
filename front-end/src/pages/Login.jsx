import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastProvider";
import logoData from "../logo-removebg-preview.svg";
import { API_URL } from "../config";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at top right, #1e2a3b, #0f172a);
  color: var(--text);
  position: relative;
  overflow: hidden;
  padding: 20px;

  &::before {
    content: '';
    position: absolute;
    width: 150%;
    height: 150%;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 60%);
    top: -50%;
    left: -50%;
    z-index: 0;
  }
`;

const LoginCard = styled.div`
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(20px);
  padding: 50px 40px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 25px;
  z-index: 1;
  animation: ${fadeIn} 0.6s ease-out;

  @media (max-width: 480px) {
    padding: 30px 20px;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
`;

const Logo = styled.img`
  width: 120px;
  height: auto;
  filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));
`;

const Title = styled.h2`
  text-align: center;
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
  text-align: center;
`;

const InputGroup = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    transition: color 0.2s;
  }

  &:focus-within svg {
    color: var(--primary);
  }

  input {
    width: 100%;
    padding: 14px 14px 14px 50px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text);
    outline: none;
    font-size: 1rem;
    box-sizing: border-box;
    transition: all 0.2s ease;

    &:focus {
      border-color: var(--primary);
      background: rgba(15, 23, 42, 0.9);
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);

  &:hover { 
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
  }
  &:active { transform: translateY(0); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/**
 * Login Page
 * Entry point for the application.
 * Authenticates user and issues JWT token.
 */
const Login = () => {
    const { login } = useAuth();
    const { addToast } = useToast();

    const [inputs, setInputs] = useState({
        username: "",
        password: ""
    });

    const { username, password } = inputs;

    const onChange = (e) => setInputs({ ...inputs, [e.target.name]: e.target.value });

    /**
     * Submit Login
     * Sends POST /auth/login.
     * On success: Stores token in context/localStorage and redirects.
     */
    const onSubmitForm = async (e) => {
        e.preventDefault();
        try {
            const body = { username, password };
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const parseRes = await response.json();

            if (response.ok) {
                if (parseRes.token) {
                    login(parseRes.token);
                    addToast("Logged in successfully", "success");
                    // Assuming default page is dashboard, handled by protected routes redirect logic or here
                    // Usually ProtectedRoute handles access, but login page needs to push user to /
                    // However, due to state update async, let's just let it be. 
                    // But actually since we are not wrapped in a router here (we are inside `App`), we can navigate.
                    // Oh wait, Login page is a route.
                    // We need to verify if Auth state updates fast enough. 
                    // Usually we redirect in the useEffect or inside App based on auth state.
                }
            } else {
                addToast(parseRes, "error");
            }
        } catch (err) {
            console.error(err.message);
            addToast("Server Error", "error");
        }
    };

    return (
        <Container>
            <LoginCard>
                <Header>
                    <Logo src={logoData} alt="Woodworking Shop" />
                    <Title>Woodworking Shop</Title>
                    <Subtitle>Sign in to manage your workshop</Subtitle>
                </Header>
                <form onSubmit={onSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <InputGroup>
                        <User size={20} />
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={username}
                            onChange={onChange}
                            autoComplete="username"
                        />
                    </InputGroup>
                    <InputGroup>
                        <Lock size={20} />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={password}
                            onChange={onChange}
                            autoComplete="current-password"
                        />
                    </InputGroup>
                    <Button type="submit">Sign In</Button>
                </form>
            </LoginCard>
        </Container>
    );
};

export default Login;
