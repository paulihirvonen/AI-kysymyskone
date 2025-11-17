document.addEventListener('DOMContentLoaded', () => {

  // 1. ASETUKSET-LINKKI (Otsikkoa varten)
  const settingsUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw5Ll-vYn8Bwid3oXJVdqGtzi5bJtjrX6jUYjl5A0l1WpcgNbsRQHxwoeQ2giBhG8PqMn-VKN1j0XX/pub?gid=771770891&single=true&output=csv';

  // 2. KYSYMYKSET-LINKKI (Kysymyksiä varten)
  const questionsUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRw5Ll-vYn8Bwid3oXJVdqGtzi5bJtjrX6jUYjl5A0l1WpcgNbsRQHxwoeQ2giBhG8PqMn-VKN1j0XX/pub?gid=0&single=true&output=csv';

  const select = document.getElementById('category');
  const button = document.getElementById('random-btn');
  const box = document.getElementById('question-box');
  const headerText = document.getElementById('header-title') || document.getElementById('header-text');
  const pageTitle = document.getElementById('page-title');

  // Päädata (kaikki kysymykset tallessa täällä)
  let questionData = {
    pageTitle: 'Ladataan...', 
    categories: {},
    questions: {}
  };

  // UUSI MUUTTUJA: Jäljellä olevat kysymykset (Korttipakka)
  // Tästä listasta poistetaan kysymyksiä sitä mukaa kun niitä kysytään.
  let remainingQuestions = {};

  async function lataaData() {
    try {
      const [settingsResp, questionsResp] = await Promise.all([
        fetch(settingsUrl),
        fetch(questionsUrl)
      ]);

      if (!settingsResp.ok || !questionsResp.ok) {
        throw new Error('Jompikumpi lataus epäonnistui.');
      }
      
      const settingsCsv = await settingsResp.text();
      const questionsCsv = await questionsResp.text();
      
      parseSettings(settingsCsv);
      parseQuestions(questionsCsv);
      
      kaynnistaSivu();

    } catch (error) {
      console.error('Virhe:', error);
      box.innerHTML = `<p>Lataus epäonnistui. Tarkista molemmat linkit.</p>`;
      box.classList.add('visible');
    }
  }

  function splitCsvLine(line) {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes; 
      else if (line[i] === ',' && !inQuotes) {
        result.push(cleanField(line.substring(start, i)));
        start = i + 1;
      }
    }
    result.push(cleanField(line.substring(start)));
    return result;
  }

  function cleanField(text) {
    return text ? text.trim().replace(/^"|"$/g, '').replace(/""/g, '"') : "";
  }

  function parseSettings(csvData) {
    const rows = csvData.trim().split('\n');
    for (let i = 1; i < rows.length; i++) {
      const columns = splitCsvLine(rows[i]);
      if (columns.length < 2) continue;

      const key = columns[0];
      const value = columns[1];

      if (key === 'pageTitle') {
        questionData.pageTitle = value;
      }
    }
  }

  function parseQuestions(csvData) {
    const allQuestions = [];
    const questionsByCat = {};
    const categories = {};
    
    const rows = csvData.trim().split('\n');
    for (let i = 1; i < rows.length; i++) {
      const columns = splitCsvLine(rows[i]);
      if (columns.length < 2) continue; 

      const categoryName = columns[0]; 
      const questionText = columns[1]; 

      if (!categoryName || !questionText) continue;

      const categoryKey = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      if (!questionsByCat[categoryKey]) {
        questionsByCat[categoryKey] = [];
      }
      questionsByCat[categoryKey].push(questionText);
      allQuestions.push(questionText);
      
      if (!categories[categoryKey]) {
        categories[categoryKey] = categoryName; 
      }
    }
    
    categories['all'] = 'Kaikki aiheet';
    questionsByCat['all'] = allQuestions;

    questionData.categories = categories;
    questionData.questions = questionsByCat;
  }

  // --- UUSI LOGIIKKA TÄSSÄ ---
  function getRandomQuestion(category) {
    // 1. Tarkistetaan onko tälle kategorialle jäljellä olevia kysymyksiä
    if (!remainingQuestions[category] || remainingQuestions[category].length === 0) {
         // Jos pakka on tyhjä (tai sitä ei ole), täytetään se uudelleen alkuperäisillä kysymyksillä
         const originalList = questionData.questions[category];
         
         if (!originalList || originalList.length === 0) {
             return "Ei kysymyksiä tässä kategoriassa.";
         }

         // Luodaan kopio listasta (spread syntax [...list])
         remainingQuestions[category] = [...originalList];
         console.log(`Kategoria '${category}' nollattu. Kysymyksiä taas: ${remainingQuestions[category].length}`);
    }

    // 2. Valitaan satunnainen indeksi "jäljellä olevien" listasta
    const list = remainingQuestions[category];
    const randomIndex = Math.floor(Math.random() * list.length);

    // 3. "Nostetaan kortti" eli poistetaan kysymys listasta splice-komennolla
    // splice palauttaa taulukon poistetuista, joten otamme ensimmäisen alkion [0]
    const pickedQuestion = list.splice(randomIndex, 1)[0];

    return pickedQuestion;
  }

  function kaynnistaSivu() {
    if(questionData.pageTitle) {
        if(pageTitle) pageTitle.textContent = questionData.pageTitle;
        if(headerText) headerText.textContent = questionData.pageTitle;
    }
    
    select.innerHTML = ''; 
    const sortedKeys = Object.keys(questionData.categories).sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        const nameA = questionData.categories[a].toLowerCase();
        const nameB = questionData.categories[b].toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });

    sortedKeys.forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = questionData.categories[key];
      select.appendChild(option);
    });

    button.addEventListener('click', () => {
      const category = select.value;
      // Käytetään uutta funktiota
      const q = getRandomQuestion(category);
      showQuestion(q);
    });

    if(questionData.pageTitle) {
         box.innerHTML = `<div><h2>${questionData.pageTitle}</h2><p>Valitse aihe ja paina "Arvo kysymys".</p></div>`;
    } else {
         box.innerHTML = `<div><h2>Tervetuloa!</h2><p>Valitse aihe ja paina nappia.</p></div>`;
    }
    
    box.classList.add('visible');
    box.classList.add('welcome-style');
  }

  function showQuestion(text) {
    box.classList.remove('visible');
    setTimeout(() => {
      box.classList.remove('welcome-style');
      box.innerHTML = `<p>${text}</p>`;
      box.classList.add('visible');
    }, 400); 
  }

  lataaData();
});
