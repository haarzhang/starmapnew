import React, { useEffect, useState } from "react";

const TimeLocationInput = ({ date, lat, lon, onDateChange, onLocationChange }) => {
  // 用于输入的原始字符串
  const [hourInput, setHourInput] = useState(date.getHours().toString());
  const [minuteInput, setMinuteInput] = useState(date.getMinutes().toString());

  // 外部date变化时同步输入框
  useEffect(() => {
    setHourInput(date.getHours().toString());
    setMinuteInput(date.getMinutes().toString());
  }, [date]);

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value + 'T' + hourInput.padStart(2, '0') + ':' + minuteInput.padStart(2, '0'));
    onDateChange(newDate);
  };

  // 失焦或回车时同步到date
  const syncTime = (newHour, newMinute) => {
    let h = parseInt(newHour);
    let m = parseInt(newMinute);
    if (isNaN(h) || h < 0 || h > 23) h = 0;
    if (isNaN(m) || m < 0 || m > 59) m = 0;
    const dateStr = date.toISOString().split('T')[0];
    const newDate = new Date(dateStr + 'T' + h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0'));
    onDateChange(newDate);
  };

  const handleHourChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 2) setHourInput(val);
  };
  const handleMinuteChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 2) setMinuteInput(val);
  };

  const handleLocationChange = (type, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    if (type === "lat") {
      if (numValue >= -90 && numValue <= 90) {
        onLocationChange(numValue, lon);
      }
    } else if (type === "lon") {
      if (numValue >= -180 && numValue <= 180) {
        onLocationChange(lat, numValue);
      }
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "10px",
        backgroundColor: "#16213e",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ minWidth: "60px", fontWeight: "bold", color: "#e0e0e0" }}>日期：</label>
          <input
            type="date"
            value={date.toISOString().split("T")[0]}
            onChange={handleDateChange}
            style={{ 
              padding: "10px",
              border: "1px solid #1a1a2e",
              borderRadius: "4px",
              fontSize: "14px",
              backgroundColor: "#0f3460",
              color: "#e0e0e0"
            }}
          />
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ minWidth: "60px", fontWeight: "bold", color: "#e0e0e0" }}>时间：</label>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <input
              type="text"
              value={hourInput}
              maxLength={2}
              onChange={handleHourChange}
              onBlur={() => syncTime(hourInput, minuteInput)}
              onKeyDown={e => { if (e.key === 'Enter') syncTime(hourInput, minuteInput); }}
              style={{ 
                width: "50px",
                padding: "10px",
                border: "1px solid #1a1a2e",
                borderRadius: "4px",
                textAlign: "center",
                fontSize: "14px",
                backgroundColor: "#0f3460",
                color: "#e0e0e0"
              }}
              placeholder="时"
            />
            <span style={{ fontSize: "16px", fontWeight: "bold", color: "#e0e0e0" }}>:</span>
            <input
              type="text"
              value={minuteInput}
              maxLength={2}
              onChange={handleMinuteChange}
              onBlur={() => syncTime(hourInput, minuteInput)}
              onKeyDown={e => { if (e.key === 'Enter') syncTime(hourInput, minuteInput); }}
              style={{ 
                width: "50px",
                padding: "10px",
                border: "1px solid #1a1a2e",
                borderRadius: "4px",
                textAlign: "center",
                fontSize: "14px",
                backgroundColor: "#0f3460",
                color: "#e0e0e0"
              }}
              placeholder="分"
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ minWidth: "60px", fontWeight: "bold", color: "#e0e0e0" }}>纬度：</label>
          <input
            type="number"
            value={lat}
            onChange={(e) => handleLocationChange("lat", e.target.value)}
            step="0.0001"
            style={{ 
              padding: "10px",
              border: "1px solid #1a1a2e",
              borderRadius: "4px",
              fontSize: "14px",
              backgroundColor: "#0f3460",
              color: "#e0e0e0"
            }}
          />
          <label style={{ minWidth: "60px", fontWeight: "bold", color: "#e0e0e0" }}>经度：</label>
          <input
            type="number"
            value={lon}
            onChange={(e) => handleLocationChange("lon", e.target.value)}
            step="0.0001"
            style={{ 
              padding: "10px",
              border: "1px solid #1a1a2e",
              borderRadius: "4px",
              fontSize: "14px",
              backgroundColor: "#0f3460",
              color: "#e0e0e0"
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TimeLocationInput; 