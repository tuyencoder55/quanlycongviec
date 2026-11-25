import React, { useEffect, useRef } from 'react';
import { Box, Search } from 'lucide-react';
import { useTheme } from '../../../components/theme-provider';

/**
 * Cột trái trang Đăng nhập:
 * - Nền lưới chấm bi (dot matrix) phát sáng theo quỹ đạo mượt mà 60fps
 * - Icon kính lúp tìm kiếm di chuyển xung quanh tự nhiên (có phản hồi nhẹ theo chuột)
 * - Hỗ trợ đồng bộ cả Dark và Light mode
 */
export const LoginHeroPanel: React.FC = () => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const lens = lensRef.current;
    if (!container || !canvas || !lens) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    let width = 0;
    let height = 0;
    let animationFrameId = 0;

    // Vị trí thực tế hiện tại của tâm kính lúp (dùng lerp để cực mượt)
    let curX = 0;
    let curY = 0;
    let pointerX: number | null = null;
    let pointerY: number | null = null;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (curX === 0 && curY === 0) {
        curX = width * 0.56;
        curY = height * 0.72;
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      pointerX = null;
      pointerY = null;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    const startTime = performance.now();
    const DOT_GAP = 24;
    const GLOW_RADIUS = 185;

    const render = (now: number) => {
      const t = (now - startTime) * 0.001;

      // Quỹ đạo Lissajous tự nhiên, uốn lượn mượt mà khắp khung trái
      const autoX =
        width * (0.52 + 0.31 * Math.sin(t * 0.42) + 0.08 * Math.cos(t * 0.87));
      const autoY =
        height * (0.56 + 0.27 * Math.sin(t * 0.33 + 1.2) + 0.07 * Math.cos(t * 0.71));

      const targetX = pointerX !== null ? pointerX : autoX;
      const targetY = pointerY !== null ? pointerY : autoY;

      // Nội suy mượt (lerp) giúp chuyển động êm ái không bị giật
      curX += (targetX - curX) * 0.055;
      curY += (targetY - curY) * 0.055;

      // Cập nhật vị trí kính lúp tìm kiếm trực tiếp qua GPU transform
      lens.style.transform = `translate3d(${curX - 24}px, ${curY - 24}px, 0)`;

      ctx.clearRect(0, 0, width, height);

      // 1. Vầng sáng tỏa dịu quanh kính lúp
      const halo = ctx.createRadialGradient(curX, curY, 6, curX, curY, GLOW_RADIUS);
      if (isDark) {
        halo.addColorStop(0, 'rgba(99, 114, 255, 0.22)');
        halo.addColorStop(0.45, 'rgba(75, 91, 245, 0.08)');
        halo.addColorStop(1, 'rgba(75, 91, 245, 0)');
      } else {
        halo.addColorStop(0, 'rgba(75, 91, 245, 0.16)');
        halo.addColorStop(0.5, 'rgba(75, 91, 245, 0.05)');
        halo.addColorStop(1, 'rgba(75, 91, 245, 0)');
      }
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(curX, curY, GLOW_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // 2. Vẽ lưới chấm bi: chấm gần kính lúp sẽ sáng xanh và phóng nhẹ
      const offsetX = (width % DOT_GAP) / 2;
      const offsetY = (height % DOT_GAP) / 2;

      for (let gx = offsetX; gx <= width; gx += DOT_GAP) {
        for (let gy = offsetY; gy <= height; gy += DOT_GAP) {
          const dx = gx - curX;
          const dy = gy - curY;
          const dist = Math.hypot(dx, dy);

          if (dist < GLOW_RADIUS) {
            const factor = Math.pow(1 - dist / GLOW_RADIUS, 1.75);
            const radius = 1.3 + factor * 1.45;
            if (isDark) {
              const alpha = 0.12 + factor * 0.85;
              ctx.fillStyle = `rgba(148, 163, 255, ${alpha.toFixed(3)})`;
            } else {
              const alpha = 0.13 + factor * 0.72;
              ctx.fillStyle = `rgba(75, 91, 245, ${alpha.toFixed(3)})`;
            }
            ctx.beginPath();
            ctx.arc(gx, gy, radius, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = isDark
              ? 'rgba(255, 255, 255, 0.095)'
              : 'rgba(31, 29, 26, 0.105)';
            ctx.beginPath();
            ctx.arc(gx, gy, 1.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="hidden lg:flex relative flex-col justify-between p-10 xl:p-14 bg-track/60 dark:bg-surface border-r border-[var(--border)] overflow-hidden select-none"
    >
      {/* Canvas lưới chấm bi phát sáng 60fps */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Vòng kính lúp tìm kiếm di chuyển mượt mà quanh vùng lưới chấm */}
      <div
        ref={lensRef}
        className="pointer-events-none absolute top-0 left-0 z-10 w-12 h-12 rounded-full flex items-center justify-center border border-primary/55 bg-primary/10 backdrop-blur-[1.5px] shadow-[0_0_28px_rgba(75,91,245,0.45)] will-change-transform"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      >
        <span className="absolute inset-0 rounded-full border border-primary/35 animate-ping [animation-duration:2.8s]" />
        <Search
          className="w-[18px] h-[18px] text-primary dark:text-dot-board"
          strokeWidth={2}
        />
      </div>

      {/* Logo trên cùng */}
      <div className="relative z-20 flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-ai-bg border border-ai-border flex items-center justify-center text-ai-text">
          <Box className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </div>
        <span className="text-[15px] font-semibold text-text tracking-[-0.01em]">
          Nexus Prod
        </span>
      </div>

      {/* Khẩu hiệu chính giữa với 3 màu nhấn bảng, khuôn, PO */}
      <div className="relative z-20 max-w-md space-y-2">
        <h1 className="text-[40px] xl:text-[46px] font-bold text-text leading-[1.15] tracking-[-0.03em]">
          <span className="block">Tra cứu xuất</span>
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-1.5">
            <span className="px-2.5 py-0.5 rounded-[10px] bg-tag-board-bg text-dot-board">
              bảng,
            </span>
            <span className="px-2.5 py-0.5 rounded-[10px] bg-emerald-500/10 text-dot-mold">
              khuôn,
            </span>
            <span className="px-2.5 py-0.5 rounded-[10px] bg-tag-po-bg text-dot-po">
              PO
            </span>
          </span>
        </h1>
      </div>

      {/* Ghi chú chân trang */}
      <div className="relative z-20 text-[12px] text-subtle">
        Hệ thống nội bộ. Tài khoản do Admin cấp.
      </div>
    </div>
  );
};
