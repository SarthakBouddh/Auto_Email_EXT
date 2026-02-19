console.log("Email Writer Extension - Content Script loaded");

/* ===================== CSS ===================== */

const style = document.createElement('style');
style.textContent = `
.ai-reply-button {
    position: absolute;
    background: white;
    border: 1px solid #dadce0;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0,0,0,.15);
    z-index: 9999;
    font-size: 14px;
    background-color: #0B57D0 !important;
    color: #ffffff !important;
}

.ai-reply-button:hover {
    background-color: #0B57D0 !important;
}

.ai-tone-menu {
    position: absolute;
    background: white;
    border: 1px solid #dadce0;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0,0,0,.15);
    z-index: 9999;
    font-size: 14px;
}

.ai-tone-menu div {
    padding: 8px 12px;
    cursor: pointer;
}

.ai-tone-menu div:hover {
    background: #f1f3f4;
}
`;
document.head.appendChild(style);

/* ===================== GLOBAL STATE ===================== */

let selectedTone = 'professional';
let purposeRequest;

/* ===================== BUTTON CREATORS ===================== */

function createAiButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-button';
    button.innerText = "Generate";
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
}


function createToneButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji hG T-I-atl L3 ai-tone-button';
    button.style.marginRight = '6px';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Select tone');

    const icon = document.createElement('div');
    icon.className = 'G-asx'; // Gmail arrow icon
    icon.style.transform = 'rotate(-90deg)'; // makes it look like send arrow

    button.appendChild(icon);

    return button;
}

function createToneMenu() {
    const menu = document.createElement('div');
    menu.className = 'ai-tone-menu';
    menu.innerHTML = `
        <div data-tone="professional">Professional</div>
        <div data-tone="friendly">Friendly</div>
        <div data-tone="casual">Casual</div>
        <div data-tone="formal">Formal</div>
    `;
    return menu;
}

/* ===================== EMAIL SUBJECT (FOR NEW COMPOSE) ===================== */

function getEmailSubject() {
    const subjectInput = document.querySelector('input[name="subjectbox"]');
    if (!subjectInput) {
        console.warn('Subject input not found');
        return null;
    }

    const subject = subjectInput.value.trim();
    console.log('Detected subject:', subject);

    return subject || null;
}


function askPurposeIfNeeded() {
    const context = getComposeContext();
    if (context !== 'NEW') return true;

    const subject = getEmailSubject();
    if (!subject) {
        alert('Please enter an email subject first');
        return false;
    }

    purposeRequest = subject;
    return true;
}



/* ===================== EMAIL CONTENT ===================== */

function getEmailContent() {
    const selectors = [
        '.a3s.aiL',
        '.ii.gt',
        '.h7',
        '.gs .a3s',
        '.gmail_quote', 
        '[role="presentation"]'
    ];

    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content && content.innerText.trim()) {
            console.log('Email content found with selector:', selector);
            return content.innerText.trim();
        }
    }
    console.error('No email content found');
    return null;
}

/* ===================== COMPOSE CONTEXT ===================== */

function getActiveComposeBox() {
    return (
        document.querySelector('.adn.ads div[contenteditable="true"]') ||
        document.querySelector('[role="dialog"] div[contenteditable="true"]') ||
        document.querySelector('div[contenteditable="true"][aria-label]')
    );
}



function getComposeContext() {

    // NEW compose MUST be checked FIRST
    if (
        document.querySelector('[role="dialog"]') &&
        !document.querySelector('.adn.ads')
    ) {
        return 'NEW';
    }

    // Reply / Forward inside thread
    if (document.querySelector('.adn.ads') &&
        (document.querySelector('.btC') ||
        document.querySelector('.aDh') ||
        document.querySelector('[role="toolbar"]'))) {
        return 'REPLY';
    }

    return null;
}

function resolveApiAndPayload() {
    const context = getComposeContext();

    if (!context) return null;

    if (context === 'REPLY') {
        const emailContent = getEmailContent();
        if (!emailContent) return null;

        return {
            url: 'https://auto-email-ext.onrender.com/api/email/reply',
            payload: {
                emailContent,
                tone: selectedTone
            }
        };
    }

    // NEW compose
    return {
        url: 'https://auto-email-ext.onrender.com/api/email/generate',
        payload: {
            purpose: purposeRequest,
            tone: selectedTone
        }
    };
}



/* ===================== TOOLBAR ===================== */

