import React, { useState } from 'react';
import { Box, User, Lock, Eye, EyeOff, Sun, Moon, AlertCircle } from 'lucide-react';
import { useTheme } from '../../components/theme-provider';
import { useAuth } from '../../hooks/use-auth';
import { LoginHeroPanel } from './components/login-hero-panel';

export const LoginScreen: React.FC = () => {
  const { signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(username, password, rememberMe);
      if (error) {
        setErrorMsg(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-bg text-text">
      {/* Cột trái: Nền lưới chấm bi + Icon tìm kiếm di chuyển mượt mà */}
      <LoginHeroPanel />

      {/* Cột phải: Form đăng nhập + Nút đổi Sáng/Tối */}
      <div className="relative flex flex-col justify-center items-center p-6 sm:p-10 bg-bg">
        {/* Nút đổi Sáng / Tối góc trên phải */}
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-5 right-5 w-9 h-9 rounded-[8px] flex items-center justify-center text-subtle hover:text-text hover:bg-row-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg transition-colors"
          title={`Chuyển sang chế độ ${theme === 'dark' ? 'sáng' : 'tối'}`}
        >
          {theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px]" strokeWidth={1.8} />
          ) : (
            <Moon className="w-[18px] h-[18px]" strokeWidth={1.8} />
          )}
        </button>

        {/* Logo hiển thị trên mobile */}
        <div className="flex lg:hidden items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-[10px] bg-ai-bg border border-ai-border flex items-center justify-center text-ai-text">
            <Box className="w-[18px] h-[18px]" strokeWidth={1.8} />
          </div>
          <span className="text-[16px] font-semibold text-text">Nexus Prod</span>
        </div>

        <div className="w-full max-w-[380px] space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-[24px] font-bold text-text tracking-[-0.02em]">
              Đăng nhập
            </h2>
            <p className="text-[13px] text-muted-text">
              Dùng tài khoản Admin đã cấp cho bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên đăng nhập */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-username"
                className="block text-[13px] font-medium text-text"
              >
                Tên đăng nhập
              </label>
              <div className="relative">
                <User
                  className="w-[16px] h-[16px] absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                  strokeWidth={1.8}
                />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  autoComplete="username"
                  autoFocus
                  required
                  className="w-full h-11 bg-surface border border-[var(--border)] hover:border-[var(--border-strong)] rounded-[10px] pl-10 pr-3.5 text-[13.5px] text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg transition-colors"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-[13px] font-medium text-text"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <Lock
                  className="w-[16px] h-[16px] absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                  strokeWidth={1.8}
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  required
                  className="w-full h-11 bg-surface border border-[var(--border)] hover:border-[var(--border-strong)] rounded-[10px] pl-10 pr-10 text-[13.5px] text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[8px] flex items-center justify-center text-subtle hover:text-text transition-colors"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="w-[16px] h-[16px]" strokeWidth={1.8} />
                  ) : (
                    <Eye className="w-[16px] h-[16px]" strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>

            {/* Ghi nhớ đăng nhập */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-0.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-[4px] border-[var(--border-strong)] accent-primary cursor-pointer"
              />
              <span className="text-[13px] text-muted-text">
                Ghi nhớ đăng nhập trên máy này
              </span>
            </label>

            {/* Thông báo lỗi đăng nhập */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-[10px] bg-pdf-bg border border-pdf-border text-pdf-text text-[12.5px]">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Nút Đăng nhập chính */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-[10px] bg-primary hover:brightness-110 text-on-primary text-[14px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50"
            >
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-[12px] text-subtle pt-1">
            Quên mật khẩu hoặc chưa có tài khoản? Liên hệ Admin.
          </p>
        </div>
      </div>
    </div>
  );
};
