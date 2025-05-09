// 计算儒略日
export function getJulianDate(date) {
  return date / 86400000 + 2440587.5;
}

// 计算格林尼治恒星时
export function getGMST(jd) {
  const d = jd - 2451545.0;
  let gmst = 18.697374558 + 24.06570982441908 * d;
  return (gmst % 24) * 15; // 转为度
}

// 赤道坐标转地平坐标
export function equatorialToHorizontal(ra, dec, lat, lon, date) {
  const jd = getJulianDate(date);
  const gmst = getGMST(jd);
  const lst = (gmst + lon) % 360; // 当地恒星时（度）
  const ha = ((lst - ra + 360) % 360) * Math.PI / 180; // 时角（弧度）
  const decRad = dec * Math.PI / 180;
  const latRad = lat * Math.PI / 180;

  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(ha);
  const alt = Math.asin(sinAlt);
  const cosAz = (Math.sin(decRad) - Math.sin(alt) * Math.sin(latRad)) / (Math.cos(alt) * Math.cos(latRad));
  let az = Math.acos(cosAz);
  if (Math.sin(ha) > 0) az = 2 * Math.PI - az;

  return {
    alt: alt * 180 / Math.PI, // 高度角
    az: az * 180 / Math.PI    // 方位角
  };
} 