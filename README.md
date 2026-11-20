# Password Strength Checker

A tool that rates how strong a password is, estimates how long it would take to crack, and checks whether it has appeared in a real data breach, without ever sending the password anywhere.

**Live site:** https://madebyompfa.github.io/password-checker/

## Features

- **Strength rating**: checks length, upper and lowercase letters, numbers and symbols
- **Pattern detection**: flags common passwords (including leetspeak like `P@ssw0rd`), repeated characters, easy sequences (`abc`, `123`, `qwe`) and years
- **Time to crack**: a rough brute-force estimate, with a penalty for predictable patterns
- **Breach check**: looks the password up in the [Have I Been Pwned](https://haveibeenpwned.com/Passwords) database of leaked passwords

## How the breach check stays private

The password never leaves the page. Instead:

1. The page hashes the password with **SHA-1** using the browser's Web Crypto API
2. Only the **first 5 characters** of the hash are sent to the Have I Been Pwned API
3. The API returns every leaked hash that starts with those 5 characters (hundreds of them)
4. The page compares the rest of the hash locally to find a match

This technique is called **k-anonymity**: the API can't tell which password, or even which hash, was being checked. Requests also use padding, so the size of the response doesn't give anything away either.

## Built with

- HTML, CSS and vanilla JavaScript (no frameworks)
- Web Crypto API (`crypto.subtle`) for hashing
- `fetch` with `async` / `await` for the API call
- GitHub Pages for hosting

## Limitations

- The crack-time figure is an estimate. It assumes a brute-force attack at 10 billion guesses a second. Real attackers also use word lists and rules, so treat it as a guide, not a guarantee.
- The common-password list is short. The breach check covers far more.

## Run it locally

1. Clone this repo
2. Open `index.html` with the Live Server extension in VS Code (the