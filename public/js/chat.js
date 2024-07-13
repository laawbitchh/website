if (!localStorage.getItem("token")) {
  window.location.href = "/login";
}

const token = localStorage.getItem("token");

const ws = new WebSocket("ws://localhost:3001");

const getUsername = async () => {
  try {
    let resp = await axios.get(`http://localhost:3000/api/verify/${token}`);
    return resp.data.data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du nom d'utilisateur:",
      error
    );
    return null;
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const messageInput = document.getElementById("message-input");
  const messageArea = document.getElementById("message-area");
  const sendButton = document.getElementById("send-button");

  let previousSender = null; // Variable pour suivre l'émetteur précédent

  function createMessageElement(msg, dir, showProfilePic) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message " + dir;

    // Création de la bulle de texte
    const bubbleDiv = document.createElement("div");
    bubbleDiv.className = "bubble";
    bubbleDiv.textContent = msg;

    // Ajout de la bulle de texte
    if (dir === "right") {
      messageDiv.appendChild(bubbleDiv); // Ajoute la bulle avant la photo de profil à droite
    }

    // Ajout de la photo de profil si nécessaire
    if (showProfilePic && (dir !== previousSender || previousSender === null)) {
      const profilePicContainer = document.createElement("div");
      profilePicContainer.className = "profile-pic";

      const profilePic = document.createElement("img");
      profilePic.className = "profile-pic";
      profilePic.src =
        dir === "left" ? "../src/pdp-jess.jpg" : "../src/profile-pc.png";
      profilePic.alt = "Profile Picture";

      profilePicContainer.appendChild(profilePic);

      if (dir === "left") {
        messageDiv.appendChild(profilePicContainer); // Ajoute la photo avant la bulle à gauche
        bubbleDiv.style.marginLeft = "10px";
      } else {
        messageDiv.appendChild(profilePicContainer); // Ajoute la photo après la bulle à droite
        bubbleDiv.style.marginRight = "10px";
      }
    }

    if (dir === "left") {
      messageDiv.appendChild(bubbleDiv); // Ajoute la bulle après la photo de profil à gauche
    }

    previousSender = dir; // Met à jour l'émetteur précédent

    return messageDiv;
  }

  // Fonction pour ajouter un message de Jess (à gauche)
  // Fonction pour ajouter un message de Jess (à gauche)
  function addMessageFromJess(msg) {
    const messageDiv = createMessageElement(msg, "left", true);
    messageArea.insertBefore(messageDiv, messageArea.firstChild); // Insérer au début pour maintenir l'ordre inversé

    // Mettre à jour la position de la barre de défilement pour révéler le nouveau message
    messageArea.scrollTop = messageArea.scrollHeight - messageArea.clientHeight;
  }

  // Fonction pour ajouter un message de l'utilisateur (à droite)
  function addMessageFromUser(msg) {
    const messageDiv = createMessageElement(msg, "right", true);
    messageArea.insertBefore(messageDiv, messageArea.firstChild); // Insérer au début pour maintenir l'ordre inversé

    // Mettre à jour la position de la barre de défilement pour révéler le nouveau message
    messageArea.scrollTop = messageArea.scrollHeight - messageArea.clientHeight;
  }

  // Chargement initial des messages
  async function loadMessages(from, to) {
    try {
      let data = await axios.get(
        `http://localhost:3000/api/messages/${from}/${to}`
      );
      for (let m of data.data) {
        switch (m.from) {
          case "Jess":
            addMessageFromJess(m.content);
            break;
          case await getUsername():
            addMessageFromUser(m.content);
            break;
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
    }
  }

  // Connexion WebSocket et gestion des événements
  ws.onopen = async () => {
    try {
      let msg = {
        event: "connection",
        from: await getUsername(),
      };
      ws.send(JSON.stringify(msg));

      let own = {
        event: "ownConnection",
        from: await getUsername(),
      };
      ws.send(JSON.stringify(own));
    } catch (error) {
      console.error(
        "Erreur lors de l'ouverture de la connexion WebSocket:",
        error
      );
    }
  };

  await loadMessages(await getUsername(), "Jess");
  // Gestion des messages reçus via WebSocket
  ws.onmessage = async (message) => {
    try {
      let data = JSON.parse(message.data);

      if (data.event == "msg") {
        switch (data.from) {
          case "Jess":
            addMessageFromJess(data.content);
            break;
          case await getUsername():
            addMessageFromUser(data.content);
            break;
        }
      }

      if (data.event == "ownerConnection") {
        updateStatusIndicator("En ligne", "#00ff00");
      }

      if (data.event == "ownerDeconnection") {
        updateStatusIndicator("Hors ligne", "#ff0000");
      }

      if (data.event == "ownConnection") {
        updateStatusIndicator(
          data.data ? "En ligne" : "Hors ligne",
          data.data ? "#00ff00" : "#ff0000"
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de la réception d'un message WebSocket:",
        error
      );
    }
  };

  // Envoi de messages depuis l'interface utilisateur
  sendButton.addEventListener("click", async () => {
    try {
      const messageText = messageInput.value.trim();
      if (messageText !== "") {
        addMessageFromUser(messageText); // Ajoute le message de l'utilisateur
        sendMessage(messageText); // Envoie le message via WebSocket
        messageInput.value = ""; // Efface le champ de saisie
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
    }
  });

  // Fonction pour envoyer un message via WebSocket
  async function sendMessage(content) {
    try {
      let msg = {
        event: "msg",
        from: await getUsername(),
        to: "Jess",
        content: content,
        sendAt: Date.now(),
      };
      ws.send(JSON.stringify(msg));
    } catch (error) {
      console.error("Erreur lors de l'envoi du message via WebSocket:", error);
    }
  }

  // Fonction pour mettre à jour l'indicateur de statut
  function updateStatusIndicator(statusText, backgroundColor) {
    const element = document.getElementById("status-text");
    const pastille = document.getElementById("status-indicator");
    if (element.textContent !== statusText) {
      element.textContent = statusText;
      pastille.style.backgroundColor = backgroundColor;
    }
  }
});
