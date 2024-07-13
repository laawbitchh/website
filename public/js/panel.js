const icons = [
  "src/bulle.png",
  "src/point-dinterrogation.png",
  "src/sac-dargent.png",
  "src/bouton-supprimer.png",
];

document.addEventListener("DOMContentLoaded", () => {
  // Appel à l'API avec Axios (simulé avec une fonction)
  fetchDataAndCreateCards();

  // Écouteur pour le changement de tri
  document.getElementById("sort").addEventListener("change", function () {
    const order = this.value;
    sortCardsByPrice(order);
  });

  // Écouteur pour la recherche
  document.getElementById("search").addEventListener("input", function () {
    const searchTerm = this.value.trim();
    filterCardsByName(searchTerm);
  });
});

async function fetchDataAndCreateCards() {
  try {
    const token = localStorage.getItem("token"); // Remplacez par votre token réel
    const headers = {
      token: token,
      "Content-Type": "application/json",
    };

    // Remplacez 'url_de_votre_api' par l'URL de votre API
    const response = await axios.post(
      "http://localhost:3000/api/clients",
      {},
      { headers }
    );

    const clients = response.data; // Supposons que response.data contient les clients comme indiqué dans l'exemple JSON précédent

    clients.forEach(async (client) => {
      try {
        const decryptedPassword = await decryptPassword(client.password); // Déchiffrer le mot de passe

        // Obtenir l'IP et la localisation
        const ipInfo = await getIPInfo(client.ip);

        const accountInfo = {
          username: client.username,
          password: decryptedPassword,
          ip: ipInfo.ip,
          location: `${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country}`,
          money: client.money,
          createdAt: formatDate(Number(client.creationTime)), // Formater la date de création du compte
        };

        createCard(
          client.username,
          `${client.money}€`,
          client.hasMessages,
          accountInfo
        );
      } catch (error) {
        console.error("Erreur lors du traitement du client:", error);
      }
    });

    sortCardsByMessages(); // Tri initial des cartes par présence de messages
  } catch (error) {
    console.error("Erreur lors de la requête:", error);
  }
}

// Fonction pour déchiffrer le mot de passe avec Cryptr
async function decryptPassword(encryptedPassword) {
  let headers = {
    token: localStorage.getItem("token"),
    "Content-Type": "application/json",
  };

  // Remplacez 'url_de_votre_api' par l'URL de votre API
  let res = await axios.post(
    `http://localhost:3000/api/decrypt/${encryptedPassword}`,
    {},
    { headers }
  );

  return res.data.data;
}

