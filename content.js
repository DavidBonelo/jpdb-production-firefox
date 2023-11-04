(function () {
    'use strict';

    let answer = "";

    function isCorrect(answer, correctAnswer) {
        if (wanakana.isHiragana(correctAnswer)) {
            return correctAnswer.trim() === wanakana.toHiragana(answer.trim().replace("nn", "n'"));
        } else {
            return wanakana.toKatakana(correctAnswer.trim()) === wanakana.toKatakana(answer.trim().replace("nn", "n'"));
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
            inputElement.id = "productioninput"

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

            if (!parent.querySelector("#productioninput")) {
                parent.appendChild(inputElement);
            }

            const newButtonCont = document.createElement("div");
            newButtonCont.style.display = "flex";
            newButtonCont.style.justifyContent = "end";
            newButtonCont.style.width = "100%";

            newButtonCont.appendChild(keepForm);

            parent.appendChild(newButtonCont);
            inputElement.focus();


            chrome.storage.sync.get(['settings'], function (item) {
                if (item) {
                    const settings = JSON.parse(item["settings"]);
                    if (settings.maxtime && settings.maxtime > 0) {
                        setTimeout(async () => {
                            answer = "タイムアウト";
                            await setCookieValue("https://jpdb.io", "answer", answer);
                            keepButton.click();
                        }, settings.maxtime * 1000);
                    }
                }
            })
        } else {
            if (answer === "") {
                try {
                    const cookie = await getCookieValue("https://jpdb.io", "answer");
                    if (cookie) {
                        answer = cookie;
                        await removeCookie("https://jpdb.io", "answer");
                    }

                } catch (e) {
                    console.log(e);
                }

            }

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
            answerElement.id = "respuestacorrecta"

            const parent = document.querySelector(".answer-box");

            if (answer === "") {
                parent.appendChild(answerElement);
                return;
            };

            const checkElement = document.createElement("p");
            checkElement.textContent = `Tu respuesta: ${wanakana.toHiragana(answer)}`;
            checkElement.style.textAlign = "center";
            checkElement.style.fontSize = "2rem";
            checkElement.id = "respuestausuario";

            if (isCorrect(answer, correctAnswer)) {
                checkElement.style.color = "#0F0";
                chrome.storage.sync.get(['settings'], function (item) {
                    if (item) {
                        const settings = JSON.parse(item["settings"]);
                        if (settings.skipGoods) {
                            let goodButton = document.querySelector("#grade-4");
                            if (!goodButton) {
                                goodButton = document.querySelector("#grade-p");
                            }
                            goodButton.click();
                        }
                    }
                });
            } else {
                checkElement.style.color = "#F00";

                if (!parent.querySelector("#respuestacorrecta")) {
                    parent.appendChild(answerElement);
                }

                chrome.storage.sync.get(['settings'], function (item) {
                    if (item) {
                        const settings = JSON.parse(item["settings"]);
                        if (settings.hideonfail) {
                            let goodButtons = document.querySelector(".row.row-3");
                            if (!goodButtons) {
                                goodButtons = document.querySelector("#grade-p");
                            }
                            goodButtons.remove();
                        }
                    }
                });

                let badButton = document.querySelector("#grade-1");
                if (!badButton) {
                    badButton = document.querySelector("#grade-f");
                }
                badButton.focus();
            }

            if (!parent.querySelector("#respuestausuario")) {
                parent.appendChild(checkElement);
            }
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