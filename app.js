
document.addEventListener('DOMContentLoaded', () => {

  
  const select = document.getElementById('category');
  const button = document.getElementById('random-btn');
  const box = document.getElementById('question-box');
  const headerText = document.getElementById('header-text');
  const pageTitle = document.getElementById('page-title');

  
  let questionData = {};

  
  const dataFile = 'ai-questions.json';

  
  
  async function lataaData() {
    try {
      const response = await fetch(dataFile);
      if (!response.ok) {
        throw new Error('Datan lataus epäonnistui: ' + response.statusText);
      }
      questionData = await response.json();
      
      
      kaynnistaSivu();

    } catch (error) {
      console.error('Virhe:', error);
      box.innerHTML = `<p>Kysymysten lataus epäonnistui. Tarkista ${dataFile}.</p>`;
      box.classList.add('visible');
    }
  }

  

function kaynnistaSivu() {
    
    headerText.textContent = questionData.pageTitle;
    pageTitle.textContent = questionData.pageTitle;

    
    const categories = questionData.categories || {};
    Object.keys(categories).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = categories[key];
      select.appendChild(option);
    });

    
    button.addEventListener('click', arvoUusiKysymys);

    
    
    
    box.innerHTML = `<div><h2>Tervetuloa Kysymyskoneeseen!</h2><p>Valitse haluamasi aihealue ja paina "Arvo kysymys".</p></div>`;
    
    
    box.classList.add('visible');
    
    
    
    box.classList.add('welcome-style');
  }

  function arvoUusiKysymys() {
    const category = select.value;
    const q = getRandomQuestion(category);
    showQuestion(q);
  }

  

  function getRandomQuestion(category) {
    
    const list = questionData.questions?.[category] || questionData.questions?.['all'];
    
    if (!list || list.length === 0) {
      return 'Ei kysymyksiä tässä kategoriassa.';
    }
    return list[Math.floor(Math.random() * list.length)];
  }

  function showQuestion(text) {
    
    box.classList.remove('visible');
    
    
    setTimeout(() => {
      box.innerHTML = `<p>${text}</p>`;
      
      box.classList.add('visible');
    }, 400); 
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