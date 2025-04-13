        // Morse code dictionary
        const morseCode = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
            'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
            'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
            'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
            'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
            'Z': '--..',
            '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
            '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
            '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', 
            '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
            '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
            '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
            '$': '...-..-', '@': '.--.-.', ' ': '/'
        };

        // Reverse Morse code dictionary
        const reverseMorse = {};
        for (const key in morseCode) {
            reverseMorse[morseCode[key]] = key;
        }

        // Audio context for playing Morse code
        let audioContext;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Web Audio API not supported');
        }

        // App state
        let isShiftOn = false;
        let isNumbersOn = false;
        let isDarkMode = false;
        let playSounds = true;
        let vibrateOnKeypress = true;
        let autoConvert = true;
        let conversionHistory = [];

        // Initialize app
        function init() {
            // Safely load settings from localStorage
            let settings = {};
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    const storedSettings = localStorage.getItem('morseSettings');
                    settings = storedSettings ? JSON.parse(storedSettings) : {};
                }
            } catch (e) {
                console.error('Error accessing localStorage:', e.message);
            }

            isDarkMode = settings.darkMode || false;
            playSounds = settings.sounds !== false;
            vibrateOnKeypress = settings.vibration !== false;
            autoConvert = settings.autoConvert !== false;
            
            // Safely load history from localStorage
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    const storedHistory = localStorage.getItem('morseHistory');
                    conversionHistory = storedHistory ? JSON.parse(storedHistory) : [];
                }
            } catch (e) {
                console.error('Error accessing localStorage:', e.message);
                conversionHistory = [];
            }
            
            // Apply settings
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
                document.getElementById('darkModeToggle').checked = true;
            }
            document.getElementById('soundToggle').checked = playSounds;
            document.getElementById('vibrationToggle').checked = vibrateOnKeypress;
            document.getElementById('autoConvertToggle').checked = autoConvert;
            
            // Set up event listeners
            setupEventListeners();
            
            // Update history display
            updateHistoryDisplay();
        }

        // Set up all event listeners
        function setupEventListeners() {
            // Keyboard keys
            document.querySelectorAll('.key:not(.special)').forEach(key => {
                key.addEventListener('click', handleKeyPress);
                key.addEventListener('mousedown', () => {
                    key.classList.add('active');
                    if (playSounds) playKeySound();
                    if (vibrateOnKeypress && navigator.vibrate) navigator.vibrate(30);
                });
                key.addEventListener('mouseup', () => key.classList.remove('active'));
                key.addEventListener('mouseleave', () => key.classList.remove('active'));
                key.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    key.classList.add('active');
                    if (playSounds) playKeySound();
                    if (vibrateOnKeypress && navigator.vibrate) navigator.vibrate(30);
                });
                key.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    key.classList.remove('active');
                    handleKeyPress({currentTarget: key});
                });
            });

            // Special keys
            document.getElementById('shiftKey').addEventListener('click', toggleShift);
            document.getElementById('numbersKey').addEventListener('click', toggleNumbers);
            document.getElementById('emojiKey').addEventListener('click', () => document.getElementById('emojiModal').style.display = 'flex');
            document.getElementById('morseRefKey').addEventListener('click', () => document.getElementById('morseReferenceModal').style.display = 'flex');
            document.getElementById('spaceKey').addEventListener('click', () => {
                insertAtCursor(' ');
                if (playSounds) playKeySound();
                if (vibrateOnKeypress && navigator.vibrate) navigator.vibrate(30);
            });
            document.getElementById('returnKey').addEventListener('click', () => {
                insertAtCursor('\n');
                if (playSounds) playKeySound();
                if (vibrateOnKeypress && navigator.vibrate) navigator.vibrate(30);
            });
            document.getElementById('backspaceKey').addEventListener('click', () => {
                deleteAtCursor();
                if (playSounds) playKeySound();
                if (vibrateOnKeypress && navigator.vibrate) navigator.vibrate(30);
            });

            // Conversion buttons
            document.getElementById('toMorseBtn').addEventListener('click', convertToMorse);
            document.getElementById('toTextBtn').addEventListener('click', convertToText);
            document.getElementById('playMorseBtn').addEventListener('click', playMorseCode);

            // Toolbar buttons
            document.getElementById('settingsBtn').addEventListener('click', () => document.getElementById('settingsModal').style.display = 'flex');
            document.getElementById('historyBtn').addEventListener('click', () => document.getElementById('historyModal').style.display = 'flex');

            // Text input events
            document.getElementById('textInput').addEventListener('input', () => {
                if (autoConvert) convertToMorse();
            });

            // Modal close buttons
            document.querySelectorAll('.close-modal').forEach(button => {
                button.addEventListener('click', () => {
                    button.closest('.modal').style.display = 'none';
                });
            });
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            });

            // Emoji selection
            document.querySelectorAll('.emoji').forEach(emoji => {
                emoji.addEventListener('click', () => {
                    insertAtCursor(emoji.textContent);
                    document.getElementById('emojiModal').style.display = 'none';
                });
            });

            // Settings toggles
            document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
            document.getElementById('soundToggle').addEventListener('change', toggleSounds);
            document.getElementById('vibrationToggle').addEventListener('change', toggleVibration);
            document.getElementById('autoConvertToggle').addEventListener('change', toggleAutoConvert);
        }

        // Handle key press
        function handleKeyPress(e) {
            const key = e.currentTarget;
            const char = isNumbersOn ? key.dataset.secondary : 
                        isShiftOn ? key.dataset.char.toUpperCase() : key.dataset.char;
            
            insertAtCursor(char);
            
            // Visual feedback
            key.classList.add('ripple');
            setTimeout(() => key.classList.remove('ripple'), 600);
            
            // Audio feedback
            if (playSounds) playKeySound();
            
            // Haptic feedback
            if (vibrateOnKeypress && navigator.vibrate) navigator.vibrate(30);
        }

        // Insert text at cursor position
        function insertAtCursor(text) {
            const textarea = document.getElementById('textInput');
            const startPos = textarea.selectionStart;
            const endPos = textarea.selectionEnd;
            const currentText = textarea.value;
            
            textarea.value = currentText.substring(0, startPos) + text + currentText.substring(endPos);
            textarea.selectionStart = textarea.selectionEnd = startPos + text.length;
            
            // Trigger input event for auto-conversion
            const event = new Event('input');
            textarea.dispatchEvent(event);
        }

        // Delete at cursor position
        function deleteAtCursor() {
            const textarea = document.getElementById('textInput');
            const startPos = textarea.selectionStart;
            const endPos = textarea.selectionEnd;
            const currentText = textarea.value;
            
            if (startPos === endPos && startPos > 0) {
                // Delete single character
                textarea.value = currentText.substring(0, startPos - 1) + currentText.substring(endPos);
                textarea.selectionStart = textarea.selectionEnd = startPos - 1;
            } else if (startPos !== endPos) {
                // Delete selection
                textarea.value = currentText.substring(0, startPos) + currentText.substring(endPos);
                textarea.selectionStart = textarea.selectionEnd = startPos;
            }
            
            // Trigger input event for auto-conversion
            const event = new Event('input');
            textarea.dispatchEvent(event);
        }

        // Toggle shift state
        function toggleShift() {
            isShiftOn = !isShiftOn;
            document.getElementById('shiftKey').classList.toggle('active');
            
            // Update key labels
            document.querySelectorAll('.key:not(.special)').forEach(key => {
                const charSpan = key.querySelector('span:not(.morse-code):not(.secondary-char)');
                if (charSpan) {
                    charSpan.textContent = isShiftOn ? 
                        key.dataset.char.toUpperCase() : 
                        key.dataset.char.toLowerCase();
                }
            });
            
            if (playSounds) playKeySound();
            if (vibrateOnKeypress && navigator.vibrate) navigator.vibrate(30);
        }

        // Toggle numbers/symbols state
        function toggleNumbers() {
            isNumbersOn = !isNumbersOn;
            document.getElementById('numbersKey').classList.toggle('active');
            
            // Update key labels visibility
            document.querySelectorAll('.key:not(.special)').forEach(key => {
                const charSpan = key.querySelector('span:not(.morse-code):not(.secondary-char)');
                const secondarySpan = key.querySelector('.secondary-char');
                
                if (isNumbersOn) {
                    charSpan.style.display = 'none';
                    secondarySpan.style.display = 'block';
                } else {
                    charSpan.style.display = 'block';
                    secondarySpan.style.display = 'none';
                }
            });
            
            if (playSounds) playKeySound();
            if (vibrateOnKeypress && navigator.vibrate) navigator.vibrate(30);
        }

        // Convert text to Morse code
        function convertToMorse() {
            const text = document.getElementById('textInput').value.toUpperCase();
            let morse = '';
            
            for (let char of text) {
                if (morseCode[char]) {
                    morse += morseCode[char] + ' ';
                } else if (char === '\n') {
                    morse += '\n';
                } else if (char === ' ') {
                    morse += '/ ';
                }
            }
            
            document.getElementById('morseOutput').value = morse.trim();
            addToHistory(text, morse.trim(), 'text-to-morse');
        }

        // Convert Morse code to text
        function convertToText() {
            const morse = document.getElementById('morseOutput').value.trim();
            const morseWords = morse.split(' / ');
            let text = '';
            
            for (let word of morseWords) {
                const letters = word.split(' ');
                for (let code of letters) {
                    if (reverseMorse[code]) {
                        text += reverseMorse[code];
                    }
                }
                text += ' ';
            }
            
            document.getElementById('textInput').value = text.trim();
            addToHistory(morse, text.trim(), 'morse-to-text');
        }

        // Play Morse code as audio
        function playMorseCode() {
            if (!audioContext) {
                alert('Audio not supported in your browser');
                return;
            }
            
            const morse = document.getElementById('morseOutput').value.trim();
            if (!morse) return;
            
            const playBtn = document.getElementById('playMorseBtn');
            playBtn.classList.add('pulse');
            playBtn.disabled = true;
            
            const dotLength = 0.1; // seconds
            let time = audioContext.currentTime;
            
            // Create oscillator and gain node
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 600;
            gainNode.gain.value = 0;
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            
            // Visualizer animation
            let visualizerInterval = setInterval(updateVisualizer, 100);
            
            // Parse Morse code and schedule sounds
            for (let char of morse) {
                switch (char) {
                    case '.': // Dot
                        gainNode.gain.setValueAtTime(1, time);
                        time += dotLength;
                        gainNode.gain.setValueAtTime(0, time);
                        time += dotLength;
                        break;
                        
                    case '-': // Dash
                        gainNode.gain.setValueAtTime(1, time);
                        time += dotLength * 3;
                        gainNode.gain.setValueAtTime(0, time);
                        time += dotLength;
                        break;
                        
                    case ' ': // Letter space
                        time += dotLength * 2;
                        break;
                        
                    case '/': // Word space
                        time += dotLength * 4;
                        break;
                        
                    case '\n': // New line
                        time += dotLength * 6;
                        break;
                }
            }
            
            // Stop oscillator when done
            setTimeout(() => {
                oscillator.stop();
                clearInterval(visualizerInterval);
                resetVisualizer();
                playBtn.classList.remove('pulse');
                playBtn.disabled = false;
            }, (time - audioContext.currentTime) * 1000);
        }

        // Update audio visualizer
        function updateVisualizer() {
            document.querySelectorAll('.visualizer-bar').forEach(bar => {
                const randomHeight = Math.floor(Math.random() * 20) + 5;
                bar.style.height = `${randomHeight}px`;
                bar.style.opacity = Math.random() * 0.5 + 0.5;
            });
        }

        // Reset audio visualizer
        function resetVisualizer() {
            document.querySelectorAll('.visualizer-bar').forEach(bar => {
                bar.style.height = '2px';
                bar.style.opacity = '0.3';
            });
        }

        // Play key press sound
        function playKeySound() {
            if (!audioContext) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 300 + Math.random() * 100;
            gainNode.gain.value = 0.1;
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
            oscillator.stop(audioContext.currentTime + 0.1);
        }

        // Toggle dark mode
        function toggleDarkMode() {
            isDarkMode = !isDarkMode;
            document.body.classList.toggle('dark-mode');
            saveSettings();
        }

        // Toggle key sounds
        function toggleSounds() {
            playSounds = !playSounds;
            saveSettings();
        }

        // Toggle vibration
        function toggleVibration() {
            vibrateOnKeypress = !vibrateOnKeypress;
            saveSettings();
        }

        // Toggle auto-conversion
        function toggleAutoConvert() {
            autoConvert = !autoConvert;
            saveSettings();
        }

        // Save settings to localStorage
        function saveSettings() {
            const settings = {
                darkMode: isDarkMode,
                sounds: playSounds,
                vibration: vibrateOnKeypress,
                autoConvert: autoConvert
            };
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.setItem('morseSettings', JSON.stringify(settings));
                }
            } catch (e) {
                console.error('Error saving to localStorage:', e.message);
            }
        }

        // Add conversion to history
        function addToHistory(input, output, type) {
            if (!input || !output) return;
            
            const timestamp = new Date().toLocaleString();
            conversionHistory = conversionHistory || [];
            conversionHistory.unshift({ input, output, type, timestamp });
            
            // Keep only the last 50 items
            if (conversionHistory.length > 50) {
                conversionHistory = conversionHistory.slice(0, 50);
            }
            
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.setItem('morseHistory', JSON.stringify(conversionHistory));
                }
            } catch (e) {
                console.error('Error saving history to localStorage:', e.message);
            }
            
            updateHistoryDisplay();
        }

        // Update history display
        function updateHistoryDisplay() {
            const historyList = document.getElementById('historyList');
            if (!historyList) return;
            
            historyList.innerHTML = '';
            
            if (!conversionHistory || conversionHistory.length === 0) {
                historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No history yet</p>';
                return;
            }
            
            conversionHistory.forEach(item => {
                if (!item) return;
                
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.style.padding = '10px';
                historyItem.style.borderBottom = '1px solid #eee';
                historyItem.style.cursor = 'pointer';
                
                const typeIcon = item.type === 'text-to-morse' ? 
                    '<i class="fas fa-arrow-down" style="color: var(--primary);"></i>' : 
                    '<i class="fas fa-arrow-up" style="color: var(--secondary);"></i>';
                
                historyItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <div>${typeIcon} ${item.type ? item.type.replace(/-/g, ' ') : ''}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${item.timestamp || ''}</div>
                    </div>
                    <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${item.input || ''}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${item.output || ''}
                    </div>
                `;
                
                historyItem.addEventListener('click', () => {
                    if (item.type === 'text-to-morse') {
                        document.getElementById('textInput').value = item.input || '';
                        document.getElementById('morseOutput').value = item.output || '';
                    } else {
                        document.getElementById('morseOutput').value = item.input || '';
                        document.getElementById('textInput').value = item.output || '';
                    }
                    document.getElementById('historyModal').style.display = 'none';
                });
                
                historyList.appendChild(historyItem);
            });
        }

        // Initialize the app
        document.addEventListener('DOMContentLoaded', init);
