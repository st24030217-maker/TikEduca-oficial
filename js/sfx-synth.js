// TikEduca 2.0 Web Audio API Sound Effects Synthesizer
(function() {
  let audioCtx = null;
  let isSoundEnabled = localStorage.getItem("tikeduca_sound") === "true";

  // Synthesizer Functions
  function playSynthesizedSound(type) {
    if (!isSoundEnabled) return;
    
    try {
      // Lazy initialize AudioContext on user interaction
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const dest = audioCtx.destination;

      if (type === "hover") {
        // Fast neon electronic chirp
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(dest);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.04);
        
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        
        osc.start(now);
        osc.stop(now + 0.04);
      } 
      else if (type === "click") {
        // High-tech digital click
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(dest);
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(150, now + 0.015);
        
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
        
        osc.start(now);
        osc.stop(now + 0.025);
      } 
      else if (type === "modalOpen") {
        // Cyber low riser / futuristic swoosh
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.2);
        
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(250, now);
        filter.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
      } 
      else if (type === "modalClose") {
        // Descending cyber drop
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(dest);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
        
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        
        osc.start(now);
        osc.stop(now + 0.18);
      }
      else if (type === "success") {
        // Premium ascending chord
        const playTone = (freq, delay, dur, vol) => {
          const oscNode = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscNode.connect(gainNode);
          gainNode.connect(dest);
          
          oscNode.type = "triangle";
          oscNode.frequency.setValueAtTime(freq, now + delay);
          gainNode.gain.setValueAtTime(0, now + delay);
          gainNode.gain.linearRampToValueAtTime(vol, now + delay + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
          
          oscNode.start(now + delay);
          oscNode.stop(now + delay + dur);
        };
        playTone(440, 0.0, 0.35, 0.02);   // A4
        playTone(554.37, 0.05, 0.35, 0.02); // C#5
        playTone(659.25, 0.1, 0.35, 0.02);  // E5
        playTone(880, 0.15, 0.45, 0.02);    // A5
      }
    } catch(e) {
      console.warn("Audio Context error:", e);
    }
  }

  // Bind Audio Triggers to UI Elements using Event Delegation
  function setupSoundEventListeners() {
    const targetSelector = 'a, button, [onclick], input, select, textarea, .room-card, .ponente-card, .ticket-btn';
    
    // Hover event delegation (using mouseover)
    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest(targetSelector);
      if (target) {
        if (target.dataset.soundHovered === "true") return;
        target.dataset.soundHovered = "true";
        playSynthesizedSound("hover");
        
        // Remove tracking attribute on mouseleave
        target.addEventListener("mouseleave", () => {
          target.removeAttribute("data-sound-hovered");
        }, { once: true });
      }
    }, { passive: true });

    // Click event delegation
    document.addEventListener("mousedown", (e) => {
      const target = e.target.closest(targetSelector);
      if (target) {
        // Specific sound cues
        const clickText = target.textContent || "";
        const onclickAttr = target.getAttribute("onclick") || "";
        
        if (target.tagName === "BUTTON" && (clickText.includes("REVELAR") || clickText.includes("ÚNETE") || onclickAttr.includes("open"))) {
          playSynthesizedSound("modalOpen");
        } else if (onclickAttr.includes("close") || clickText.includes("✕")) {
          playSynthesizedSound("modalClose");
        } else {
          playSynthesizedSound("click");
        }
      }
    }, { passive: true });
  }

  // Success Sounds on Registration completes
  window.triggerSuccessSound = function() {
    playSynthesizedSound("success");
  };

  // Toggle Function
  window.toggleSoundMode = function() {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem("tikeduca_sound", isSoundEnabled);
    updateSoundUI();
    
    // Unlock Audio Context on first enable click
    if (isSoundEnabled && !audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Play a click confirmation sound
    if (isSoundEnabled) {
      playSynthesizedSound("success");
    }
  };

  function updateSoundUI() {
    const btn = document.getElementById("btnSoundToggle");
    if (!btn) return;
    if (isSoundEnabled) {
      btn.className = btn.className.replace("sound-inactive", "sound-active");
      btn.title = "Desactivar Sonido";
    } else {
      btn.className = btn.className.replace("sound-active", "sound-inactive");
      btn.title = "Activar Sonido";
    }
  }

  // Document Ready Setup
  document.addEventListener("DOMContentLoaded", () => {
    updateSoundUI();
    setupSoundEventListeners();
    
    // Intercept modal open/close actions globally
    const originalOpenModal = window.openSpeakerModal;
    if (originalOpenModal) {
      window.openSpeakerModal = function(...args) {
        playSynthesizedSound("modalOpen");
        originalOpenModal.apply(this, args);
      };
    }

    const originalCloseModal = window.closeSpeakerModal;
    if (originalCloseModal) {
      window.closeSpeakerModal = function(...args) {
        playSynthesizedSound("modalClose");
        originalCloseModal.apply(this, args);
      };
    }

    const originalOpenHotel = window.openHotelModal;
    if (originalOpenHotel) {
      window.openHotelModal = function(...args) {
        playSynthesizedSound("modalOpen");
        originalOpenHotel.apply(this, args);
      };
    }
    
    const originalCloseHotel = window.closeHotelModal;
    if (originalCloseHotel) {
      window.closeHotelModal = function(...args) {
        playSynthesizedSound("modalClose");
        originalCloseHotel.apply(this, args);
      };
    }

    // Unlock AudioContext on body click
    document.body.addEventListener("click", () => {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
    }, { once: true, passive: true });
  });
})();
