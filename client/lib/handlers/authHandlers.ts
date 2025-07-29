import { loginUser, registerUser, requestPasswordReset, verifyOtpAndResetPassword } from "@/services/authService";
import { useAuth } from "@/stores/useAuth";

export const handleLogin = async (
  email: string,
  password: string,
  role: string
): Promise<void> => {
  const { login, setLoading, setError } = useAuth.getState();

  try {
    setLoading(true);
    const { user, token } = await loginUser(email, password, role);
    login(user, token);
  } catch (error: any) {
    setError(error?.response?.data?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};

export const handleRegister = async (
  name: string,
  email: string,
  password: string,
  role: string
): Promise<void> => {
  const { register, setLoading, setError } = useAuth.getState();

  try {
    setLoading(true);
    const { user, token } = await registerUser(name, email, password, role);
    register(user, token);
  } catch (error: any) {
    setError(error?.response?.data?.message || "Registration failed");
  } finally {
    setLoading(false);
  }
};
