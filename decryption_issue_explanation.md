# Decryption Toggle Issue Analysis

## 🔍 The Problem
When the **Decryption Mode is ON**, the application currently downloads the **encrypted** file. Conversely, when the mode is **OFF**, it downloads the **decrypted** original file. This behavior is exactly inverted from what is expected.

## 🧠 Root Cause
The bug is caused by a swapped `if/else` condition inside the `handleDownload` function in `src/App.jsx`. 

The `autoDecrypt` state variable tracks whether the decryption toggle is ON (`true`) or OFF (`false`). In the recent update, the logic inside this block was accidentally reversed:

```javascript
// Current Buggy Code in src/App.jsx
if (autoDecrypt) {
  // BUG: When ON, it downloads the raw encrypted payload!
  const raw = await downloadFileRaw(fileId);
  // ...
} else {
  // BUG: When OFF, it decrypts the file!
  const { buffer, filename: decName } = await downloadFile(fileId, masterKeyHex);
  // ...
}
```

## 🛠️ The Solution
To fix the issue, we simply need to swap the contents of the `if` and `else` blocks so that `autoDecrypt === true` executes the decryption logic, and `autoDecrypt === false` executes the raw encrypted download.

### Corrected Code
```javascript
// Corrected Code in src/App.jsx
if (autoDecrypt) {
  // CORRECT: Decryption ON — decrypt client-side and give the original plaintext file
  const { buffer, filename: decName } = await downloadFile(fileId, masterKeyHex);
  filename = decName;
  addLog(`Decrypting "${filename}" client-side with AES-256-GCM...`, 'info');
  addLog(`✓ Decrypted "${filename}" successfully — saving original file locally`, 'success');
  const mimeType = getMimeType(filename);
  blob = new Blob([buffer], { type: mimeType });
} else {
  // CORRECT: Decryption OFF — download the raw encrypted payload
  const raw = await downloadFileRaw(fileId);
  blob = raw.blob;
  filename = raw.filename;
  addLog(`Saving encrypted payload as "${filename}" — no decryption performed`, 'info');
  addLog('✓ Encrypted file saved — server never learned file content', 'success');
}
```

This ensures that when the user toggles "Decryption ON", they get the decrypted file, and when they toggle it "OFF", they get the encrypted payload.