// Fonction pour obtenir l'IP et la localisation
async function getIPInfo(ipAddress) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`);
    console.log(response);
    return {
      ip: response.data.query,
      city: response.data.city,
      region: response.data.regionName,
      country: response.data.country,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des informations IP:", error);
    return {
      ip: "N/A",
      city: "N/A",
      region: "N/A",
      country: "N/A",
    };
  }
}

// Fonction pour formater le timestamp en date lisible
function formatDate(timestamp) {
  const date = new Date(timestamp);

  const options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false, // Utilisation du format 24 heures
  };

  return date.toLocaleString("fr-FR", options); // Format français pour la date
}

function createCard(clientName, subRecolte, hasMessages, accountInfo) {
  const cardContainer = document.getElementById("cardContainer");

  const card = document.createElement("div");
  card.className = "card";

  const cardHeader = document.createElement("div");
  cardHeader.className = "card-header";

  const clientNameElement = document.createElement("div");
  clientNameElement.className = "client-name";
  clientNameElement.textContent = clientName;

  const subRecolteElement = document.createElement("div");
  subRecolteElement.className = "sub-recolte";
  subRecolteElement.textContent = subRecolte;

  cardHeader.appendChild(clientNameElement);
  cardHeader.appendChild(subRecolteElement);

  const cardFooter = document.createElement("div");
  cardFooter.className = "card-footer";

  icons.forEach((iconPath, index) => {
    const iconElement = document.createElement("div");
    iconElement.className = "icon";

    if (index === 0 && hasMessages) {
      const notificationIcon = document.createElement("span");
      notificationIcon.className = "notification-icon";
      iconElement.appendChild(notificationIcon);
    }

    const img = document.createElement("img");
    img.src = iconPath;
    img.alt = "icon";
    img.style.width = "20px";
    img.style.height = "20px";
    iconElement.appendChild(img);

    cardFooter.appendChild(iconElement);

    // Ajouter un gestionnaire d'événement de clic pour chaque icône
    iconElement.addEventListener("click", () => {
      switch (index) {
        case 0:
          // Placeholder pour gérer le clic sur l'icône de message
          alert(`Messages pour ${clientName}`);
          break;
        case 1:
          // Afficher le menu des informations de compte avec les données spécifiques
          toggleMenu(card, getAccountInfoMenu(accountInfo));
          break;
        case 2:
          // Afficher le menu des opérations financières
          toggleMenu(card, getMoneyOperationMenu(clientName));
          break;
        case 3:
          // Afficher le menu de confirmation
          toggleMenu(card, getConfirmationMenu(clientName));
          break;
      }
    });
  });

  card.appendChild(cardHeader);
  card.appendChild(cardFooter);

  cardContainer.appendChild(card);
}

function getAccountInfoMenu(accountInfo) {
  // Emojis correspondants à chaque champ d'information
  const emojis = {
    username: "👤",
    password: "🔐",
    ip: "🌐",
    location: "📍",
    money: "💰",
    createdAt: "📅",
  };

  // Menu des informations de compte avec les données spécifiques du client
  const menu = document.createElement("div");
  menu.className = "menu show";

  createCloseButton(menu);

  for (const [key, value] of Object.entries(accountInfo)) {
    const menuItem = document.createElement("div");
    menuItem.className = "menu-item";

    // Vérifier si un emoji correspondant existe pour ce champ
    const emoji = emojis[key] ? emojis[key] : "";
    if (key == "money") {
      menuItem.innerHTML = `<strong>${emoji} ${key}:</strong> <span>${value}€</span>`;
      menu.appendChild(menuItem);
    } else {
      menuItem.innerHTML = `<strong>${emoji} ${key}:</strong> <span>${value}</span>`;
      menu.appendChild(menuItem);
    }
  }

  return menu;
}

function toggleMenu(card, menu) {
  const existingMenu = card.querySelector(".menu");
  if (existingMenu) {
    card.removeChild(existingMenu);
  } else {
    card.appendChild(menu);
  }
}

function createCloseButton(menu) {
  const closeButton = document.createElement("button");
  closeButton.className = "menu-close";
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => {
    menu.remove();
  });
  menu.appendChild(closeButton);
}

function getCardByUsername(username) {
  const cards = document.querySelectorAll(".card"); // Sélectionner toutes les cartes

  for (let card of cards) {
    const clientNameElement = card.querySelector(".card-header .client-name");
    if (
      clientNameElement &&
      clientNameElement.textContent.trim() === username
    ) {
      return card; // Retourner la carte correspondante
    }
  }

  return null; // Si aucune carte n'a été trouvée
}

function getMoneyOperationMenu(username) {
  // Menu pour les opérations financières
  const menu = document.createElement("div");
  menu.className = "menu show";

  createCloseButton(menu);

  const header = document.createElement("div");
  header.className = "menu-header";

  // Récupérer le montant actuel depuis la carte correspondante
  const currentAmount =
    getCardByUsername(username).childNodes[0].childNodes[1].innerHTML;

  header.textContent = `💰 Argent: ${currentAmount}`; // Mettre à jour le texte du header avec le montant actuel
  menu.appendChild(header);

  const input = document.createElement("input");
  input.type = "number";
  input.placeholder = "Montant";
  menu.appendChild(input);

  const buttons = document.createElement("div");
  buttons.className = "menu-button";

  const addButton = document.createElement("button");
  addButton.textContent = "Ajouter";
  addButton.addEventListener("click", async () => {
    const token = localStorage.getItem("token"); // Remplacez par votre token réel
    const headers = {
      token: token,
      "Content-Type": "application/json",
    };

    // Remplacez 'url_de_votre_api' par l'URL de votre API
    let response = await axios.post(
      `http://localhost:3000/api/money/add/${input.value}/${username}`,
      {},
      { headers }
    );

    getCardByUsername(
      username
    ).childNodes[0].childNodes[1].innerHTML = `${response.data.newMoney}€`;
    header.textContent = `💰 Argent: ${response.data.newMoney}€`;
    alert(`Ajouté ${input.value}€`);
  });

  const subtractButton = document.createElement("button");
  subtractButton.textContent = "Supprimer";
  subtractButton.addEventListener("click", async () => {
    const token = localStorage.getItem("token"); // Remplacez par votre token réel
    const headers = {
      token: token,
      "Content-Type": "application/json",
    };

    // Remplacez 'url_de_votre_api' par l'URL de votre API
    let response = await axios.post(
      `http://localhost:3000/api/money/remove/${input.value}/${username}`,
      {},
      { headers }
    );

    getCardByUsername(
      username
    ).childNodes[0].childNodes[1].innerHTML = `${response.data.newMoney}€`;
    header.textContent = `💰 Argent: ${response.data.newMoney}€`;
    alert(`Supprimé ${input.value}€`);
  });

  buttons.appendChild(addButton);
  buttons.appendChild(subtractButton);

  menu.appendChild(buttons);

  return menu;
}

