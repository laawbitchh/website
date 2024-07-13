document.addEventListener("DOMContentLoaded", function () {
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

      const response = await axios.post("http://localhost:3000/api/login", {
        username: username,
        password: password,
      });

      if (response.data.code == 404) {
        alert("Pas de compte avec ce nom d'utilisateur.");
      } else if (response.data.code == 403) {
        alert("Nom d'utilisateur ou mot de passe incorrect.");
      }
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        window.location.href = "/chat";
      }
    });
});
