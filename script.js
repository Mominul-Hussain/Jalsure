document.addEventListener('DOMContentLoaded', function () {
  // ---------------------------------------
  // 1. Count-up Animation for Sensor Stats
  // ---------------------------------------
  const sensorsElement = document.getElementById('sensorsCount');
  const dirtyElement = document.getElementById('dirtyCount');
  const targetSensors = 50; // Total sensors deployed
  const targetDirty = 7;    // Total dirty water detections
  const duration = 2000;    // Animation duration in ms
  
  function countUp(element, start, target, duration) {
    const stepTime = 50; // update every 50ms
    const step = (target - start) / (duration / stepTime);
    const counter = setInterval(() => {
      start += step;
      if (start >= target) {
        element.textContent = target;
        clearInterval(counter);
      } else {
        element.textContent = Math.floor(start);
      }
    }, stepTime);
  }
  
  if (sensorsElement) countUp(sensorsElement, 0, targetSensors, duration);
  if (dirtyElement) countUp(dirtyElement, 0, targetDirty, duration);
  
  // ---------------------------------------
  // 2. Mobile Menu Toggle
  // ---------------------------------------
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.style.display = (navMenu.style.display === 'flex') ? 'none' : 'flex';
    });
  }
  
  // ---------------------------------------
  // 3. Meter Panel & Overlay Toggle
  // ---------------------------------------
  const marker = document.querySelector('.sensor-marker');
  const meterPanel = document.getElementById('meterPanel');
  const overlay = document.getElementById('overlay');
  if (marker && meterPanel && overlay) {
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      meterPanel.classList.add('open');
      overlay.classList.add('active');
    });
  
    // Clicking outside marker or meterPanel closes them
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.sensor-marker') && !e.target.closest('.meter-panel')) {
        marker.classList.remove('clicked');
        meterPanel.classList.remove('open');
        overlay.classList.remove('active');
      }
    });
  }
  
  // ---------------------------------------
  // 4. Gauge Update Functions
  // ---------------------------------------
  /**
   * Generic function to update a gauge's needle and numeric display.
   * Maps a value (0..maxValue) to an angle from -60° to +180° (a 240° sweep).
   *
   * @param {string} needleId  - ID of the needle <line> in the SVG.
   * @param {string} readingId - ID of the <text> element for the numeric reading.
   * @param {number} value     - Current reading.
   * @param {number} maxValue  - Maximum value for the gauge.
   * @param {string} unit      - Unit string to append (e.g., " NTU").
   */
  function setGaugeValue(needleId, readingId, value, maxValue, unit) {
    value = Math.max(0, Math.min(value, maxValue));
    const angle = -60 + (value / maxValue) * 240;
    const needle = document.getElementById(needleId);
    if (needle) needle.setAttribute('transform', `rotate(${angle},100,100)`);
    const readingText = document.getElementById(readingId);
    if (readingText) readingText.textContent = `${value}${unit}`;
  }
  
  /**
   * Updates the temperature gauge specifically.
   * Temperature is calibrated for 0°C to 100°C.
   * Zones:
   *   - Below 5°C: Yellow
   *   - 5°C to 25°C: Green
   *   - 25°C to 60°C: Yellow
   *   - Above 60°C: Red
   * Maps 0°C to -60° and 100°C to +180°.
   *
   * @param {number} valueC - Temperature in °C.
   */
  function setTemperatureGauge(valueC) {
    if (valueC < 0) valueC = 0;
    if (valueC > 100) valueC = 100;
    const angle = -60 + (valueC / 100) * 240;
    const needle = document.getElementById('needleTemperature');
    if (needle) needle.setAttribute('transform', `rotate(${angle},100,100)`);
    
    const readingText = document.getElementById('readingValueTemperature');
    if (readingText) readingText.textContent = `${valueC} °C`;
    
    // Update colors based on temperature zones
    if (needle && readingText) {
      if (valueC < 5) {
        // Below 5°C: Yellow
        needle.style.stroke = "#FFD600";
        readingText.style.fill = "#FFD600";
      } else if (valueC >= 5 && valueC <= 25) {
        // 5°C to 25°C: Green
        needle.style.stroke = "#4CAF50";
        readingText.style.fill = "#4CAF50";
      } else if (valueC > 25 && valueC <= 60) {
        // 25°C to 60°C: Yellow
        needle.style.stroke = "#FFD600";
        readingText.style.fill = "#FFD600";
      } else if (valueC > 60) {
        // Above 60°C: Red
        needle.style.stroke = "#f44336";
        readingText.style.fill = "#f44336";
      }
    }
  }
  
  // ---------------------------------------
  // 5. Example Usage: Update Gauges with Sample Data
  // ---------------------------------------
  // For turbidity gauge (e.g., 75 NTU out of a maximum of 160 NTU)
  setGaugeValue('needleTurbidity', 'readingValueTurbidity', 75, 160, ' NTU');
  
  // For temperature gauge (e.g., 23 °C)
  setTemperatureGauge(23);
  
  // In the future, integrate with real sensor data by calling these functions:
  // sensor.onUpdate((temp, turbidity) => {
  //    setTemperatureGauge(temp);
  //    setGaugeValue('needleTurbidity', 'readingValueTurbidity', turbidity, 160, ' NTU');
  // });

  // Start updates when the page loads
  startThingSpeakUpdates();
});

// Add this after your existing code in script.js
async function fetchThingSpeakData() {
  const channelID = '2851263'; // Replace with your ThingSpeak channel ID
  const apiKey = 'CQ0SIFEO2F7G16VT'; // Replace with your ThingSpeak read API key
  
  try {
    const response = await fetch(`https://api.thingspeak.com/channels/${channelID}/feeds/last.json?api_key=${apiKey}`);
    const data = await response.json();
    
    // Assuming field1 is temperature and field2 is turbidity
    const temperature = parseFloat(data.field1);
    const turbidity = parseFloat(data.field2);
    
    // Update the gauges with the new values
    setTemperatureGauge(temperature);
    setGaugeValue('needleTurbidity', 'readingValueTurbidity', turbidity, 160, ' NTU');
  } catch (error) {
    console.error('Error fetching ThingSpeak data:', error);
  }
}

// Update readings every 15 seconds
function startThingSpeakUpdates() {
  // Initial update
  fetchThingSpeakData();
  
  // Regular updates every 15 seconds
  setInterval(fetchThingSpeakData, 15000);
}
