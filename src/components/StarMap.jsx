import React, { useRef, useEffect, useState } from "react";
import { equatorialToHorizontal } from "../utils/astro";
import constellationLines from "../../public/constellations.lines.json";

// 工具函数：RA字符串转度
function raToDeg(raStr) {
  if (!raStr) return 0;
  const [h, m, s] = raStr.split(":").map(Number);
  return (h + m / 60 + s / 3600) * 15;
}
// 工具函数：DEC字符串转度
function decToDeg(decStr) {
  if (!decStr) return 0;
  const sign = decStr[0] === '-' ? -1 : 1;
  const [d, m, s] = decStr.replace("+", "").replace("-", "").split(":").map(Number);
  return sign * (d + m / 60 + s / 3600);
}

function getStarColor(type) {
  if (!type) return "#fff";
  const t = type[0].toUpperCase();
  switch (t) {
    case "O": return "#bfcfff";
    case "B": return "#c8d8ff";
    case "A": return "#e0e7ff";
    case "F": return "#fff";
    case "G": return "#fff7e0";
    case "K": return "#ffe2b0";
    case "M": return "#ffe0a8";
    default: return "#fff";
  }
}

function hexToRgba(hex, alpha) {
  // 支持 #rgb, #rrggbb
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const StarMap = ({ stars, lat, lon, date, showConstellations = true, brightness = 2, starSize = 1.5 }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [prevLat, setPrevLat] = useState(lat);
  const [prevLon, setPrevLon] = useState(lon);
  const [prevDate, setPrevDate] = useState(date);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const [displaySize, setDisplaySize] = useState(800);

  // 画布尺寸配置
  const CANVAS_SIZE = 2000; // 实际绘制分辨率

  // 响应式监听窗口大小
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const size = Math.min(containerRef.current.offsetWidth, window.innerHeight * 0.7, 800);
        setDisplaySize(size);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 计算两个时间之间的星空角度差
  const getStarAngleDifference = (date1, date2) => {
    // 提取时间部分（小时、分钟、秒）
    const time1 = date1.getHours() * 3600 + date1.getMinutes() * 60 + date1.getSeconds();
    const time2 = date2.getHours() * 3600 + date2.getMinutes() * 60 + date2.getSeconds();
    
    // 计算日期差（天数）
    const day1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const day2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    const daysDiff = (day2 - day1) / (24 * 60 * 60 * 1000);
    
    // 计算时间差（秒）
    let timeDiff = time2 - time1;
    
    // 如果时间差超过12小时，选择相反方向
    if (Math.abs(timeDiff) > 12 * 3600) {
      timeDiff = timeDiff > 0 ? timeDiff - 24 * 3600 : timeDiff + 24 * 3600;
    }
    
    // 将时间差转换为角度（每小时15度）
    const angleFromTime = (timeDiff / 3600) * 15;
    
    // 计算日期差导致的角度变化（每天约1度）
    const angleFromDays = daysDiff * 1;
    
    // 返回总角度差
    return angleFromTime + angleFromDays;
  };

  const drawStarMap = (progress = 1) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 设置星空背景
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, "#0b1a3c"); // 中心颜色
    gradient.addColorStop(1, "#1a1a2e"); // 边缘颜色
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 创建圆形裁剪区域
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    ctx.clip();

    // 计算当前动画状态下的位置
    const currentLat = prevLat + (lat - prevLat) * progress;
    const currentLon = prevLon + (lon - prevLon) * progress;
    
    // 计算角度差并创建新的时间
    const angleDiff = getStarAngleDifference(prevDate, date);
    const angleProgress = angleDiff * progress;
    
    // 创建新的时间对象，只调整时间部分
    const currentDate = new Date(prevDate);
    const timeAdjustment = (angleProgress / 15) * 3600 * 1000;
    currentDate.setTime(prevDate.getTime() + timeAdjustment);

    // 绘制星座连线
    if (showConstellations) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // 更亮的白色
      ctx.lineWidth = 1.5;
      
      constellationLines.features.forEach(constellation => {
        const lines = constellation.geometry.coordinates;
        lines.forEach(line => {
          ctx.beginPath();
          line.forEach((point, index) => {
            const [ra, dec] = point;
            const { alt, az } = equatorialToHorizontal(ra, dec, currentLat, currentLon, currentDate);
            
            if (alt > 0) {
              const r = (90 - alt) * (canvas.width / 2 - 10) / 90;
              const theta = (270 - az) * Math.PI / 180;
              const x = canvas.width / 2 + r * Math.cos(theta);
              const y = canvas.height / 2 + r * Math.sin(theta);
              
              if (index === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
          });
          ctx.stroke();
        });
      });
    }

    // 绘制星星
    stars.forEach(star => {
      const ra = star.ra !== undefined ? star.ra : raToDeg(star.RA);
      const dec = star.dec !== undefined ? star.dec : decToDeg(star.DEC);
      const mag = star.mag !== undefined ? star.mag : parseFloat(star.MAG);

      if (mag > 5.5) return;

      const { alt, az } = equatorialToHorizontal(ra, dec, currentLat, currentLon, currentDate);
      if (alt > 0) {
        const r = (90 - alt) * (canvas.width / 2 - 10) / 90;
        const theta = (270 - az) * Math.PI / 180;
        const x = canvas.width / 2 + r * Math.cos(theta);
        const y = canvas.height / 2 + r * Math.sin(theta);
        const size = Math.max(1.2, 6.0 * Math.exp(-0.35 * mag)) * starSize; // 星星整体变大

        const spectral = star.SpectralCls || star["Title HD"] || "";
        const color = getStarColor(spectral);
        ctx.save();
        // 1. 绘制径向渐变光晕
        const glowRadius = size * 3.5; // 光晕半径
        const grad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        grad.addColorStop(0, hexToRgba(color, 0.45)); // 中心较亮
        grad.addColorStop(0.4, hexToRgba(color, 0.18));
        grad.addColorStop(1, hexToRgba(color, 0)); // 边缘透明
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.globalAlpha = 1.0;
        ctx.fill();
        // 2. 绘制星星本体
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(1.0, 1.7 - mag * 0.13) * brightness * 1.1;
        ctx.fill();
        ctx.restore();
      }
    });

    ctx.restore(); // 恢复裁剪区域
  };

  useEffect(() => {
    if (lat !== prevLat || lon !== prevLon || date.getTime() !== prevDate.getTime()) {
      setIsAnimating(true);
      let startTime = null;
      const duration = 2000; // 动画持续时间2秒

      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // 使用缓动函数使动画更自然
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        drawStarMap(easeProgress);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setPrevLat(lat);
          setPrevLon(lon);
          setPrevDate(date);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      drawStarMap(1);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stars, lat, lon, date, showConstellations, brightness]);

  // 下载图片函数
  const downloadImage = (withBackground = true) => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_SIZE;
    tempCanvas.height = CANVAS_SIZE;
    const tempCtx = tempCanvas.getContext('2d');

    // 清除画布
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 如果需要背景，则绘制背景
    if (withBackground) {
      const gradient = tempCtx.createRadialGradient(
        tempCanvas.width / 2,
        tempCanvas.height / 2,
        0,
        tempCanvas.width / 2,
        tempCanvas.height / 2,
        tempCanvas.width / 2
      );
      gradient.addColorStop(0, "#0b1a3c");
      gradient.addColorStop(1, "#1a1a2e");
      tempCtx.fillStyle = gradient;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    // 创建圆形裁剪区域
    tempCtx.save();
    tempCtx.beginPath();
    tempCtx.arc(tempCanvas.width / 2, tempCanvas.height / 2, tempCanvas.width / 2, 0, Math.PI * 2);
    tempCtx.clip();

    // 重新绘制星星和星座连线
    const currentDate = new Date(date);
    
    // 绘制星座连线
    if (showConstellations) {
      tempCtx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      tempCtx.lineWidth = 1.5;
      
      constellationLines.features.forEach(constellation => {
        const lines = constellation.geometry.coordinates;
        lines.forEach(line => {
          tempCtx.beginPath();
          line.forEach((point, index) => {
            const [ra, dec] = point;
            const { alt, az } = equatorialToHorizontal(ra, dec, lat, lon, currentDate);
            
            if (alt > 0) {
              const r = (90 - alt) * (tempCanvas.width / 2 - 10) / 90;
              const theta = (270 - az) * Math.PI / 180;
              const x = tempCanvas.width / 2 + r * Math.cos(theta);
              const y = tempCanvas.height / 2 + r * Math.sin(theta);
              
              if (index === 0) {
                tempCtx.moveTo(x, y);
              } else {
                tempCtx.lineTo(x, y);
              }
            }
          });
          tempCtx.stroke();
        });
      });
    }

    // 绘制星星
    stars.forEach(star => {
      const ra = star.ra !== undefined ? star.ra : raToDeg(star.RA);
      const dec = star.dec !== undefined ? star.dec : decToDeg(star.DEC);
      const mag = star.mag !== undefined ? star.mag : parseFloat(star.MAG);

      if (mag > 5.5) return;

      const { alt, az } = equatorialToHorizontal(ra, dec, lat, lon, currentDate);
      if (alt > 0) {
        const r = (90 - alt) * (tempCanvas.width / 2 - 10) / 90;
        const theta = (270 - az) * Math.PI / 180;
        const x = tempCanvas.width / 2 + r * Math.cos(theta);
        const y = tempCanvas.height / 2 + r * Math.sin(theta);
        const size = Math.max(1.2, 6.0 * Math.exp(-0.35 * mag)) * starSize;

        const spectral = star.SpectralCls || star["Title HD"] || "";
        const color = getStarColor(spectral);
        tempCtx.save();
        // 1. 绘制径向渐变光晕
        const glowRadius = size * 3.5;
        const grad = tempCtx.createRadialGradient(x, y, 0, x, y, glowRadius);
        grad.addColorStop(0, hexToRgba(color, 0.45));
        grad.addColorStop(0.4, hexToRgba(color, 0.18));
        grad.addColorStop(1, hexToRgba(color, 0));
        tempCtx.beginPath();
        tempCtx.arc(x, y, glowRadius, 0, 2 * Math.PI);
        tempCtx.fillStyle = grad;
        tempCtx.globalAlpha = 1.0;
        tempCtx.fill();
        // 2. 绘制星星本体
        tempCtx.beginPath();
        tempCtx.arc(x, y, size, 0, 2 * Math.PI);
        tempCtx.fillStyle = color;
        tempCtx.globalAlpha = Math.max(1.0, 1.7 - mag * 0.13) * brightness * 1.1;
        tempCtx.fill();
        tempCtx.restore();
      }
    });

    tempCtx.restore();

    // 创建下载链接
    const link = document.createElement('a');
    link.download = `starmap_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = tempCanvas.toDataURL('image/png', 1.0);
    link.click();
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '900px', margin: '20px auto', backgroundColor: 'transparent', borderRadius: '50%', padding: '10px' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          width: `${displaySize}px`,
          height: `${displaySize}px`,
          border: "none",
          background: "transparent",
          transition: "transform 0.3s ease-out",
          imageRendering: "pixelated",
          display: 'block',
          margin: '0 auto',
          borderRadius: '50%'
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px',
        borderRadius: '4px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => downloadImage(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#d1d1e9',
              color: '#0b1a3c',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}
          >
            下载当前星图
          </button>
          <button
            onClick={() => downloadImage(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#d1d1e9',
              color: '#0b1a3c',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}
          >
            下载星图（透明底）
          </button>
        </div>
      </div>
    </div>
  );
};

export default StarMap; 