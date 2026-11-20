// ===== PAGE ELEMENTS =====
const input = document.getElementById("password");
const toggle = document.getElementById("toggle");
const meterFill = document.getElementById("meter-fill");
const strengthLabel = document.getElementById("strength-label");
const checksList = document.getElementById("checks");

// ===== SHOW / HIDE BUTTON =====
toggle.addEventListener("click", function () {
    if (input.type === "password") {
        input.type = "text";
        toggle.textContent = "Hide";
    } else {
        input.type = "password";
        toggle.textContent = "Show";
    }
});

// ===== THE RULES =====
const rules = [
    { label: "At least 12 characters", test: function (p) { return p.length >= 12; } },
    { label: "A lowercase letter (a-z)", test: function (p) { return /[a-z]/.test(p); } },
    { label: "An uppercase letter (A-Z)", test: function (p) { return /[A-Z]/.test(p); } },
    { label: "A number (0-9)", test: function (p) { return /[0-9]/.test(p); } },
    { label: "A symbol (like ! @ # $)", test: function (p) { return /[^A-Za-z0-9]/.test(p); } }
];

// ===== COMMON PASSWORDS =====
// A short list of the most-used passwords. Real attackers try these first.
const commonPasswords = [
    "password", "123456", "123456789", "12345678", "12345", "1234567890",
    "qwerty", "qwerty123", "qwertyuiop", "abc123", "password1", "111111",
    "000000", "123123", "iloveyou", "admin", "admin123", "welcome", "welcome1",
    "letmein", "monkey", "dragon", "football", "baseball", "sunshine",
    "princess", "master", "login", "starwars", "whatever", "trustno1",
    "shadow", "superman", "hello", "freedom", "1q2w3e4r", "asdfghjkl", "zxcvbnm"
];

// Undo "leetspeak" so P@ssw0rd counts as password
function normalise(p) {
    return p.toLowerCase()
        .replace(/@/g, "a")
        .replace(/4/g, "a")
        .replace(/3/g, "e")
        .replace(/1/g, "i")
        .replace(/!/g, "i")
        .replace(/0/g, "o")
        .replace(/\$/g, "s")
        .replace(/5/g, "s")
        .replace(/7/g, "t");
}

function isCommon(p) {
    const lower = p.toLowerCase();
    // chop numbers/symbols off the end first (P@ssw0rd! -> p@ssw0rd)
    const core = lower.replace(/[^a-z]+$/, "");

    return commonPasswords.includes(lower) ||
           commonPasswords.includes(normalise(lower)) ||
           commonPasswords.includes(core) ||
           commonPasswords.includes(normalise(core));
}

// ===== PATTERN CHECKS =====
// Returns a list of warnings about predictable patterns
function findProblems(p) {
    const problems = [];
    if (p === "") return problems;

    const lower = p.toLowerCase();

    if (isCommon(p)) {
        problems.push("This is one of the most common passwords. Attackers try it first.");
    }

    // The same character 3 or more times in a row (aaa, 111)
    if (/(.)\1\1/.test(p)) {
        problems.push("Repeats the same character 3+ times (like aaa or 111)");
    }

    // Easy sequences like abc, 123, qwe (forwards or backwards)
    const sequences = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiop", "asdfghjkl", "zxcvbnm"];
    let hasSequence = false;
    sequences.forEach(function (seq) {
        const backwards = seq.split("").reverse().join("");
        for (let i = 0; i <= seq.length - 3; i++) {
            if (lower.includes(seq.slice(i, i + 3)) || lower.includes(backwards.slice(i, i + 3))) {
                hasSequence = true;
            }
        }
    });
    if (hasSequence) {
        problems.push("Contains an easy sequence (like abc, 123 or qwe)");
    }

    // A year like 1999 or 2026
    if (/(19|20)\d\d/.test(p)) {
        problems.push("Contains a year. Birth years and current years are easy to guess.");
    }

    return problems;
}

// ===== SCORING =====
function scorePassword(p) {
    let score = 0;
    rules.forEach(function (rule) {
        if (rule.test(p)) score++;
    });
    return score;
}

function getLevel(score) {
    if (score <= 2) return { name: "Weak", colour: "var(--bad)", width: 25, cls: "bad" };
    if (score === 3) return { name: "Fair", colour: "var(--warn)", width: 50, cls: "warn" };
    if (score === 4) return { name: "Good", colour: "var(--good)", width: 75, cls: "good" };
    return { name: "Strong", colour: "var(--good)", width: 100, cls: "good" };
}

// ===== UPDATE THE PAGE =====
function update() {
    const p = input.value;
    const problems = findProblems(p);

    // Warnings first, then the rule checklist
    let html = "";
    problems.forEach(function (msg) {
        html += `<li class="problem">⚠ ${msg}</li>`;
    });
    rules.forEach(function (rule) {
        const passed = rule.test(p);
        html += `<li class="${passed ? "pass" : ""}">${passed ? "✓" : "✗"} ${rule.label}</li>`;
    });
    checksList.innerHTML = html;

    if (p === "") {
        meterFill.style.width = "0";
        strengthLabel.textContent = "Start typing to check your password.";
        strengthLabel.className = "";
        return;
    }

    // Each pattern problem knocks a point off
    let score = scorePassword(p) - problems.length;
    if (score < 0) score = 0;

    let level = getLevel(score);

    // A common password is always very weak, no matter what
    if (isCommon(p)) {
        level = { name: "Very weak", colour: "var(--bad)", width: 8, cls: "bad" };
    }

    meterFill.style.width = level.width + "%";
    meterFill.style.background = level.colour;
    strengthLabel.textContent = "Strength: " + level.name;
    strengthLabel.className = level.cls;
}

