import React, { useState, useEffect } from "react";
import StarMap from "./components/StarMap";
import TimeLocationInput from "./components/TimeLocationInput";

function App() {
  const [stars, setStars] = useState([]);
  const [lat, setLat] = useState(31.23); // 默认上海
  const [lon, setLon] = useState(121.47);
  const [date, setDate] = useState(new Date());
  const [showConstellations, setShowConstellations] = useState(true);
  const [location, setLocation] = useState("上海");

  useEffect(() => {
    // 加载星表数据
    fetch("/stars.json").then(res => res.json()).then(setStars);
  }, []);

  const searchLocation = async (query) => {
    if (!query) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        setLat(parseFloat(result.lat));
        setLon(parseFloat(result.lon));
        setLocation(result.display_name.split(",")[0]);
      }
    } catch (error) {
      console.error("搜索地点时出错:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchLocation(location);
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleLocationChange = (newLat, newLon) => {
    setLat(newLat);
    setLon(newLon);
  };

  return (
    <div style={{background: "linear-gradient(to bottom, #0b1a3c, #1a1a2e)", minHeight: "100vh", color: "#d1d1e9", textAlign: "center", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
      <h1 style={{color: "#d1d1e9", fontSize: "2em", marginBottom: "20px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"}}>星空图生成器</h1>
      <div style={{marginBottom: 20, display: "flex", flexDirection: "column", gap: "15px", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)", padding: "15px", borderRadius: "15px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"}}>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入地点名称（如：北京）"
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            background: "rgba(255, 255, 255, 0.1)",
            color: "#d1d1e9",
            width: "220px",
            fontSize: "14px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            marginBottom: "10px"
          }}
        />
        <TimeLocationInput 
          date={date}
          lat={lat}
          lon={lon}
          onDateChange={handleDateChange}
          onLocationChange={handleLocationChange}
        />
      </div>

      <StarMap
        stars={stars}
        lat={lat}
        lon={lon}
        date={date}
        showConstellations={showConstellations}
        brightness={2}
        starSize={1.5}
      />
    </div>
  );
}

export default App; 