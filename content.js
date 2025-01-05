(async function () {
  "use strict";

  let answer = "";

  function isCorrect(answer, correctAnswer, correctKanji) {
    const correct = correctAnswer.trim();
    const user = answer.trim().replace("nn", "n'");

    if (correctKanji.length > 0) {
      if (answer == correctKanji) {
        return true;
      }
    }

    if (wanakana.isHiragana(correctAnswer)) {
      return correct === wanakana.toHiragana(user);
    } else {
      const isCorrect =
        wanakana.toKatakana(correct) === wanakana.toKatakana(user);

      if (!isCorrect && correct.includes("ー")) {
        const vowels = ["ア", "イ", "ウ", "エ", "オ"];

        for (const vowel of vowels) {
          const replacedAnswer = correct.replace("ー", vowel);
          if (replacedAnswer === wanakana.toKatakana(user)) {
            return true;
          }
        }

        if (answer == correct) {
          return true;
        }

        return false;
      }

      return isCorrect;
    }
  }

  async function getCookieValue(url, name) {
    return new Promise((resolve) => {
      browser.runtime.sendMessage(
        { action: "getCookie", url, name },
        function (response) {
          resolve(response && response.value ? response.value : null);
        }
      );
    });
  }

  async function removeCookie(url, name) {
    return new Promise((resolve) => {
      browser.runtime.sendMessage(
        { action: "deleteCookie", url, name },
        function (response) {
          resolve(response && response.value ? response.value : null);
        }
      );
    });
  }

  async function setCookieValue(url, name, value, expire = null) {
    return new Promise((resolve) => {
      browser.runtime.sendMessage(
        { action: "setCookie", url, name, value, expire },
        function (response) {
          resolve(response && response.value ? response.value : null);
        }
      );
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
    rankingTitle.textContent = "Ranking Manabe";
    const smallTitle = document.createElement("span");
    smallTitle.style.opacity = "0.5";
    smallTitle.style.marginLeft = "0.75rem";
    smallTitle.style.fontSize = "80%";
    smallTitle.textContent = title;
    rankingTitle.appendChild(smallTitle);

    rankingWrapper.appendChild(rankingTitle);

    totalRanking.forEach((position, i) => {
      const pos = document.createElement("div");
      pos.classList.add("ranking-entry");

      const posTop = document.createElement("p");
      posTop.textContent = i + 1 + ". " + position._id;
      if (username == position._id) {
        posTop.textContent += " (You)";
      }
      posTop.style.margin = 0;

      const posBottom = document.createElement("p");
      posBottom.textContent = position.total_points;
      posBottom.style.textAlign = "right";
      posBottom.style.margin = 0;
      pos.appendChild(posTop);
      pos.appendChild(posBottom);

      rankingWrapper.append(pos);
    });

    totalParent.append(rankingWrapper);

    const base = document.querySelector(".unconstrained div:nth-child(2)");

    wrapper.appendChild(totalParent);
    base.prepend(wrapper);
  }

  async function renderInputElements() {
    let params = new URL(document.location).searchParams;
    if (!params.get("c")) {
      answer = "";
      const isReviewing = document.querySelector(".review-hidden");

      if (!isReviewing) return;

      const parent = isReviewing.parentElement;
      const oldButtons = document.querySelector(".review-button-group");

      const inputElement = document.createElement("input");
      const buttonElement = document.querySelector("#show-answer");
      inputElement.type = "text";
      inputElement.placeholder = "Escribe la lectura de la palabra en hiragana";
      inputElement.id = "productioninput";

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

      browser.storage.sync.get(["settings"], function (item) {
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
      });
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

      const answerElement = document.createElement("p");
      answerElement.style.textAlign = "center";
      answerElement.style.fontSize = "2rem";
      answerElement.style.textDecoration = "underline";
      answerElement.textContent = `Respuesta correcta: ${correctAnswer}`;
      answerElement.id = "respuestacorrecta";

      const parent = document.querySelector(".answer-box");

      if (answer === "") {
        if (!parent.querySelector("#respuestacorrecta")) {
          parent.appendChild(answerElement);
        }
        return;
      }

      const checkElement = document.createElement("p");
      checkElement.textContent = `Tu respuesta: ${wanakana.toHiragana(answer)}`;
      checkElement.style.textAlign = "center";
      checkElement.style.fontSize = "2rem";
      checkElement.id = "respuestausuario";

      if (isCorrect(answer, correctAnswer, correctAnswerKanji)) {
        browser.runtime.sendMessage({ action: "addPoints", points: 1 });

        checkElement.style.color = "#0F0";
        browser.storage.sync.get(["settings"], function (item) {
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
        browser.runtime.sendMessage({ action: "addPoints", points: 0.2 });
        checkElement.style.color = "#F00";

        if (!parent.querySelector("#respuestacorrecta")) {
          parent.appendChild(answerElement);
        }

        browser.storage.sync.get(["settings"], function (item) {
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

  async function dontTempMe(settings) {
    const alreadyReviewed = await getCookieValue("https://jpdb.io", "reviewed");

    if (!alreadyReviewed) return;

    if (window.location.pathname.includes("review") && settings.limits) {
      // Make the user go home
      window.location.href = "https://jpdb.io/";
      alert("Ya has terminado tus repasos, puedes cerrar esta pestaña.");
      return;
    } else {
      if (settings.limits) {
        // Find the other button with class outline
        const otherAnchor = document.querySelector("input.outline");

        const anchorParent = otherAnchor.parentElement;

        // Delete it
        if (otherAnchor) {
          otherAnchor.remove();
        }

        // Create a new text
        const newAnchor = document.createElement("p");

        // The user can return the next day at 2:00
        const canReturnDate = new Date();
        canReturnDate.setDate(canReturnDate.getDate() + 1);
        canReturnDate.setHours(2, 0, 0, 0);

        const timeLeft = canReturnDate - new Date();

        newAnchor.textContent = `Ya has terminado tus repasos, puedes cerrar esta pestaña. Puedes volver dentro de ${Math.floor(
          timeLeft / 1000 / 60 / 60
        )} horas.`;

        // Append it
        anchorParent.appendChild(newAnchor);
      }

      if (settings.pendingreviews) {
        // Get the real parent
        const realParent = document.querySelector("h4").parentElement;

        // Get all the p from the parent
        const allP = realParent.querySelectorAll("p");

        // Delete the p that contains the text "available"
        allP.forEach((p) => {
          if (p.textContent.includes("available")) {
            p.remove();
          }
        });
      }
    }
  }

  // Get ankify settings
  const rawSettings = await browser.storage.sync.get(["settings"]);

  const settings = JSON.parse(rawSettings["settings"] || "{}");

  if (window.location.pathname.includes("review")) {
    if (settings.ankify) {
      void dontTempMe(settings);
    }
    const evil_title = document.querySelector("h5");
    if (
      evil_title &&
      evil_title.textContent.includes("quota") &&
      settings.ankify &&
      settings.limits
    ) {
      // Change the text to "Yas has terminado tus repasos, puedes cerrar esta pestaña."
      evil_title.textContent =
        "Yas has terminado tus repasos, puedes cerrar esta pestaña.";

      // Access the parent
      const evil_parent = evil_title.parentElement;

      // Search for the second p occurence
      const evil_p = evil_parent.querySelector("p:nth-of-type(2)");
      // Search for the third p occurence
      const evil_p2 = evil_parent.querySelector("p:nth-of-type(3)");

      // Delete it
      if (evil_p) {
        evil_p.remove();
      }

      // Delete it
      if (evil_p2) {
        evil_p2.remove();
      }

      // Delete all the forms in the parent
      evil_parent.querySelectorAll("form").forEach((form) => {
        form.remove();
      });

      // Create cookie to remember that today was achieved, this reminder will be deleted at 02:00
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0);

      setCookieValue(
        "https://jpdb.io",
        "reviewed",
        "true",
        tomorrow.getTime() / 1000
      );
    } else if (evil_title && settings.ankify) {
      // Search an input with name "continue"
      const evil_input = document.querySelector('input[name="continue"]');

      // Access to the parent form
      const evil_form = evil_input.parentElement;

      // Submit the form
      evil_form.submit();
    }

    renderInputElements();

    browser.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse
    ) {
      // listen for messages sent from background.js
      if (request.message === "change") {
        renderInputElements();
      }
    });
  } else if (window.location.pathname.includes("leaderboard")) {
    browser.storage.sync.get(["settings"], function (item) {
      if (item) {
        const settings = JSON.parse(item["settings"]);
        if (!settings.username) return;

        browser.runtime.sendMessage(
          { action: "getLeaderboard" },
          (response) => {
            if (response.total_ranking.length > 0) {
              renderRanking("total", response.total_ranking, settings.username);
            }
            if (response.monthly_ranking.length > 0) {
              renderRanking(
                "current month",
                response.monthly_ranking,
                settings.username
              );
            }
            if (response.daily_ranking.length > 0) {
              renderRanking("today", response.daily_ranking, settings.username);
            }
          }
        );
      }
    });
  } else if (settings.ankify) {
    if (settings.pendingreviews) {
      // Find a .nav-item anchor with href to /learn
      const learnAnchor = document.querySelector("a.nav-item");

      // If it exists, change its content to just "Learn"
      if (learnAnchor) {
        learnAnchor.textContent = "Learn";
      }
    }

    void dontTempMe(settings);
  }
})();
