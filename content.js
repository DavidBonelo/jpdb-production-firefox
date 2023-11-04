(function () {
    'use strict';

    let answer = "";

    function isCorrect(answer, correctAnswer) {
        if (wanakana.isHiragana(correctAnswer)) {
            return correctAnswer.trim() === wanakana.toHiragana(answer.trim().replace("nn", "n'"));
        } else {
            return correctAnswer.trim() === wanakana.toKatakana(answer.trim().replace("nn", "n'"));
        }
    }

    async function getCookieValue(url, name) {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ action: "getCookie", url, name }, function (response) {
                resolve(response && response.value ? response.value : null);
            });
        });
    }

    async function removeCookie(url, name) {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ action: "deleteCookie", url, name }, function (response) {
                resolve(response && response.value ? response.value : null);
            });
        });
    }

    async function setCookieValue(url, name, value) {
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ action: "setCookie", url, name, value }, function (response) {
                resolve(response && response.value ? response.value : null);
            });
        });
    }

    async function renderElements() {
        let params = new URL(document.location).searchParams;
        if (!params.get("c")) {
            answer = "";
            const parent = document.querySelector(".review-hidden").parentElement;
            const oldButtons = document.querySelector(".review-button-group");

            const inputElement = document.createElement("input");
            const buttonElement = document.querySelector("#show-answer");
            inputElement.type = "text";
            inputElement.placeholder = "Escribe la lectura de la palabra en hiragana";

            const keepForm = oldButtons.querySelector("form");
            const keepButton = oldButtons.querySelector("#show-answer");

            inputElement.addEventListener("keyup", function (e) {
                if (e.key === "Enter") {
                    keepButton.click();
                }
                e.stopPropagation();
            });

            buttonElement.addEventListener("click", async () => {
                answer = inputElement.value;
                await setCookieValue("https://jpdb.io", "answer", inputElement.value);
            });

            parent.appendChild(inputElement);

            const newButtonCont = document.createElement("div");
            newButtonCont.style.display = "flex";
            newButtonCont.style.justifyContent = "end";
            newButtonCont.style.width = "100%";

            newButtonCont.appendChild(keepForm);

            parent.appendChild(newButtonCont);
            inputElement.focus();
        } else {
            if (answer === "") {
                try {
                    const cookie = await getCookieValue("https://jpdb.io", "answer");
                    if (cookie) {
                        answer = cookie;
                        await removeCookie("https://jpdb.io", "answer");
                    }
                    if (answer === "") return;
                } catch (e) {
                    console.log(e);
                }

            }

            const parent = document.querySelector(".answer-box");

            const checkElement = document.createElement("p");
            checkElement.textContent = `Tu respuesta: ${wanakana.toHiragana(answer)}`;
            checkElement.style.textAlign = "center";
            checkElement.style.fontSize = "2rem";

            const correct = document.querySelector("a.plain");
            const correctChilds = correct.children;

            let correctAnswer = "";
            if (correctChilds.length > 0) {
                for (const child of correctChilds) {
                    const furi = child.querySelector("rt");
                    if (furi) {
                        correctAnswer += furi.textContent;
                    } else {
                        correctAnswer += child.textContent;
                    }
                }
            } else {
                correctAnswer = correct.textContent;
            }

            const answerElement = document.createElement("p");
            answerElement.style.textAlign = "center";
            answerElement.style.fontSize = "2rem";
            answerElement.style.textDecoration = "underline";
            answerElement.textContent = `Respuesta correcta: ${correctAnswer}`;

            if (isCorrect(answer, correctAnswer)) {
                checkElement.style.color = "#0F0";
            } else {
                checkElement.style.color = "#F00";
                parent.appendChild(answerElement);

                const goodButtons = document.querySelector(".row.row-3");
                goodButtons.remove();
            }


            parent.appendChild(checkElement);
        }
    }

    renderElements();

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            // listen for messages sent from background.js
            if (request.message === 'change') {
                renderElements();
            }
        });
})();