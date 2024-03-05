(function () {
    'use strict';

    let answer = "";

    function isCorrect(answer, correctAnswer, correctKanji) {
        const correct = correctAnswer.trim()
        const user = answer.trim().replace("nn", "n'")

        if(correctKanji){
            if(answer == correctKanji){
                return true;
            }
        }

        if (wanakana.isHiragana(correctAnswer)) {
            return correct === wanakana.toHiragana(user);
        } else {
            const isCorrect = wanakana.toKatakana(correct) === wanakana.toKatakana(user);

            if (!isCorrect && correct.includes("ー")) {
                const vowels = ["ア", "イ", "ウ", "エ", "オ"];

                for (const vowel of vowels) {
                    const replacedAnswer = correct.replace("ー", vowel);
                    if (replacedAnswer === wanakana.toKatakana(user)) {
                        return true;
                    }
                }

                if(answer == correct){
                    return true;
                }

                return false;
            }

            return isCorrect;
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

    function renderRanking(title, elements, username) {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";

        const totalParent = document.createElement("div");
        totalParent.classList.add("ranking");

        const totalRanking = elements;

        const rankingWrapper = document.createElement("div");
        rankingWrapper.style.minWidth = "18.25rem";

        const rankingTitle = document.createElement("h4");
        rankingTitle.style.fontSize = "155%";
        rankingTitle.style.textAlign = "center";
        rankingTitle.style.fontStyle = "italic";
        rankingTitle.textContent = "Ranking AJR"
        const smallTitle = document.createElement("span");
        smallTitle.style.opacity = "0.5";
        smallTitle.style.marginLeft = "0.75rem";
        smallTitle.style.fontSize = "80%";
        smallTitle.textContent = title;
        rankingTitle.appendChild(smallTitle);

        rankingWrapper.appendChild(rankingTitle);

        totalRanking.forEach((position, i) => {
            const pos = document.createElement("div")
            pos.classList.add("ranking-entry");

            const posTop = document.createElement("p");
            posTop.textContent = i + 1 + ". " + position._id;
            if (username == position._id) {
                posTop.textContent += " (You)"
            }
            posTop.style.margin = 0;

            const posBottom = document.createElement("p");
            posBottom.textContent = position.total_points;
            posBottom.style.textAlign = "right";
            posBottom.style.margin = 0;
            pos.appendChild(posTop);
            pos.appendChild(posBottom);

            rankingWrapper.append(pos);
        })

        totalParent.append(rankingWrapper)

        const base = document.querySelector(".unconstrained div:nth-child(2)");

        wrapper.appendChild(totalParent);
        base.prepend(wrapper);
    }

    async function renderInputElements() {
        let params = new URL(document.location).searchParams;
        if (!params.get("c")) {
            answer = "";
            const isReviewing = document.querySelector(".review-hidden")

            if (!isReviewing) return;

            const parent = isReviewing.parentElement;
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

let correctAnswerKanji = "";

if (correctChilds.length > 0) {
    for (const child of correctChilds) {
        for (const child2 of child.childNodes) {
            if (child2.nodeType === Node.TEXT_NODE) {
                correctAnswerKanji += child2.nodeValue;
            }
        }
    }
} else {
    correctAnswerKanji = correct.textContent;
}



console.log(`Correct answer (full): ${correctAnswer}`);
console.log(`Correct answer (kanji only): ${correctAnswerKanji}`);


            const answerElement = document.createElement("p");
            answerElement.style.textAlign = "center";
            answerElement.style.fontSize = "2rem";
            answerElement.style.textDecoration = "underline";
            answerElement.textContent = `Respuesta correcta: ${correctAnswerKanji}`;
            answerElement.id = "respuestacorrecta"

            const parent = document.querySelector(".answer-box");

            if (answer === "") {
                if (!parent.querySelector("#respuestacorrecta")) {
                    parent.appendChild(answerElement);
                }
                return;
            };

            const checkElement = document.createElement("p");
            checkElement.textContent = `Tu respuesta: ${wanakana.toHiragana(answer)}`;
            checkElement.style.textAlign = "center";
            checkElement.style.fontSize = "2rem";
            checkElement.id = "respuestausuario";

            if (isCorrect(answer, correctAnswer, correctAnswerKanji)) {
                chrome.runtime.sendMessage({ action: "addPoints", points: 1 });

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
                chrome.runtime.sendMessage({ action: "addPoints", points: 0.2 });
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

    if (window.location.pathname.includes("review")) {
        renderInputElements();

        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                // listen for messages sent from background.js
                if (request.message === 'change') {
                    renderInputElements();
                }
            });
    }
    else if (window.location.pathname.includes("leaderboard")) {
        chrome.storage.sync.get(['settings'], function (item) {
            if (item) {
                const settings = JSON.parse(item["settings"]);
                if (!settings.username) return;

                chrome.runtime.sendMessage({ action: "getLeaderboard" }, (response) => {
                    if (response.total_ranking.length > 0) {
                        renderRanking("total", response.total_ranking, settings.username)
                    }
                    if (response.monthly_ranking.length > 0) {
                        renderRanking("current month", response.monthly_ranking, settings.username)
                    }
                    if (response.daily_ranking.length > 0) {
                        renderRanking("today", response.daily_ranking, settings.username)
                    }
                });
            }
        });
    }
})();