let number = Math.floor(Math.random() * 100) + 1;
let attempts = 0;

function checkGuess() {
    const input = document.getElementById("guessInput");
    const msg = document.getElementById("message");
    const guess = parseInt(input.value);

    if (!guess || guess < 1 || guess > 100) {
        msg.textContent = "❌ Zahl 1-100 eingeben!";
        return;
    }

    attempts++;
    document.getElementById("attempts").textContent = attempts;

    if (guess === number) {
        msg.textContent = `🎉 Richtig! (${attempts} Versuche)`;
        document.getElementById("resetBtn").style.display = "block";
    } else if (guess > number) {
        msg.textContent = "⬇️ Kleiner!";
    } else {
        msg.textContent = "⬆️ Größer!";
    }

    input.value = "";
}

function resetGame() {
    number = Math.floor(Math.random() * 100) + 1;
    attempts = 0;

    document.getElementById("attempts").textContent = 0;
    document.getElementById("message").textContent = "";
    document.getElementById("resetBtn").style.display = "none";
}