function findComposeToolbar() {
    const selectors = ['.btC', '.aDh', '[role="toolbar"]'];

    for (const selector of selectors) {
        const toolbar =
            document.querySelector('.adn.ads ' + selector) ||
            document.querySelector('[role="dialog"] ' + selector) ||
            document.querySelector(selector);

        if (toolbar) {
            console.log("Toolbar found:", selector);
            return toolbar;
        }
    }
    return null;
}

/* ===================== INJECT ===================== */

function injectButton() {

    const replyEditor =
        document.querySelector('.adn.ads [role="textbox"]') ||
        document.querySelector('[role="dialog"] [role="textbox"]') ||
        document.querySelector('.btC') ||
        document.querySelector('.aDh');

    if (!replyEditor) return;

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar not found, retrying...");
        return;
    }

    /* Remove old buttons */
    toolbar.querySelectorAll('.ai-reply-button, .ai-tone-button')
        .forEach(btn => btn.remove());

    /* Remove old menus */
    document.querySelectorAll('.ai-tone-menu').forEach(m => m.remove());

    const aiButton = createAiButton();
    const toneButton = createToneButton();
    const toneMenu = createToneMenu();
    toneMenu.style.display = 'none';

    /* ----- Tone Menu Logic ----- */

    toneButton.addEventListener('click', (e) => {
        e.stopPropagation();

        toneMenu.style.display =
            toneMenu.style.display === 'none' ? 'block' : 'none';

        const rect = toneButton.getBoundingClientRect();
        toneMenu.style.top = rect.bottom + window.scrollY + 'px';
        toneMenu.style.left = rect.left + window.scrollX + 'px';

    });

    toneMenu.addEventListener('click', (e) => {
        const tone = e.target.getAttribute('data-tone');
        if (!tone) return;

        selectedTone = tone;
        toneMenu.style.display = 'none';
    });

    document.body.appendChild(toneMenu);

    /* ----- AI Reply Logic ----- */

    aiButton.addEventListener('click', async () => {
        try {
            aiButton.innerText = 'Generating...';

            const canProceed = askPurposeIfNeeded();
            if (!canProceed) {
                alert("Email purpose is required to generate email");
                return;
            }

            const apiConfig = resolveApiAndPayload();
            if (!apiConfig) {
                alert("Please open a reply or compose window first");
                aiButton.innerText = 'Generate';
                return;
            }

            console.log("apiCOnfig: ", apiConfig);
            console.log("Sending request to API...");
            const response = await fetch(apiConfig.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiConfig.payload)
            });

            if (!response.ok) {
                throw new Error(`API error ${response.status}`);
            }

            const generatedText = await response.text();
            console.log('Generated text:', generatedText);

            const composeBox = document.querySelector('[role="textbox"]');
            console.log('Compose box:', composeBox);
            
            if (composeBox) {
               composeBox.focus(); 
               document.execCommand('insertText', false, generatedText);
            } else {
                console.error('Compose box not found');
            }
        } catch (err) {
            console.error(err);
            alert("Failed to generate AI email");
        } finally {
            aiButton.innerText = 'Generate';

            // Reset purpose after generation
            if (getComposeContext() === 'NEW') {
                purposeRequest = '';
            }
        }

    });

    const sendContainer =
        toolbar.querySelector('div[role="button"]')?.parentElement ||
        toolbar.querySelector('td div') ||
        toolbar.querySelector('div[role="button"]')?.closest('td');

    if (sendContainer) {
        sendContainer.insertBefore(toneButton, sendContainer.firstChild);
        sendContainer.insertBefore(aiButton, sendContainer.firstChild);
    } else {
        toolbar.insertBefore(aiButton, toolbar.firstChild || null);
        toolbar.insertBefore(toneButton, toolbar.firstChild || null);

    }
}

/* ===================== OBSERVER ===================== */

const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE
                && (node.matches('[role="dialog"]') ||
                    node.querySelector?.('[role="dialog"]') ||
                    node.matches('.adn.ads') ||
                    node.querySelector?.('.adn.ads') ||
                    node.matches('.btC') ||
                    node.querySelector?.('.btC'))) {
                {
                    setTimeout(() => {
                        injectButton();
                        setTimeout(injectButton, 1500);
                    }, 600);
                }
            }
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

/* ===================== INPUT TRIGGER ===================== */

document.addEventListener('input', (e) => {
    if (e.target.matches('[role="textbox"]')) {
        setTimeout(injectButton, 200);
    }
});

/* ===================== CLOSE MENU ON OUTSIDE CLICK ===================== */

document.addEventListener('click', (e) => {
    if (!e.target.closest('.ai-tone-menu') &&
        !e.target.closest('.ai-tone-button')) {
        document.querySelectorAll('.ai-tone-menu')
            .forEach(menu => menu.style.display = 'none');
    }
});

