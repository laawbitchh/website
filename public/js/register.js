document.addEventListener("DOMContentLoaded", function () {
  async function getIpAddress() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Erreur:", error);
      return null;
    }
  }
  document
    .getElementById("login-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      if (!username || !password) {
        alert("Veuillez remplir tous les champs.");
        return;
      }

      const response = await axios.post("http://localhost:3000/api/register", {
        username: username,
        password: password,
        ip: await getIpAddress(),
      });
      if (response.data.code == 400) {
        alert("Nom d'utilisateur déjà utilisé");
      }
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        window.location.href = "/chat";
      }
    });
});
