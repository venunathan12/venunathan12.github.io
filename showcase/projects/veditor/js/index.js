var aesKey = null;
aesKey = prompt('Please enter the secret passphrase :');
localStorage.setItem('KEY: The Text Editor: AES Key', aesKey)
location.assign("editor.html");