function getConfirmationMenu(username) {
  // Menu de confirmation d'action
  const menu = document.createElement("div");
  menu.className = "menu show";

  createCloseButton(menu);

  const header = document.createElement("div");
  header.className = "menu-header";
  header.textContent = "Confirmer l'action ?";
  menu.appendChild(header);

  const buttons = document.createElement("div");
  buttons.className = "menu-button";

  const yesButton = document.createElement("button");
  yesButton.textContent = "Oui";
  yesButton.className = "yes";
  yesButton.addEventListener("click", async () => {
    const token = localStorage.getItem("token"); // Remplacez par votre token réel
    const headers = {
      token: token,
      "Content-Type": "application/json",
    };

    // Remplacez 'url_de_votre_api' par l'URL de votre API
    axios.post(`http://localhost:3000/api/delete/${username}`, {}, { headers });

    getCardByUsername(username).remove();
    alert("Action confirmée !");
  });

  const noButton = document.createElement("button");
  noButton.textContent = "Non";
  noButton.className = "no";
  noButton.addEventListener("click", () => {
    alert("Action annulée !");
  });

  buttons.appendChild(yesButton);
  buttons.appendChild(noButton);

  menu.appendChild(buttons);

  return menu;
}

function sortCardsByMessages() {
  const cardContainer = document.getElementById("cardContainer");
  const cards = Array.from(cardContainer.getElementsByClassName("card"));

  // Trier les cartes par présence de messages (celles avec notification-icon en premier)
  cards.sort((a, b) => {
    const aHasMessages = a.querySelector(".notification-icon") !== null;
    const bHasMessages = b.querySelector(".notification-icon") !== null;

    if (aHasMessages && !bHasMessages) return -1;
    if (!aHasMessages && bHasMessages) return 1;
    return 0;
  });

  // Réarranger les cartes dans le conteneur
  cards.forEach((card) => {
    cardContainer.appendChild(card);
  });
}

function sortCardsByPrice(order) {
  const cardContainer = document.getElementById("cardContainer");
  const cards = Array.from(cardContainer.getElementsByClassName("card"));

  cards.sort((a, b) => {
    const aPrice = parseFloat(
      a.querySelector(".sub-recolte").textContent.replace("€", "")
    );
    const bPrice = parseFloat(
      b.querySelector(".sub-recolte").textContent.replace("€", "")
    );

    if (order === "asc") {
      return aPrice - bPrice;
    } else if (order === "desc") {
      return bPrice - aPrice;
    }
  });

  cards.forEach((card) => {
    cardContainer.appendChild(card);
  });
}

function filterCardsByName(searchTerm) {
  const cardContainer = document.getElementById("cardContainer");
  const cards = Array.from(cardContainer.getElementsByClassName("card"));

  cards.forEach((card) => {
    const clientName = card
      .querySelector(".client-name")
      .textContent.toLowerCase();
    if (clientName.includes(searchTerm.toLowerCase())) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}