input.addEventListener("input", update);
update();

// ===== TIME TO CRACK =====
const crackTimeText = document.getElementById("crack-time");

// How many different characters the password could be made from
function charsetSize(p) {
    let size = 0;
    if (/[a-z]/.test(p)) size += 26;
    if (/[A-Z]/.test(p)) size += 26;
    if (/[0-9]/.test(p)) size += 10;
    if (/[^A-Za-z0-9]/.test(p)) size += 33;
    return size;
}

// Rough number of seconds an attacker would need
function secondsToCrack(p) {
    // Common passwords are on every attacker's list
    if (isCommon(p)) return 0;

    // 10 billion guesses a second: a strong graphics card attacking a leaked password database
    const guessesPerSecond = 10000000000;

    // Every possible combination, e.g. 95 characters ^ 12 long
    const combinations = Math.pow(charsetSize(p), p.length);

    // On average, the right one is found halfway through
    let seconds = combinations / 2 / guessesPerSecond;

    // Each predictable pattern makes it about 1000x faster
    seconds = seconds / Math.pow(1000, findProblems(p).length);

    return seconds;
}

// "1 day" / "5 days"
function plural(n, word) {
    return n + " " + word + (n === 1 ? "" : "s");
}

// Turns seconds into words
function formatTime(seconds) {
    const minute = 60;
    const hour = 3600;
    const day = 86400;
    const year = 31557600;

    if (seconds < 1) return "Instantly";
    if (seconds < minute) return plural(Math.round(seconds), "second");
    if (seconds < hour) return plural(Math.round(seconds / minute), "minute");
    if (seconds < day) return plural(Math.round(seconds / hour), "hour");
    if (seconds < year) return plural(Math.round(seconds / day), "day");
    if (seconds < year * 1000) return plural(Math.round(seconds / year), "year");
    if (seconds < year * 1e6) return Math.round(seconds / year / 1000) + " thousand years";
    if (seconds < year * 1e9) return Math.round(seconds / year / 1e6) + " million years";
    return "Billions of years or more";
}

function updateCrackTime() {
    const p = input.value;

    if (p === "") {
        crackTimeText.textContent = "-";
        crackTimeText.style.color = "";
        return;
    }

    const seconds = secondsToCrack(p);
    crackTimeText.textContent = formatTime(seconds);

    // Red under a day, amber under 100 years, green after that
    if (seconds < 86400) {
        crackTimeText.style.color = "var(--bad)";
    } else if (seconds < 31557600 * 100) {
        crackTimeText.style.color = "var(--warn)";
    } else {
        crackTimeText.style.color = "var(--good)";
    }
}

input.addEventListener("input", updateCrackTime);
updateCrackTime();

// ===== BREACH CHECK (Have I Been Pwned) =====
const breachBtn = document.getElementById("breach-btn");
const breachResult = document.getElementById("breach-result");

// Turns text into a SHA-1 hash, e.g. "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8"
async function sha1(text) {
    const bytes = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-1", bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
        .map(function (b) { return b.toString(16).padStart(2, "0"); })
        .join("")
        .toUpperCase();
}

breachBtn.addEventListener("click", async function () {
    const p = input.value;

    if (p === "") {
        breachResult.textContent = "Type a password first.";
        breachResult.style.color = "";
        return;
    }

    breachResult.textContent = "Checking...";
    breachResult.style.color = "";
    breachBtn.disabled = true;

    try {
        const hash = await sha1(p);
        const prefix = hash.slice(0, 5);   // the ONLY part we send
        const suffix = hash.slice(5);      // stays on this page

        const response = await fetch("https://api.pwnedpasswords.com/range/" + prefix, {
            headers: { "Add-Padding": "true" }   // hides even how many results came back
        });

        if (!response.ok) {
            throw new Error("Service returned " + response.status);
        }

        const text = await response.text();

        // Each line looks like "SUFFIX:COUNT". Look for ours.
        let count = 0;
        text.split("\n").forEach(function (line) {
            const parts = line.trim().split(":");
            if (parts[0] === suffix) {
                count = Number(parts[1]);
            }
        });

        if (count > 0) {
            breachResult.textContent = `Seen ${count.toLocaleString("en-ZA")} times in data breaches. Don't use this password.`;
            breachResult.style.color = "var(--bad)";
        } else {
            breachResult.textContent = "Not found in any known breach. That doesn't make it strong, so check the score above too.";
            breachResult.style.color = "var(--good)";
        }
    } catch (error) {
        breachResult.textContent = "Couldn't reach the breach database. Check your internet connection and try again.";
        breachResult.style.color = "var(--warn)";
    } finally {
        breachBtn.disabled = false;
    }
});

// Clear the old result when the password changes
input.addEventListener("input", function () {
    breachResult.textContent = "Check whether this password has appeared in a known data breach.";
    breachResult.style.color = "";
});