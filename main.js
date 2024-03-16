const jokesContainer = document.querySelector(".jokes");
const findJokesBtn = document.querySelector("#findJokes");

findJokesBtn.addEventListener("click", async (e) => {
  hideError();
  const jokesArray = await getJokes();

  if (!jokesArray || jokesArray.length == 0) {
    return;
  }
  //jokes is an instance of class JokeBlock which handles with jokesArray
  jokes.jokesArray = jokesArray;
  jokes.clearJokeBlock();
  jokes.generateJokeBlock();
});

//getting jokes from API
async function getJokes() {
  try {
    let response = await fetch("https://official-joke-api.appspot.com/random_ten");
    if (!response.ok) {
      throw new HttpError("Http error", response);
    }
    let result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof HttpError) {
      console.log(error.name, error.message);
      showError(error);
    } else {
      throw error;
    }
  }
}

//Class JokeBlock is responsible for displaying and voicing jokes from array it keeps in #jokesArray
class JokeBlock {
  #jokesArray = [];
  #voicesLoaded = false;
  #voices = [];

  constructor(containerElem) {
    this.jokesElem = containerElem;
    this.jokesElem.addEventListener("click", (e) => {
      const jokeId = e.target.dataset.jokeId;
      if (jokeId) {
        let { setup, punchline } = this.#jokesArray.find(({ id }) => id == jokeId);
        this.speakJoke(setup, punchline);
      }
    });
    this.loadVoices(); //invoke function to load voices array

    containerElem.addEventListener("click", (e) => {
      const jokeId = e.target.dataset.jokeId;
      if (jokeId) {
        let { setup, punchline } = this.#jokesArray.find(({ id }) => id == jokeId);
        this.speakJoke(setup, punchline);
      }
    });
  }
  //loading voices range
  async loadVoices() {
    return new Promise((resolve) => {
      //when voices are loaded event dispatches 'voiceschanged' We listen this event to
      //assign our #voices property
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        this.#voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith("en"));
        this.#voicesLoaded = true;
        resolve();
      });
    });
  }
  set jokesArray(jokes) {
    this.#jokesArray = jokes;
  }
  //to show part of joke
  truncate(str, maxSymbols) {
    return str.slice(0, maxSymbols) + "...";
  }
  //creates li item for joke
  createJokeItem({ setup, punchline, id }) {
    const liElem = document.createElement("li");
    liElem.innerHTML = `<span class='question'>${this.truncate(setup, 40)}</span>
    <button class='btn listen' data-joke-id='${id}'>Listen Whole Joke</button>`;
    let spanElem = liElem.querySelector(".question");
    //implying showing full joke while hovering and its closing as well
    spanElem.addEventListener("mouseenter", () => {
      this.showFullJoke(spanElem);
    });
    spanElem.addEventListener("mouseleave", () => {
      this.hideFullJoke(spanElem);
    });
    return liElem;
  }
  //populates jokes container by li for each joke
  generateJokeBlock() {
    if (this.#jokesArray.length == 0) {
      return;
    } else {
      this.#jokesArray.forEach((joke) => {
        this.jokesElem.append(this.createJokeItem(joke));
      });
    }
  }
  //clears joke block
  clearJokeBlock() {
    this.jokesElem.innerHTML = "";
  }
  //implies voicing for each part of joke (question and answer) with random voices
  async speakJoke(...phrases) {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel(); //if there are any unfinished utters to voice
      phrases.forEach((phrase) => {
        const speakObj = new SpeechSynthesisUtterance(phrase); //generating separate utter for each part
        if (this.#voices.length > 0 && this.#voicesLoaded) {
          speakObj.voice = this.getRandomVoice(); //each part sounds with different voice
        }
        window.speechSynthesis.speak(speakObj);
      });
    } else {
      console.log("Feature is not supported");
    }
  }
  // Function to get a random voice
  getRandomVoice() {
    let randomIndex = Math.floor(Math.random() * this.#voices.length);
    return this.#voices[randomIndex];
  }
  //show full joke while hovering
  showFullJoke(spanElem) {
    const jokeBlock = document.createElement("div");
    jokeBlock.classList.add("joke-block");
    let jokeId = spanElem.closest("li").querySelector("button").dataset.jokeId;
    let { setup, punchline } = this.#jokesArray.find(({ id }) => id == jokeId);
    jokeBlock.innerHTML = `
    <p>${setup}</p>
    <p>${punchline}</p>
    `;
    spanElem.append(jokeBlock);
  }
  //hides showing full joke
  hideFullJoke(spanElem) {
    spanElem.querySelector(".joke-block").remove();
  }
}
const jokes = new JokeBlock(jokesContainer);

class HttpError extends Error {
  constructor(message, response) {
    super(message);
    this.message = message;
    this.name = "HttpError";
    this.responst = response;
  }
}

function showError(error) {
  console.log(error.name, error.stack);
  const errorElem = document.createElement("li");
  errorElem.classList.add("error-container");
  errorElem.innerHTML = `
  <p>Something went wrong</p>
  <p>${error.message}</p>
  <p>Try once more or refer to developer.</p>
  `;
  errorElem.addEventListener("click", () => {
    errorElem.remove();
  });
  jokesContainer.append(errorElem);
}

function hideError() {
  const errorElem = document.querySelector(".error-container");
  if (errorElem) {
    errorElem.remove();
  }
}
